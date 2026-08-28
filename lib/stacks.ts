import { verdictFor, type CategoryData } from './data'
import type { Stack, Story, Verdict } from './schemas'
import { cellScore, weightedPercent } from './scoring'

export interface StackCoverage {
  score: number
  agenticness: number | null
  themeScores: Record<string, number | null>
  applicable: number
  total: number
}

// For each story, the stack's cell is whichever member product's verdict scores highest —
// best-of-N composed coverage, not a fight between members. A story only counts as
// inapplicable (na) for the stack when *every* member is na on it.
function bestMemberVerdict(stack: Stack, data: CategoryData, story: Story): Verdict {
  const verdicts = stack.productIds.map((pid) => verdictFor(data, pid, story.id))
  const applicable = verdicts.filter((v) => v.verdict !== 'na')
  if (applicable.length === 0) return verdicts[0]
  return applicable.reduce((best, v) => (cellScore(v, story) > cellScore(best, story) ? v : best))
}

// Composed coverage for a stack of products: same normalization buildRankings uses for a
// single product's leaderboard entry, just fed the stack's best-member-per-story cells
// instead of one product's own cells. Never mutates verdicts/rankings data.
export function stackCoverage(stack: Stack, data: CategoryData): StackCoverage {
  const themes = [...new Set(data.stories.map((s) => s.theme))]
  const cells = data.stories.map((story) => ({ verdict: bestMemberVerdict(stack, data, story), story }))
  const applicable = cells.filter((c) => c.verdict.verdict !== 'na').length
  const score = weightedPercent(cells) ?? 0
  const themeScores: Record<string, number | null> = Object.fromEntries(
    themes.map((t) => [t, weightedPercent(cells.filter((c) => c.story.theme === t))]),
  )

  return {
    score,
    agenticness: themeScores['agenticness'] ?? null,
    themeScores,
    applicable,
    total: data.stories.length,
  }
}
