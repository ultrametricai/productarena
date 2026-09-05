// Pure vendor-pick logic for `productarena pick`: rank an arena's leaderboard by one metric
// (optionally OSS-only), take the top two, and flag a close race with the same Δ3.0 convention
// the site uses everywhere (lib/uncertainty.ts isCloseRace / lib/aiStacks.ts CLOSE_CALL_DELTA).
import { metricValue, type Metric } from './metrics.js'
import type { LeaderboardEntry, Product } from './types.js'

export const CLOSE_CALL_DELTA = 3.0

export interface PickCandidate {
  productId: string
  name: string
  vendor: string
  type: Product['type']
  rank: number
  value: number
  score: number
  arenaScore: number | null
}

export interface PickResult {
  metric: Metric
  ossOnly: boolean
  // Products actually ranked on this metric (nulls and, with ossOnly, commercial products drop out).
  fieldSize: number
  top: PickCandidate | null
  runnerUp: PickCandidate | null
  delta: number | null
  tooClose: boolean
}

export function pickTop(
  leaderboard: LeaderboardEntry[],
  products: Product[],
  metric: Metric,
  options: { ossOnly?: boolean } = {},
): PickResult {
  const ossOnly = options.ossOnly ?? false
  const byId = new Map(products.map((p) => [p.id, p]))
  const ranked = leaderboard
    .map((entry) => ({ entry, product: byId.get(entry.productId), value: metricValue(entry, metric) }))
    .filter((r): r is { entry: LeaderboardEntry; product: Product; value: number } =>
      r.value !== null && r.product !== undefined && (!ossOnly || r.product.type === 'oss'),
    )
    .sort((a, b) => b.value - a.value)

  const candidates: PickCandidate[] = ranked.map((r, i) => ({
    productId: r.entry.productId,
    name: r.product.name,
    vendor: r.product.vendor,
    type: r.product.type,
    rank: i + 1,
    value: r.value,
    score: r.entry.score,
    arenaScore: r.entry.aiEra,
  }))

  const top = candidates[0] ?? null
  const runnerUp = candidates[1] ?? null
  const delta = top && runnerUp ? Math.round((top.value - runnerUp.value) * 10) / 10 : null
  return {
    metric,
    ossOnly,
    fieldSize: candidates.length,
    top,
    runnerUp,
    delta,
    tooClose: delta !== null && delta <= CLOSE_CALL_DELTA,
  }
}
