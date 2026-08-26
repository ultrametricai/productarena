import type { Product, Rankings, Story, Verdict } from './schemas'

export const VERDICT_FACTORS: Record<Verdict['verdict'], number> = {
  full: 1.0,
  partial: 0.6,
  disputed: 0.3,
  none: 0,
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function cellScore(verdict: Verdict, story: Story): number {
  return story.weight * verdict.quality * VERDICT_FACTORS[verdict.verdict]
}

export function buildRankings(
  products: Product[],
  stories: Story[],
  verdicts: Verdict[],
  generatedAt: string,
): Rankings {
  const byCell = new Map(verdicts.map((v) => [`${v.productId}:${v.storyId}`, v]))
  const cell = (productId: string, story: Story): number => {
    const v = byCell.get(`${productId}:${story.id}`)
    if (!v) throw new Error(`missing verdict for cell ${productId}:${story.id}`)
    return cellScore(v, story)
  }

  const themes = [...new Set(stories.map((s) => s.theme))]
  const maxFor = (ss: Story[]) => ss.reduce((sum, s) => sum + s.weight * 10, 0)

  const leaderboard = products
    .map((p) => ({
      productId: p.id,
      score: round1((stories.reduce((sum, s) => sum + cell(p.id, s), 0) / maxFor(stories)) * 100),
      themeScores: Object.fromEntries(
        themes.map((t) => {
          const themed = stories.filter((s) => s.theme === t)
          return [t, round1((themed.reduce((sum, s) => sum + cell(p.id, s), 0) / maxFor(themed)) * 100)]
        }),
      ),
    }))
    .sort((x, y) => y.score - x.score)

  const battles: Rankings['battles'] = []
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const a = products[i].id
      const b = products[j].id
      const rounds = stories.map((s) => {
        const sa = cell(a, s)
        const sb = cell(b, s)
        return {
          storyId: s.id,
          winner: sa > sb ? ('a' as const) : sb > sa ? ('b' as const) : ('draw' as const),
          margin: round1(Math.abs(sa - sb)),
        }
      })
      const weightOf = (storyId: string) => stories.find((s) => s.id === storyId)!.weight
      const pts = (side: 'a' | 'b') =>
        rounds.filter((r) => r.winner === side).reduce((sum, r) => sum + weightOf(r.storyId), 0)
      const aPts = pts('a')
      const bPts = pts('b')
      battles.push({
        a,
        b,
        winner: aPts > bPts ? a : bPts > aPts ? b : 'draw',
        record: {
          aWins: rounds.filter((r) => r.winner === 'a').length,
          bWins: rounds.filter((r) => r.winner === 'b').length,
          draws: rounds.filter((r) => r.winner === 'draw').length,
        },
        rounds,
      })
    }
  }

  return { generatedAt, leaderboard, battles }
}
