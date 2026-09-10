// Arena Notes generator: drafts a short signed-POV essay (5 paragraphs max) from the same
// derived data the changelog/weekly report/uncertainty pass render — the week's flip that
// matters and why, the gap nobody's filling (from the gap-closers/processes data), the vendor
// move to watch, one honest self-critique of our own data, and a closing line.
//
//   pnpm tsx pipeline/scripts/generate-arena-notes.ts
//
// Unlike generate-weekly-report.ts this is LLM-drafted, so it is held to a hard honesty
// contract enforced in code, not prose:
//   - the model only sees a fact sheet of claims derived from committed site data, each tagged
//     with the site path that renders it;
//   - every paragraph must carry at least one inline "(source: /...)" parenthetical, and every
//     cited source must be one of the fact sheet's paths (schema-enforced via noteSchema, so
//     llmJson's retry loop corrects violations);
//   - the output is a DRAFT, never auto-published: the frontmatter says
//     `status: draft — requires founder sign-off before publishing`, and /notes
//     (app/notes/page.tsx + lib/notes.ts) renders only files a human has edited to
//     `status: published`.
//
// The fact-sheet/render/validation helpers are pure (exported for
// pipeline/__tests__/generate-arena-notes.test.ts); only main() touches fs/network.
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { collectArenaHistories, dayOf, deriveChangelog, historyBegins, type ChangeEvent } from '../../lib/changelog'
import { splitGaps, type GapStep } from '../../lib/gapClosers'
import { loadProcesses } from '../../lib/processes'
import { llmJson } from '../llm'
import {
  collectCloseRaces, eventsInWindow, weeklyMovers, type CloseRace, type Mover,
} from './generate-weekly-report'
import { DATA_DIR, ROOT } from '../paths'

export const DRAFT_STATUS = 'draft — requires founder sign-off before publishing'
export const MAX_PARAGRAPHS = 5

export interface NoteFact {
  /** One self-contained, citable claim derived from committed data. */
  text: string
  /** The site path that renders this claim — the only paths the essay may cite. */
  source: string
}

export interface GapDigest {
  humanGapSteps: number
  irreducibleSteps: number
  /** Non-agent steps with no honest workaround from any live arena — the unfilled gaps. */
  unfilledSteps: number
  /** Most frequent unfilled step labels, most common first. */
  topUnfilledLabels: Array<{ label: string; count: number }>
}

// Aggregate the gap-closers view across the whole founder-process corpus: of the steps no agent
// can run today, how many have an honest workaround from a live arena, how many are judgment/
// identity (irreducible — we never oversell those), and how many are simply unfilled market gaps.
export function digestGaps(
  processes: Array<{ dag: { nodes: Array<{ label: string; route: 'agent' | 'form' | 'person'; async?: boolean }> } }>,
  dir?: string,
): GapDigest {
  let humanGapSteps = 0
  let irreducibleSteps = 0
  const unfilledCounts = new Map<string, number>()
  for (const proc of processes) {
    const steps: GapStep[] = proc.dag.nodes.map((n) => ({ label: n.label, route: n.route, async: n.async }))
    const { human } = splitGaps(steps, dir)
    humanGapSteps += human.length
    for (const gap of human) {
      if (gap.irreducible) irreducibleSteps += 1
      else unfilledCounts.set(gap.label, (unfilledCounts.get(gap.label) ?? 0) + 1)
    }
  }
  const topUnfilledLabels = [...unfilledCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }))
  const unfilledSteps = [...unfilledCounts.values()].reduce((a, b) => a + b, 0)
  return { humanGapSteps, irreducibleSteps, unfilledSteps, topUnfilledLabels }
}

const fmtDelta = (d: number) => `${d > 0 ? '+' : ''}${d.toFixed(1)}`

// The fact sheet: every claim the essay is allowed to make, each tagged with the site path that
// renders it. Nothing the model can't cite goes in; nothing outside it may come out.
export function collectNoteFacts(input: {
  events: ChangeEvent[]
  movers: { up: Mover[]; down: Mover[] }
  closeRaces: CloseRace[]
  gaps: GapDigest
  historyBegins: string | null
}): NoteFact[] {
  const facts: NoteFact[] = []
  for (const e of input.events) {
    if (e.kind !== 'overtake') continue
    facts.push({
      text: `${e.productName} overtook ${e.overtookName} in ${e.categoryName} on ${dayOf(e.date)} (${e.productAiEra.toFixed(1)} vs ${e.overtookAiEra.toFixed(1)} PA Score)`,
      source: `/arena/${e.categoryId}`,
    })
  }
  for (const m of [...input.movers.up, ...input.movers.down]) {
    facts.push({
      text: `${m.productName} moved ${fmtDelta(m.delta)} PA Score this week to ${m.to.toFixed(1)} in ${m.categoryName}`,
      source: `/arena/${m.categoryId}`,
    })
  }
  for (const r of input.closeRaces) {
    const gap = Math.abs(r.top1AiEra - r.top2AiEra)
    facts.push({
      text: `${r.categoryName} is a close race: ${r.top1Name} ${r.top1AiEra.toFixed(1)} vs ${r.top2Name} ${r.top2AiEra.toFixed(1)} (gap ${gap.toFixed(1)}); ${r.contestedCells} decisive cells were triple-judged and ${r.unstableCells} came back unstable`,
      source: `/arena/${r.categoryId}`,
    })
  }
  const g = input.gaps
  facts.push({
    text: `Across the founder-process corpus, ${g.humanGapSteps} steps still need a human; ${g.irreducibleSteps} are judgment/identity work no agent should stand in for, and ${g.unfilledSteps} are unfilled market gaps — no live arena has an honest workaround`,
    source: '/processes',
  })
  for (const { label, count } of g.topUnfilledLabels) {
    facts.push({
      text: `"${label}" appears ${count} time${count === 1 ? '' : 's'} as a process step no agent product covers today`,
      source: '/processes',
    })
  }
  if (input.historyBegins) {
    facts.push({
      text: `Our score history only begins ${input.historyBegins} — movement before that is unrecorded, so "biggest mover" claims have a short baseline`,
      source: '/changelog',
    })
  }
  facts.push({
    text: 'Scores only move when evidence and verdicts are re-derived; the changelog is derived from committed score history, not editorial judgment',
    source: '/changelog',
  })
  return facts
}

export const SOURCE_RE = /\(source:\s*([^)\s]+)\s*\)/g

// Every paragraph must cite at least one source, and every cited path must come from the fact
// sheet. Returns human-readable problems ([] = valid) — used inside noteSchema so llmJson's
// retry loop feeds violations back to the model.
export function validateNoteSources(paragraphs: string[], allowedSources: ReadonlySet<string>): string[] {
  const problems: string[] = []
  paragraphs.forEach((p, i) => {
    const cited = [...p.matchAll(SOURCE_RE)].map((m) => m[1])
    if (cited.length === 0) {
      problems.push(`paragraph ${i + 1} has no inline "(source: /...)" citation`)
    }
    for (const src of cited) {
      if (!allowedSources.has(src)) {
        problems.push(`paragraph ${i + 1} cites "${src}", which is not in the fact sheet's sources`)
      }
    }
  })
  return problems
}

export function noteSchema(allowedSources: ReadonlySet<string>) {
  return z
    .object({
      title: z.string().min(8).max(120),
      paragraphs: z.array(z.string().min(40)).min(4).max(MAX_PARAGRAPHS),
    })
    .superRefine((note, ctx) => {
      for (const problem of validateNoteSources(note.paragraphs, allowedSources)) {
        ctx.addIssue({ code: 'custom', message: problem })
      }
    })
}
export type ArenaNoteDraft = z.infer<ReturnType<typeof noteSchema>>

export function renderNoteMarkdown(note: ArenaNoteDraft, date: string): string {
  return [
    '---',
    `status: ${DRAFT_STATUS}`,
    `title: ${note.title}`,
    `date: ${date}`,
    '---',
    '',
    ...note.paragraphs.flatMap((p) => [p, '']),
  ].join('\n').trimEnd() + '\n'
}

const SYSTEM = `You draft "Arena Notes" for ProductArena — a short, signed point-of-view essay on what moved in the product arenas this week. Voice: direct, specific, a little opinionated, never promotional. Hard rules:
- Every claim of fact MUST come from the provided fact sheet, and every paragraph MUST carry at least one inline citation of the form (source: <path>) using EXACTLY a source path attached to a fact you used. Never invent a path, never cite anything else.
- You may interpret and connect facts (that is the point of view), but interpretation must be clearly reasoning about the cited facts, not new factual claims.
- No hype, no superlatives you can't back, no advice to buy anything.
- This is a DRAFT for human sign-off, not a publication.`

function buildPrompt(facts: NoteFact[], weekEnding: string): string {
  const sheet = facts.map((f, i) => `${i + 1}. ${f.text} (source: ${f.source})`).join('\n')
  return `Fact sheet for the week ending ${weekEnding} (the ONLY permissible factual claims, each with its citable source path):

${sheet}

Write the essay as JSON: {"title": string, "paragraphs": string[]}. Exactly 5 paragraphs, in this order:
1. The week's flip that matters, and why it matters (pick the single most consequential overtake or close race).
2. The gap nobody's filling — use the process-gap facts; be honest about what "unfilled" means.
3. The vendor move to watch — one product whose movement suggests a deliberate push worth watching next week.
4. One honest self-critique of our own data (baseline length, judge instability, anything the facts support).
5. A one-or-two-sentence closing line that still cites a source.

Each paragraph: 2-4 sentences, at least one inline (source: /...) citation. Reply with ONLY the JSON.`
}

async function main(): Promise<void> {
  const now = new Date()
  const weekEnding = dayOf(now.toISOString())
  const arenas = collectArenaHistories(DATA_DIR)
  const events = eventsInWindow(deriveChangelog(arenas), now)
  const facts = collectNoteFacts({
    events,
    movers: weeklyMovers(arenas, now),
    closeRaces: collectCloseRaces(),
    gaps: digestGaps(loadProcesses(DATA_DIR), DATA_DIR),
    historyBegins: historyBegins(arenas),
  })
  const allowedSources = new Set(facts.map((f) => f.source))
  const note = await llmJson({
    schema: noteSchema(allowedSources),
    system: SYSTEM,
    prompt: buildPrompt(facts, weekEnding),
    maxTokens: 4096,
  })
  const outDir = path.join(ROOT, 'drafts', 'arena-notes')
  fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, `${weekEnding}.md`)
  fs.writeFileSync(outFile, renderNoteMarkdown(note, weekEnding))
  console.log(`generate-arena-notes: ${facts.length} facts → ${path.relative(ROOT, outFile)} (${DRAFT_STATUS})`)
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
}
