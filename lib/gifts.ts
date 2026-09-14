import fs from 'node:fs'
import path from 'node:path'

// The gift-PR program state (drafts/outreach/) parsed for the founder-facing /gifts review
// page. Everything is a BUILD-TIME fs read of files a human maintains — this module never
// fabricates program state, it only surfaces what the outreach lane wrote down:
//
//   - drafts/outreach/GIFT-LIST.md — the ranked candidate table ("## The ranked list") is the
//     spine: rank, product (arena, standing), target repo, the exact gift, verdicts it flips,
//     effort, risk/policy notes.
//   - drafts/outreach/<product>/ — a full draft, when one exists: PR.md (or issue-body.md)
//     carries the verbatim send-ready title/body, NOTES.md the verification log, plus the
//     artifact itself (llms.txt / cert-report.json).
//   - drafts/outreach/<product>/status.json — the per-vendor lifecycle marker. Contract
//     (documented in drafts/outreach/README.md — future lanes update it when a gift is sent):
//       { "status": "sent", "url": "<live PR/issue URL>", "date": "YYYY-MM-DD" }
//     Absent status.json means: dir with a draft file → "drafted"; no dir → "listed".
//
// Every read is tolerant of missing/malformed files (the drafts tree is human-edited): a
// missing GIFT-LIST.md yields [], a missing vendor dir yields a listed-only entry, a broken
// status.json falls back to the inferred status. See lib/__tests__/gifts.test.ts.

const DEFAULT_OUTREACH_DIR = () => path.join(process.cwd(), 'drafts', 'outreach')

export type GiftState = 'sent' | 'drafted' | 'listed'

export interface GiftStatus {
  state: GiftState
  /** Live PR/issue URL — only ever present on `sent` (from status.json). */
  url?: string
  /** ISO date the gift went out — only ever present on `sent` (from status.json). */
  date?: string
}

export interface GiftArtifact {
  /** File name inside the vendor dir (llms.txt, cert-report.json, …). */
  file: string
  lineCount: number
  /** First lines of the artifact, verbatim, for a preview block. */
  preview: string
}

export interface GiftDraft {
  /** Vendor dir name under drafts/outreach/. */
  dir: string
  /** Verbatim suggested PR/issue title from the draft, when one is declared. */
  title: string | null
  /** Verbatim suggested PR/issue body from the draft. */
  body: string | null
  /** Which file the body came from (PR.md / issue-body.md / notification.md). */
  bodyFile: string | null
  /** NOTES.md content (verification log + repo-policy notes), verbatim. */
  notes: string | null
  artifact: GiftArtifact | null
}

export interface GiftEntry {
  rank: number
  /** Product name as written in the list (usually the product id, e.g. "crawl4ai"). */
  product: string
  arena: string
  /** Arena standing as written, e.g. "2/6 @ 36.9" (rank/field @ Arena Score). */
  standing: string
  targetRepo: string
  gift: string
  /** Verdicts/certifications the gift flips, verbatim from the list. */
  flips: string
  effort: string
  risk: string
  status: GiftStatus
  draft: GiftDraft | null
}

function readIfExists(file: string): string | null {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// GIFT-LIST.md ranked-table parsing

/** Splits one markdown table row into trimmed cells (no escaped pipes in this table). */
function tableCells(line: string): string[] {
  return line.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim())
}

/** `crawl4ai (web-scraping, 4/6 @ 30.7)` → { product, arena, standing }. */
export function parseProductCell(cell: string): { product: string; arena: string; standing: string } {
  const m = cell.match(/^(.+?)\s*\(([^,)]+),\s*([^)]+)\)\s*$/)
  if (!m) return { product: cell.trim(), arena: '', standing: '' }
  return { product: m[1].trim(), arena: m[2].trim(), standing: m[3].trim() }
}

/** Ranked rows out of GIFT-LIST.md — rows whose first cell is a number. Empty on any miss. */
export function parseGiftList(markdown: string): Array<Omit<GiftEntry, 'status' | 'draft'>> {
  const rows: Array<Omit<GiftEntry, 'status' | 'draft'>> = []
  for (const line of markdown.split('\n')) {
    if (!/^\|\s*\d+\s*\|/.test(line)) continue
    const cells = tableCells(line)
    if (cells.length < 7) continue
    const { product, arena, standing } = parseProductCell(cells[1])
    rows.push({
      rank: Number(cells[0]),
      product,
      arena,
      standing,
      targetRepo: cells[2],
      gift: cells[3],
      flips: cells[4],
      effort: cells[5],
      risk: cells[6],
    })
  }
  return rows
}

// ---------------------------------------------------------------------------
// Vendor-dir parsing

/** Strips a leading `<!-- … -->` review comment (the draft header) from a draft file. */
function stripLeadingComment(text: string): string {
  const trimmed = text.replace(/^\s+/, '')
  if (!trimmed.startsWith('<!--')) return text.trim()
  const end = trimmed.indexOf('-->')
  return end === -1 ? text.trim() : trimmed.slice(end + 3).trim()
}

/**
 * Verbatim title/body out of a PR.md draft. Two heading dialects exist in the tree
 * ("# Suggested PR title" / "# PR title", same for body) — both are matched; the body runs to
 * the next top-level heading. Null fields when a section is absent.
 */
export function parsePrDraft(text: string): { title: string | null; body: string | null } {
  const lines = text.split('\n')
  let title: string | null = null
  let body: string | null = null
  for (let i = 0; i < lines.length; i++) {
    const heading = lines[i].match(/^#+\s*(?:suggested\s+)?pr\s+(title|body)/i)
    if (!heading) continue
    if (heading[1].toLowerCase() === 'title') {
      const next = lines.slice(i + 1).find((l) => l.trim() !== '')
      if (next) title = next.trim().replace(/^`(.+)`$/, '$1')
    } else {
      const rest: string[] = []
      for (let j = i + 1; j < lines.length && !/^#\s/.test(lines[j]); j++) rest.push(lines[j])
      body = rest.join('\n').trim() || null
    }
  }
  return { title, body }
}

/** `Suggested title: "…"` out of an issue-body.md's leading review comment, if declared. */
function issueTitleFromComment(text: string): string | null {
  const m = text.match(/suggested title:\s*"([^"]+)"/i)
  return m ? m[1] : null
}

const ARTIFACT_PREVIEW_LINES = 14

// The artifact file names a gift can ship (the llms.txt itself / a passing cert report).
// Deliberately a closed list of LITERAL names — a fully dynamic `path.join(dir, anyFile)`
// read makes Next's output file tracing include the entire project (build warning). Extend
// the list when a new gift shape introduces a new artifact kind.
function findArtifact(dir: string): GiftArtifact | null {
  const candidates: Array<[string, string | null]> = [
    ['llms.txt', readIfExists(path.join(dir, 'llms.txt'))],
    ['cert-report.json', readIfExists(path.join(dir, 'cert-report.json'))],
  ]
  for (const [name, content] of candidates) {
    if (content === null) continue
    const lines = content.split('\n')
    return {
      file: name,
      lineCount: lines.length,
      preview: lines.slice(0, ARTIFACT_PREVIEW_LINES).join('\n'),
    }
  }
  return null
}

/** Full draft state for one vendor dir, or null when the dir doesn't exist. */
export function loadGiftDraft(outreachDir: string, dirName: string): GiftDraft | null {
  const dir = path.join(outreachDir, dirName)
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return null

  let title: string | null = null
  let body: string | null = null
  let bodyFile: string | null = null

  const pr = readIfExists(path.join(dir, 'PR.md'))
  if (pr) {
    const parsed = parsePrDraft(pr)
    title = parsed.title
    body = parsed.body
    if (parsed.body) bodyFile = 'PR.md'
  }
  if (!body) {
    // Issue-shaped gifts (docs source closed) and disputed-verdict notifications. Literal
    // file names (not a joined loop variable) so Next's file tracing stays bounded.
    const fallbacks: Array<[string, string | null]> = [
      ['issue-body.md', readIfExists(path.join(dir, 'issue-body.md'))],
      ['notification.md', readIfExists(path.join(dir, 'notification.md'))],
    ]
    for (const [candidate, text] of fallbacks) {
      if (!text) continue
      title = title ?? issueTitleFromComment(text)
      body = stripLeadingComment(text) || null
      if (body) bodyFile = candidate
      break
    }
  }

  return {
    dir: dirName,
    title,
    body,
    bodyFile,
    notes: readIfExists(path.join(dir, 'NOTES.md')),
    artifact: findArtifact(dir),
  }
}

/** status.json → GiftStatus, falling back to drafted/listed. Malformed JSON never throws. */
function resolveStatus(outreachDir: string, dirName: string, draft: GiftDraft | null): GiftStatus {
  const raw = readIfExists(path.join(outreachDir, dirName, 'status.json'))
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { status?: unknown; url?: unknown; date?: unknown }
      if (parsed.status === 'sent') {
        return {
          state: 'sent',
          url: typeof parsed.url === 'string' ? parsed.url : undefined,
          date: typeof parsed.date === 'string' ? parsed.date : undefined,
        }
      }
      if (parsed.status === 'drafted') return { state: 'drafted' }
    } catch {
      /* malformed status.json → fall through to the inferred status */
    }
  }
  return draft?.body || draft?.artifact ? { state: 'drafted' } : { state: 'listed' }
}

/** "nix docs" → "nix-docs": the list's product name is the vendor dir name, kebab-cased. */
function dirNameFor(product: string): string {
  return product.toLowerCase().replace(/\s+/g, '-')
}

/**
 * The whole gift program, ranked: GIFT-LIST.md rows joined with each vendor dir's draft and
 * lifecycle status. Empty array when the list file is missing (never throws).
 */
export function loadGifts(outreachDir: string = DEFAULT_OUTREACH_DIR()): GiftEntry[] {
  const list = readIfExists(path.join(outreachDir, 'GIFT-LIST.md'))
  if (!list) return []
  return parseGiftList(list).map((row) => {
    const draft = loadGiftDraft(outreachDir, dirNameFor(row.product))
    return { ...row, draft, status: resolveStatus(outreachDir, dirNameFor(row.product), draft) }
  })
}
