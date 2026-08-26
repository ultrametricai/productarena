import { describe, expect, it } from 'vitest'
import type { Product, Story, Verdict } from '@/lib/schemas'
import { buildRankings, cellScore } from '@/lib/scoring'

const products: Product[] = [
  { id: 'a', name: 'A', vendor: 'v', type: 'oss', urls: { site: 'https://a.example' } },
  { id: 'b', name: 'B', vendor: 'v', type: 'oss', urls: { site: 'https://b.example' } },
]
const stories: Story[] = [
  { id: 's1', persona: 'dev', title: 't1', theme: 'core', weight: 2 },
  { id: 's2', persona: 'dev', title: 't2', theme: 'core', weight: 1 },
  { id: 's3', persona: 'dev', title: 't3', theme: 'extras', weight: 1 },
]
const v = (productId: string, storyId: string, verdict: Verdict['verdict'], quality: number): Verdict => ({
  productId, storyId, verdict, quality, confidence: 'high', rationale: 'r',
  evidenceIds: verdict === 'none' ? [] : ['e1'],
})

describe('cellScore', () => {
  it('applies weight x quality x factor', () => {
    expect(cellScore(v('a', 's1', 'full', 10), stories[0])).toBe(20)
    expect(cellScore(v('a', 's1', 'partial', 10), stories[0])).toBe(12)
    expect(cellScore(v('a', 's1', 'disputed', 10), stories[0])).toBe(6)
    expect(cellScore(v('a', 's1', 'none', 10), stories[0])).toBe(0)
  })
})

describe('buildRankings', () => {
  const verdicts = [
    v('a', 's1', 'full', 10), v('a', 's2', 'full', 10), v('a', 's3', 'none', 0),
    v('b', 's1', 'none', 0), v('b', 's2', 'full', 10), v('b', 's3', 'full', 10),
  ]
  const r = buildRankings(products, stories, verdicts, '2026-08-26T00:00:00.000Z')

  it('normalizes product scores to 0-100 and sorts descending', () => {
    // max possible = (2+1+1)*10 = 40. a: 20+10+0=30 -> 75. b: 0+10+10=20 -> 50.
    expect(r.leaderboard).toEqual([
      expect.objectContaining({ productId: 'a', score: 75 }),
      expect.objectContaining({ productId: 'b', score: 50 }),
    ])
  })

  it('computes per-theme scores', () => {
    expect(r.leaderboard[0].themeScores).toEqual({ core: 100, extras: 0 })
    expect(r.leaderboard[1].themeScores).toEqual({ core: 33.3, extras: 100 })
  })

  it('derives rounds with draws on exact ties', () => {
    const battle = r.battles[0]
    expect([battle.a, battle.b]).toEqual(['a', 'b'])
    expect(battle.rounds).toEqual([
      { storyId: 's1', winner: 'a', margin: 20 },
      { storyId: 's2', winner: 'draw', margin: 0 },
      { storyId: 's3', winner: 'b', margin: 10 },
    ])
    expect(battle.record).toEqual({ aWins: 1, bWins: 1, draws: 1 })
  })

  it('weights the battle winner by story weight', () => {
    // a won s1 (weight 2), b won s3 (weight 1) -> a wins despite equal round count
    expect(r.battles[0].winner).toBe('a')
  })

  it('throws on a missing cell, naming it', () => {
    expect(() => buildRankings(products, stories, verdicts.slice(1), 'x'))
      .toThrow(/a:s1/)
  })
})
