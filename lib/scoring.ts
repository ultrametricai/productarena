import type { LeaderboardEntry, Product, Rankings, Story, Verdict } from './schemas'

export const VERDICT_FACTORS: Record<Verdict['verdict'], number> = {
  full: 1.0,
  partial: 0.6,
  disputed: 0.3,
  none: 0,
  na: 0,
}

const round1 = (n: number) => Math.round(n * 10) / 10

// The AI-Era Index blends five leaderboard components into one number: how well a product
// works for an agent (agentReady), how good its API surface is once an agent is there
// (apiQuality), how open it is to leave/inspect/self-host (openness — themeScores.openness),
// how agentically it behaves on its own (agenticApp), and how deep its automation primitives
// go (automation — themeScores['automation-depth']). Weights are deliberately contestable —
// see README's "AI-Era Index" section — and are renormalized over whichever components are
// non-null for a given product, so a product missing one axis isn't penalized twice (once for
// the missing axis, once for a shrunken blend).
export const AI_ERA_WEIGHTS = {
  agentReady: 0.3,
  apiQuality: 0.2,
  openness: 0.2,
  agenticApp: 0.15,
  automation: 0.15,
} as const

export interface AiEraComponents {
  agentReady: number | null
  apiQuality: number | null
  openness: number | null
  agenticApp: number | null
  automation: number | null
}

// Weight-renormalized blend of AI_ERA_WEIGHTS over whichever components are non-null. Returns
// null only when every component is null (nothing to blend).
export function computeAiEra(components: AiEraComponents): number | null {
  let totalWeight = 0
  let numerator = 0
  for (const key of Object.keys(AI_ERA_WEIGHTS) as Array<keyof typeof AI_ERA_WEIGHTS>) {
    const value = components[key]
    if (value === null) continue
    const weight: number = AI_ERA_WEIGHTS[key]
    totalWeight += weight
    numerator += value * weight
  }
  if (totalWeight === 0) return null
  return round1(numerator / totalWeight)
}

export function cellScore(verdict: Verdict, story: Story): number {
  return story.weight * verdict.quality * VERDICT_FACTORS[verdict.verdict]
}

// Weighted percentage over a set of (verdict, story) pairs, restricted to non-na cells.
// Returns null when there are no applicable cells (caller decides whether null or 0 is
// the right fallback for that context — see buildRankings). Exported so other consumers
// (e.g. lib/stacks.ts) can reuse the exact same normalization without duplicating it.
export function weightedPercent(cells: Array<{ verdict: Verdict; story: Story }>): number | null {
  const applicable = cells.filter((c) => c.verdict.verdict !== 'na')
  if (applicable.length === 0) return null
  const numerator = applicable.reduce((sum, c) => sum + cellScore(c.verdict, c.story), 0)
  const denominator = applicable.reduce((sum, c) => sum + c.story.weight * 10, 0)
  return round1((numerator / denominator) * 100)
}

export function buildRankings(
  products: Product[],
  stories: Story[],
  verdicts: Verdict[],
  generatedAt: string,
): Rankings {
  const byCell = new Map(verdicts.map((v) => [`${v.productId}:${v.storyId}`, v]))
  const cellVerdict = (productId: string, story: Story): Verdict => {
    const v = byCell.get(`${productId}:${story.id}`)
    if (!v) throw new Error(`missing verdict for cell ${productId}:${story.id}`)
    return v
  }

  const themes = [...new Set(stories.map((s) => s.theme))]

  const leaderboard: LeaderboardEntry[] = products
    .map((p) => {
      const cells = stories.map((s) => ({ verdict: cellVerdict(p.id, s), story: s }))
      const applicable = cells.filter((c) => c.verdict.verdict !== 'na').length

      // A product with zero applicable cells overall has nothing to score: we report 0
      // (not null) so it sorts to the bottom of the leaderboard rather than breaking
      // numeric comparisons/sorts; its themeScores are still null per-theme below.
      const score = weightedPercent(cells) ?? 0

      const themeScores: Record<string, number | null> = Object.fromEntries(
        themes.map((t) => [t, weightedPercent(cells.filter((c) => c.story.theme === t))]),
      )

      // The agenticness theme splits into two group-scoped indexes: agentReady ("can your
      // agent drive it" — group agent-access) and agenticApp ("does the product act
      // agentically itself" — group agentic-features). Each is null when the product has no
      // applicable cells in that group, independent of the other.
      const agentReady = weightedPercent(
        cells.filter((c) => c.story.theme === 'agenticness' && c.story.group === 'agent-access'),
      )
      const agenticApp = weightedPercent(
        cells.filter((c) => c.story.theme === 'agenticness' && c.story.group === 'agentic-features'),
      )
      // API quality is its own group-scoped index under the agenticness theme, same contract
      // as agentReady/agenticApp above: "how good is the API surface once an agent is there."
      const apiQuality = weightedPercent(
        cells.filter((c) => c.story.theme === 'agenticness' && c.story.group === 'api-quality'),
      )
      const aiEra = computeAiEra({
        agentReady,
        apiQuality,
        openness: themeScores['openness'] ?? null,
        agenticApp,
        automation: themeScores['automation-depth'] ?? null,
      })

      return {
        productId: p.id,
        score,
        agentReady,
        agenticApp,
        apiQuality,
        aiEra,
        applicable,
        total: stories.length,
        themeScores,
      }
    })
    // Primary sort is the AI-Era Index (nulls last — a product with no AI-era signal at all
    // ranks below one with any), tie-broken by the coverage score so ordering stays stable
    // when aiEra ties (including the common all-null case, which falls back to score order).
    .sort((x, y) => {
      if (x.aiEra === null && y.aiEra === null) return y.score - x.score
      if (x.aiEra === null) return 1
      if (y.aiEra === null) return -1
      return y.aiEra - x.aiEra || y.score - x.score
    })

  const battles: Rankings['battles'] = []
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const a = products[i].id
      const b = products[j].id
      const rounds = stories.map((s) => {
        const va = cellVerdict(a, s)
        const vb = cellVerdict(b, s)
        if (va.verdict === 'na' || vb.verdict === 'na') {
          return { storyId: s.id, winner: 'na' as const, margin: 0 }
        }
        const sa = cellScore(va, s)
        const sb = cellScore(vb, s)
        return {
          storyId: s.id,
          winner: sa > sb ? ('a' as const) : sb > sa ? ('b' as const) : ('draw' as const),
          margin: round1(Math.abs(sa - sb)),
        }
      })
      const decidedRounds = rounds.filter((r) => r.winner !== 'na')
      const weightOf = (storyId: string) => stories.find((s) => s.id === storyId)!.weight
      const pts = (side: 'a' | 'b') =>
        decidedRounds.filter((r) => r.winner === side).reduce((sum, r) => sum + weightOf(r.storyId), 0)
      const aPts = pts('a')
      const bPts = pts('b')
      battles.push({
        a,
        b,
        winner: aPts > bPts ? a : bPts > aPts ? b : 'draw',
        record: {
          aWins: decidedRounds.filter((r) => r.winner === 'a').length,
          bWins: decidedRounds.filter((r) => r.winner === 'b').length,
          draws: decidedRounds.filter((r) => r.winner === 'draw').length,
        },
        rounds,
      })
    }
  }

  return { generatedAt, leaderboard, battles }
}
