// Pure, client-safe half of "Check my process" (components/ProcessCheck.tsx): run one process's
// pre-serialized step rankings against the reader's account stack (lib/myStack.ts's StackMap)
// entirely in the browser — the same split as lib/myStack.ts vs lib/myStackData.ts. The server
// builder that reads the committed step→story mapping and judged verdicts lives in
// lib/processCheckData.ts; this file must stay free of node builtins.
//
// Honesty contract (inherited from lib/processRankings.ts): every step score here is the
// story-derived weightedPercent the process page already publishes — never recomputed, never
// invented — and every flagged gap names the numbers and links to the pages where the judged
// evidence lives. A step with no covering pick is reported as uncovered, not guessed at.

// One vendor's step score — the lean serialized atom (score = lib/processRankings.ts's
// stepVendorScore over the step's mapped stories, 0–100, one decimal).
export interface CheckVendor {
  productId: string
  name: string
  score: number
}

// One market a step can be served from: the covering arena ('function') or an evidence-gated
// additional arena ('extra' — extraOptionArenas / extraOptionRefs, same gate as
// crossArenaStepRankings). Vendors are ranked best-first.
export interface CheckArena {
  arenaId: string
  arenaName: string
  kind: 'function' | 'extra'
  vendors: CheckVendor[]
}

// One rankable step of the process, pre-serialized by lib/processCheckData.ts. `best` is the
// covering arena's top vendor — the same "best per step" the process leaderboard shows.
export interface ProcessCheckStep {
  nodeId: string
  label: string
  storyCount: number
  arenas: CheckArena[]
  best: CheckVendor & { arenaId: string }
}

// Step-score gap (best − yours) above which the step is flagged as materially behind — roughly
// the story-derived analogue of lib/myStack.ts's BREAKOUT_DELTA: 15 points of judged-story
// coverage is a real capability difference, not ranking noise.
export const STEP_UPGRADE_DELTA = 15

export interface StepCheckResult {
  nodeId: string
  label: string
  storyCount: number
  /** The reader's pick serving this step, resolved via the step's covering arena first, then
   *  its extra arenas — null when no pick has judged evidence on the step's mapped stories. */
  yours: (CheckVendor & { arenaId: string; arenaName: string }) | null
  best: CheckVendor & { arenaId: string }
  /** best − yours, one decimal; null when uncovered. */
  delta: number | null
  /** Covered, but the pick trails the step's best by more than STEP_UPGRADE_DELTA. */
  flagged: boolean
}

export interface ProcessCheckResult {
  steps: StepCheckResult[]
  /** Steps of this process with a story-derived ranking at all (== steps.length). */
  rankableSteps: number
  /** Steps the reader's stack covers with judged evidence. */
  coveredSteps: number
  flaggedSteps: number
  /** Mean of the reader's step scores over covered steps — null when nothing is covered. */
  avgYours: number | null
  /** Mean of the step-best scores over those SAME covered steps (apples-to-apples). */
  avgBest: number | null
}

const round1 = (n: number) => Math.round(n * 10) / 10

// Resolve which of the reader's picks serves one step: arenas are tried in serialized order
// (covering arena first, then extras), and a pick counts only when it appears in that arena's
// judged vendor list for THIS step — a pick with no applicable verdict on the mapped stories
// (or one filtered by the extra-arena evidence gate) does not cover the step.
export function yoursForStep(
  step: ProcessCheckStep,
  stack: Record<string, string>,
): (CheckVendor & { arenaId: string; arenaName: string }) | null {
  for (const arena of step.arenas) {
    const pickId = stack[arena.arenaId]
    if (!pickId) continue
    const vendor = arena.vendors.find((v) => v.productId === pickId)
    if (vendor) return { ...vendor, arenaId: arena.arenaId, arenaName: arena.arenaName }
  }
  return null
}

export function runProcessCheck(
  steps: ProcessCheckStep[],
  stack: Record<string, string>,
): ProcessCheckResult {
  const results: StepCheckResult[] = steps.map((step) => {
    const yours = yoursForStep(step, stack)
    const delta = yours === null ? null : round1(step.best.score - yours.score)
    return {
      nodeId: step.nodeId,
      label: step.label,
      storyCount: step.storyCount,
      yours,
      best: step.best,
      delta,
      // Never flag the step's own best pick (delta 0 by construction, but be explicit).
      flagged:
        yours !== null && yours.productId !== step.best.productId && (delta as number) > STEP_UPGRADE_DELTA,
    }
  })

  const covered = results.filter((r) => r.yours !== null)
  const mean = (values: number[]) =>
    values.length === 0 ? null : round1(values.reduce((a, b) => a + b, 0) / values.length)
  return {
    steps: results,
    rankableSteps: steps.length,
    coveredSteps: covered.length,
    flaggedSteps: results.filter((r) => r.flagged).length,
    avgYours: mean(covered.map((r) => (r.yours as CheckVendor).score)),
    avgBest: mean(covered.map((r) => r.best.score)),
  }
}
