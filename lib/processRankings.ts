import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { isPopulated, loadCategory } from './data'
import { classifyGapStep } from './gapClosers'
import type { DagNode, ProcessTask } from './processes'
import { STEP_OPTIONS_CAP, VENDOR_ARENA } from './processes'
import type { Story, Verdict } from './schemas'
import { weightedPercent } from './scoring'

// Story-derived step & process rankings — the founder ask: "rank vendors for the overall
// process and for each step, without assuming the user has a vendor — from what stories the
// vendors actually support". Everything here is DERIVATION over already-judged data:
//
//   data/process-step-stories.json  (committed, generated once by
//   pipeline/scripts/map-step-stories.ts — an LLM pass that maps each covered step onto the
//   RELEVANT stories of its covering arena, cached/corrected like classify-story-tiers)
//     ×
//   data/{arena}/verdicts.json      (the judged verdicts — never touched here)
//     =
//   per-step vendor scores (lib/scoring.ts's weightedPercent over exactly the mapped stories,
//   so full=1, partial=0.6, disputed=0.3, none=0, na excluded, story-weighted, 0–100) and a
//   per-process single-vendor leaderboard (coverage × step scores).
//
// Every number traces to verdicts: each vendor's step score carries the full per-story verdict
// citations (StepCite[]) so the UI can expose the evidence behind every pill. This module never
// writes anything and never feeds scoring — same display-only contract as lib/storyTiers.ts.

// ---------------------------------------------------------------------------
// The committed step→stories mapping
// ---------------------------------------------------------------------------

export const STEP_STORY_KINDS = ['function', 'computer-use'] as const

// One mapping: which of arena {arenaId}'s stories are RELEVANT to step {taskId}:{nodeId}.
//   kind 'function'     — the step's covering arena (optionsArenaId, else the canonical
//                         vendor's VENDOR_ARENA arena): "run payroll" → payroll stories.
//   kind 'computer-use' — a temporarily-human step mapped onto the computer-use fleet's
//                         stories (browser-agents; ai-assistants restricted to its judged
//                         computer-use stories) — "agents that could attempt it today".
// storyIds may be empty: an honest "no arena story is genuinely relevant", which consumers
// treat as "no ranking" (the UI falls back to the arena-ordered roster).
export const StepStoryEntrySchema = z.object({
  taskId: z.string().min(1),
  nodeId: z.string().min(1),
  kind: z.enum(STEP_STORY_KINDS),
  arenaId: z.string().min(1),
  storyIds: z.string().min(1).array(),
})

export const StepStoryMapSchema = StepStoryEntrySchema.array()
export type StepStoryEntry = z.infer<typeof StepStoryEntrySchema>

const DEFAULT_DIR = () => path.join(process.cwd(), 'data')
const mapCache = new Map<string, StepStoryEntry[]>()

// Same tolerant-optional contract as lib/storyTiers.ts: a missing mapping file is an empty
// list (no rankings anywhere), never an error.
export function loadStepStoryMap(dir: string = DEFAULT_DIR()): StepStoryEntry[] {
  const hit = mapCache.get(dir)
  if (hit) return hit
  const file = path.join(dir, 'process-step-stories.json')
  const entries = fs.existsSync(file)
    ? StepStoryMapSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')))
    : []
  mapCache.set(dir, entries)
  return entries
}

export function stepStoryKey(taskId: string, nodeId: string, kind: string, arenaId: string): string {
  return `${taskId}:${nodeId}:${kind}:${arenaId}`
}

const indexCache = new Map<string, Map<string, StepStoryEntry>>()

function mapIndex(dir: string = DEFAULT_DIR()): Map<string, StepStoryEntry> {
  const hit = indexCache.get(dir)
  if (hit) return hit
  const idx = new Map(
    loadStepStoryMap(dir).map((e) => [stepStoryKey(e.taskId, e.nodeId, e.kind, e.arenaId), e]),
  )
  indexCache.set(dir, idx)
  return idx
}

// The arena covering one step's general function — the SAME resolution stepVendorOptions
// uses for its roster: the explicit optionsArenaId first, else the canonical vendor's arena.
// This is the single source of truth the mapping generator and every consumer share.
export function coveringArenaId(node: Pick<DagNode, 'optionsArenaId' | 'vendor'>): string | null {
  return node.optionsArenaId ?? (node.vendor ? VENDOR_ARENA[node.vendor] ?? null : null)
}

export function functionMappingFor(taskId: string, node: DagNode, dir?: string): StepStoryEntry | null {
  const arenaId = coveringArenaId(node)
  if (!arenaId) return null
  return mapIndex(dir).get(stepStoryKey(taskId, node.id, 'function', arenaId)) ?? null
}

export function computerUseMappingsFor(taskId: string, nodeId: string, dir?: string): StepStoryEntry[] {
  return COMPUTER_USE_SOURCES
    .map((s) => mapIndex(dir).get(stepStoryKey(taskId, nodeId, 'computer-use', s.arenaId)))
    .filter((e): e is StepStoryEntry => e !== undefined)
}

// ---------------------------------------------------------------------------
// Step scores — weightedPercent over exactly the mapped stories, with full citations
// ---------------------------------------------------------------------------

// One (story, verdict) citation behind a step score — the transparency payload. Every score
// rendered anywhere links back to these, same bar as the /score pages.
export interface StepCite {
  storyId: string
  storyTitle: string
  weight: number
  verdict: Verdict['verdict']
  quality: number
}

export interface StepVendorScore {
  productId: string
  name: string
  arenaId: string
  // weightedPercent over the mapped stories (na excluded), 0–100 rounded to one decimal.
  score: number
  cites: StepCite[]
}

export interface StepStoryRef {
  id: string
  title: string
  weight: number
}

export interface StepRanking {
  arenaId: string
  arenaName: string
  kind: (typeof STEP_STORY_KINDS)[number]
  stories: StepStoryRef[]
  // Ranked best-first by step score; ties broken by the arena's leaderboard order so the
  // ordering is deterministic. Vendors with no applicable judged verdict on any mapped story
  // (all na) are excluded — nothing to rank them on.
  vendors: StepVendorScore[]
}

interface ArenaLookup {
  arenaName: string
  storyById: Map<string, Story>
  verdictByCell: Map<string, Verdict>
  productName: Map<string, string>
  leaderboardRank: Map<string, number>
}

const arenaLookupCache = new Map<string, ArenaLookup>()

function arenaLookup(arenaId: string, dir?: string): ArenaLookup {
  const key = `${dir ?? ''}::${arenaId}`
  const hit = arenaLookupCache.get(key)
  if (hit) return hit
  const data = loadCategory(arenaId, dir)
  const lookup: ArenaLookup = {
    arenaName: data.category.name,
    storyById: new Map(data.stories.map((s) => [s.id, s])),
    verdictByCell: new Map(data.verdicts.map((v) => [`${v.productId}:${v.storyId}`, v])),
    productName: new Map(data.products.map((p) => [p.id, p.name])),
    leaderboardRank: new Map(data.rankings.leaderboard.map((e, i) => [e.productId, i])),
  }
  arenaLookupCache.set(key, lookup)
  return lookup
}

// One vendor's score on one mapped story set — the recomputable atom every ranking is built
// from (tests recompute this straight from verdicts.json and must match). Returns null when
// no mapped story has an applicable (non-na) verdict for the product.
export function stepVendorScore(
  arenaId: string,
  storyIds: string[],
  productId: string,
  dir?: string,
): StepVendorScore | null {
  const lookup = arenaLookup(arenaId, dir)
  const cells: Array<{ verdict: Verdict; story: Story }> = []
  const cites: StepCite[] = []
  for (const sid of storyIds) {
    const story = lookup.storyById.get(sid)
    if (!story) continue // defensive: a stale mapping never crashes a build (tests forbid it anyway)
    const verdict = lookup.verdictByCell.get(`${productId}:${sid}`)
    if (!verdict) continue
    cells.push({ verdict, story })
    cites.push({
      storyId: sid,
      storyTitle: story.title,
      weight: story.weight,
      verdict: verdict.verdict,
      quality: verdict.quality,
    })
  }
  const score = weightedPercent(cells)
  if (score === null) return null
  return {
    productId,
    name: lookup.productName.get(productId) ?? productId,
    arenaId,
    score,
    cites,
  }
}

// All of one arena's products scored on a mapped story set, ranked. Uncapped — callers cap.
function rankVendors(arenaId: string, storyIds: string[], dir?: string): StepVendorScore[] {
  const lookup = arenaLookup(arenaId, dir)
  const scored: StepVendorScore[] = []
  for (const productId of lookup.productName.keys()) {
    const s = stepVendorScore(arenaId, storyIds, productId, dir)
    if (s) scored.push(s)
  }
  return scored.sort(
    (a, b) =>
      b.score - a.score ||
      (arenaLookup(arenaId, dir).leaderboardRank.get(a.productId) ?? 0)
        - (arenaLookup(arenaId, dir).leaderboardRank.get(b.productId) ?? 0),
  )
}

// The ranked market for one step, by STEP relevance: vendors of the covering arena scored on
// the step's mapped stories. Null when the step has no covering arena, no committed mapping,
// or an empty mapping (the UI then falls back to the arena-ordered roster) — never a guess.
export function stepRanking(taskId: string, node: DagNode, dir?: string): StepRanking | null {
  const entry = functionMappingFor(taskId, node, dir)
  if (!entry || entry.storyIds.length === 0) return null
  if (!isPopulated(entry.arenaId, dir)) return null
  const lookup = arenaLookup(entry.arenaId, dir)
  const stories = entry.storyIds
    .map((id) => lookup.storyById.get(id))
    .filter((s): s is Story => s !== undefined)
    .map((s) => ({ id: s.id, title: s.title, weight: s.weight }))
  if (stories.length === 0) return null
  const vendors = rankVendors(entry.arenaId, stories.map((s) => s.id), dir).slice(0, STEP_OPTIONS_CAP)
  if (vendors.length === 0) return null
  return { arenaId: entry.arenaId, arenaName: lookup.arenaName, kind: 'function', stories, vendors }
}

// ---------------------------------------------------------------------------
// The process-level leaderboard: who covers this process best
// ---------------------------------------------------------------------------

export interface ProcessLeaderboardEntry {
  productId: string
  name: string
  arenaId: string
  arenaName: string
  // Rankable steps this vendor actually scored on (its arena covers them, verdicts applicable).
  stepsServed: number
  // Mean step score over the steps served (how WELL it serves what it serves).
  avgStepScore: number
  // The headline: sum of step scores over ALL rankable steps of the process (unserved steps
  // count 0), normalized 0–100 — literally coverage × step quality. A vendor covering 3 of 6
  // rankable steps at 80 each scores 40.
  processScore: number
  steps: Array<{ nodeId: string; label: string; score: number; storyCount: number }>
}

export interface StepBest {
  nodeId: string
  label: string
  arenaId: string
  arenaName: string
  top: StepVendorScore
  storyCount: number
}

export interface ProcessLeaderboard {
  // Steps with a covering arena AND a non-empty committed story mapping — the rankable slice.
  rankableSteps: number
  totalSteps: number
  entries: ProcessLeaderboardEntry[]
  // The "best vendor per step" chain, in DAG node order.
  bestPerStep: StepBest[]
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function processLeaderboard(task: ProcessTask, dir?: string): ProcessLeaderboard {
  interface RankedStep {
    node: DagNode
    arenaId: string
    arenaName: string
    storyIds: string[]
    vendors: StepVendorScore[]
  }
  const rankedSteps: RankedStep[] = []
  for (const node of task.dag.nodes) {
    const entry = functionMappingFor(task.id, node, dir)
    if (!entry || entry.storyIds.length === 0 || !isPopulated(entry.arenaId, dir)) continue
    const lookup = arenaLookup(entry.arenaId, dir)
    const storyIds = entry.storyIds.filter((id) => lookup.storyById.has(id))
    if (storyIds.length === 0) continue
    const vendors = rankVendors(entry.arenaId, storyIds, dir)
    if (vendors.length === 0) continue
    rankedSteps.push({ node, arenaId: entry.arenaId, arenaName: lookup.arenaName, storyIds, vendors })
  }

  const byVendor = new Map<string, ProcessLeaderboardEntry>()
  for (const step of rankedSteps) {
    for (const v of step.vendors) {
      const key = `${v.arenaId}:${v.productId}`
      const e = byVendor.get(key) ?? {
        productId: v.productId,
        name: v.name,
        arenaId: v.arenaId,
        arenaName: step.arenaName,
        stepsServed: 0,
        avgStepScore: 0,
        processScore: 0,
        steps: [],
      }
      e.stepsServed += 1
      e.steps.push({
        nodeId: step.node.id,
        label: step.node.label,
        score: v.score,
        storyCount: step.storyIds.length,
      })
      byVendor.set(key, e)
    }
  }

  const rankable = rankedSteps.length
  const entries = [...byVendor.values()]
    .map((e) => {
      const sum = e.steps.reduce((acc, s) => acc + s.score, 0)
      return {
        ...e,
        avgStepScore: round1(sum / e.stepsServed),
        processScore: rankable === 0 ? 0 : round1(sum / rankable),
      }
    })
    .sort(
      (a, b) =>
        b.processScore - a.processScore ||
        b.stepsServed - a.stepsServed ||
        a.name.localeCompare(b.name),
    )

  const bestPerStep: StepBest[] = rankedSteps.map((s) => ({
    nodeId: s.node.id,
    label: s.node.label,
    arenaId: s.arenaId,
    arenaName: s.arenaName,
    top: s.vendors[0],
    storyCount: s.storyIds.length,
  }))

  return { rankableSteps: rankable, totalSteps: task.dag.nodes.length, entries, bestPerStep }
}

// ---------------------------------------------------------------------------
// Computer use for the temporarily-human steps
// ---------------------------------------------------------------------------

// Where computer-use-capable vendors come from — judged evidence only, never vibes:
//   browser-agents  — the whole arena IS the computer-use fleet (every story judges driving
//                     real browsers), so the full roster is eligible.
//   ai-assistants   — general assistants qualify ONLY via their judged computer-use stories
//                     (Claude computer use, ChatGPT's agent/operator mode…): a product needs a
//                     full/partial verdict on at least one of these to appear at all, and is
//                     scored only on them. (ai-coding / software-factory were checked for
//                     computer-use stories and have none — coding agents don't claim a spot
//                     here without judged browser/computer-use evidence.)
export interface ComputerUseSource {
  arenaId: string
  // null = every story/product of the arena is computer-use by construction.
  storyIds: readonly string[] | null
}

export const COMPUTER_USE_SOURCES: readonly ComputerUseSource[] = [
  { arenaId: 'browser-agents', storyIds: null },
  { arenaId: 'ai-assistants', storyIds: ['browser-agent', 'computer-use-desktop'] },
]

// Eligible computer-use vendors for one source arena: the full roster for a computer-use-native
// arena, else only products with a judged full/partial verdict on one of the source's
// computer-use stories.
export function computerUseEligibleProducts(source: ComputerUseSource, dir?: string): Set<string> {
  const lookup = arenaLookup(source.arenaId, dir)
  if (source.storyIds === null) return new Set(lookup.productName.keys())
  const eligible = new Set<string>()
  for (const pid of lookup.productName.keys()) {
    for (const sid of source.storyIds) {
      const v = lookup.verdictByCell.get(`${pid}:${sid}`)
      if (v && (v.verdict === 'full' || v.verdict === 'partial')) {
        eligible.add(pid)
        break
      }
    }
  }
  return eligible
}

// A temporarily-human step of one task, with node identity (splitGaps only carries labels).
export interface HumanStep {
  taskId: string
  node: DagNode
  reason: string
}

export function temporarilyHumanSteps(tasks: ProcessTask[]): HumanStep[] {
  const out: HumanStep[] = []
  for (const task of tasks) {
    for (const node of task.dag.nodes) {
      const cls = classifyGapStep({ label: node.label, route: node.route, async: node.async })
      if (cls?.kind === 'irreducible') out.push({ taskId: task.id, node, reason: cls.reason })
    }
  }
  return out
}

export interface ComputerUseOption extends StepVendorScore {
  arenaName: string
}

// Ranked "computer use could attempt this today" options for one temporarily-human step, drawn
// from every eligible source across the fleet and scored on the step's committed computer-use
// story mapping. A vendor appears only with a positive story-derived score backed by at least
// one full/partial verdict among the mapped stories — judged evidence, or nothing. The step
// STAYS temporarily human; this is never a claim it's solved.
export function computerUseOptions(taskId: string, nodeId: string, dir?: string): ComputerUseOption[] {
  const options: ComputerUseOption[] = []
  for (const entry of computerUseMappingsFor(taskId, nodeId, dir)) {
    if (entry.storyIds.length === 0 || !isPopulated(entry.arenaId, dir)) continue
    const source = COMPUTER_USE_SOURCES.find((s) => s.arenaId === entry.arenaId)
    if (!source) continue
    const eligible = computerUseEligibleProducts(source, dir)
    const lookup = arenaLookup(entry.arenaId, dir)
    const storyIds = entry.storyIds.filter((id) => lookup.storyById.has(id))
    for (const v of rankVendors(entry.arenaId, storyIds, dir)) {
      if (!eligible.has(v.productId)) continue
      if (v.score <= 0) continue
      if (!v.cites.some((c) => c.verdict === 'full' || c.verdict === 'partial')) continue
      options.push({ ...v, arenaName: lookup.arenaName })
    }
  }
  return options
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, STEP_OPTIONS_CAP)
}
