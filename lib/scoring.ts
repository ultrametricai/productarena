import type { LeaderboardEntry, Product, Rankings, Story, Verdict } from './schemas'

export const VERDICT_FACTORS: Record<Verdict['verdict'], number> = {
  full: 1.0,
  partial: 0.6,
  disputed: 0.3,
  none: 0,
  na: 0,
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function cellScore(verdict: Verdict, story: Story): number {
  return story.weight * verdict.quality * VERDICT_FACTORS[verdict.verdict]
}

// Weighted percentage over a set of (verdict, story) pairs, restricted to non-na cells.
// Returns null when there are no applicable cells (caller decides whether null or 0 is
// the right fallback for that context — see buildRankings).
function weightedPercent(cells: Array<{ verdict: Verdict; story: Story }>): number | null {
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

      return {
        productId: p.id,
        score,
        agenticness: themeScores['agenticness'] ?? null,
        applicable,
        total: stories.length,
        themeScores,
      }
    })
    .sort((x, y) => y.score - x.score)

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
