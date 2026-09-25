// 2026-09-24 adversarial bias audit — foreloop (Ultrametric OWNER product) depth-spike flips.
// Rule set applied (same as the 2026-09-21 audit, README §9 affiliation governance):
//   A. claimed-docs-only evidence carries a quality ceiling — no hands-on/probe, no q8+,
//      and no re-raising of cells the 2026-09-21 audit explicitly capped.
//   B. MCP/API cells are the most bias-sensitive (fleet precedent: mcp verdicts require
//      probe-grade evidence); a single first-party sentence cannot move none -> partial.
//   C. When in doubt, revert the favorable flip.
// Every edit appends a dated audit note to the rationale and patches the judge cache
// (same hash, corrected verdict) so re-judges don't resurrect the overcall.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '..')
const ARENA = 'product-feedback'
const PID = 'foreloop'
const NOTE_PREFIX = '[2026-09-24 adversarial bias audit (depth-spike lane): '
const NOTE_SUFFIX = ' Ultrametric-affiliation governance, README §9.]'

type Row = {
  productId: string
  storyId: string
  verdict: string
  quality: number
  rationale: string
  evidenceIds: string[]
}

// storyId -> { verdict, quality, note, evidenceIds? (restored old citations for full reverts) }
const oldVerdicts: Row[] = JSON.parse(fs.readFileSync(path.join(ROOT, '.pa-tmp-depth', 'pf-verdicts-old.json'), 'utf8'))
const oldByStory = new Map(oldVerdicts.filter((v) => v.productId === PID).map((v) => [v.storyId, v]))

const EDITS: Record<string, { mode: 'revert'; note: string } | { mode: 'cap'; quality: number; note: string }> = {
  'agentic-ai-insights': {
    mode: 'revert',
    note: 'reverted full 7 -> partial 6 — re-upgrade on another claimed-docs item would reverse the standing 2026-09-21 audit ruling on this story (marketing-claims-only posture; productboard graded partial 6 for the identical posture).',
  },
  'agentic-official-cli': {
    mode: 'revert',
    note: 'reverted full 8 -> full 7 — the 2026-09-21 audit set an explicit claimed-docs-only quality ceiling of 7 here; the new CLI snippet is still first-party docs, not a hands-on run.',
  },
  'agentic-mcp-server': {
    mode: 'revert',
    note: 'reverted partial 4 -> none 0 — the sole new citation is one first-party sentence ("The CLI and MCP let agents read and update Foreloop"); fleet precedent requires probe-grade evidence for MCP cells (the most bias-sensitive class) and this arena has no probe module.',
  },
  'agentic-public-api': {
    mode: 'revert',
    note: 'reverted full 8 -> partial 5 — same single-sentence citation as the MCP cell; no endpoint reference, auth docs, or spec. partial -> full on the owner product from one claim line fails the audit.',
  },
  'embed-feedback-widget': {
    mode: 'revert',
    note: 'reverted full 8 -> full 7 — claims-only quality ceiling (script-tag claim, no hands-on embed validation).',
  },
  'agentic-builtin-assistant': {
    mode: 'revert',
    note: 'reverted partial 5 -> partial 4 — quality bump rested on the same one-sentence claim; posture unchanged.',
  },
  'agentic-nl-commands': {
    mode: 'cap',
    quality: 4,
    note: 'flip none -> partial KEPT (concrete documented command syntax: "@foreloop retest", "@foreloop link REF") but quality capped 5 -> 4 under the claimed-docs-only ceiling.',
  },
  'link-spec-to-delivery': {
    mode: 'cap',
    quality: 7,
    note: 'flip partial -> full KEPT (three concretely documented PR<->intention linking mechanisms — the core product workflow) but quality capped 8 -> 7 under the claimed-docs-only ceiling.',
  },
}

const verdictsFile = path.join(ROOT, 'data', ARENA, 'verdicts.json')
const verdicts: Row[] = JSON.parse(fs.readFileSync(verdictsFile, 'utf8'))
let edits = 0
for (let i = 0; i < verdicts.length; i++) {
  const v = verdicts[i]
  if (v.productId !== PID) continue
  const edit = EDITS[v.storyId]
  if (!edit) continue
  const old = oldByStory.get(v.storyId)!
  let next: Row
  if (edit.mode === 'revert') {
    next = {
      ...old,
      rationale: `${old.rationale} ${NOTE_PREFIX}${edit.note}${NOTE_SUFFIX}`,
    }
  } else {
    next = {
      ...v,
      quality: edit.quality,
      rationale: `${v.rationale} ${NOTE_PREFIX}${edit.note}${NOTE_SUFFIX}`,
    }
  }
  verdicts[i] = next
  edits++
  console.log(`AUDIT ${v.storyId}: ${old.verdict}/q${old.quality} (pre) | ${v.verdict}/q${v.quality} (judge) -> ${next.verdict}/q${next.quality}`)
  const cacheFile = path.join(ROOT, 'pipeline', 'cache', 'judge', ARENA, PID, `${v.storyId}.json`)
  if (fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as { hash: string }
    fs.writeFileSync(cacheFile, JSON.stringify({ hash: cached.hash, verdict: next }, null, 2) + '\n')
  }
}
fs.writeFileSync(verdictsFile, JSON.stringify(verdicts, null, 2) + '\n')
console.log(`bias audit applied: ${edits} cells edited (6 reverts, 2 caps), 1 flip kept untouched (jump-to-item-by-shortname partial/q3)`)
