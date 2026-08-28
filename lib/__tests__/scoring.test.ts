import { describe, expect, it } from 'vitest'
import type { Product, Story, Verdict } from '@/lib/schemas'
import { buildRankings, cellScore } from '@/lib/scoring'

const products: Product[] = [
  { id: 'a', name: 'A', vendor: 'v', type: 'oss', urls: { site: 'https://a.example' } },
  { id: 'b', name: 'B', vendor: 'v', type: 'oss', urls: { site: 'https://b.example' } },
]
const stories: Story[] = [
  { id: 's1', persona: 'dev', title: 't1', theme: 'core', group: 'core-basics', weight: 2 },
  { id: 's2', persona: 'dev', title: 't2', theme: 'core', group: 'core-basics', weight: 1 },
  { id: 's3', persona: 'dev', title: 't3', theme: 'extras', group: 'extras-misc', weight: 1 },
]
const v = (productId: string, storyId: string, verdict: Verdict['verdict'], quality: number): Verdict => ({
  productId, storyId, verdict, quality, confidence: 'high', rationale: 'r',
  evidenceIds: verdict === 'none' ? [] : ['e1'],
})
const vNa = (productId: string, storyId: string): Verdict => ({
  productId, storyId, verdict: 'na', quality: 0, confidence: 'high', rationale: 'wrong axis', evidenceIds: [],
})

describe('cellScore', () => {
  it('applies weight x quality x factor', () => {
    expect(cellScore(v('a', 's1', 'full', 10), stories[0])).toBe(20)
    expect(cellScore(v('a', 's1', 'partial', 10), stories[0])).toBe(12)
    expect(cellScore(v('a', 's1', 'disputed', 10), stories[0])).toBe(6)
    expect(cellScore(v('a', 's1', 'none', 10), stories[0])).toBe(0)
  })

  it('returns 0 for na', () => {
    expect(cellScore(vNa('a', 's1'), stories[0])).toBe(0)
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

  it('reports applicable and total counts (no na cells here)', () => {
    expect(r.leaderboard[0]).toMatchObject({ applicable: 3, total: 3 })
    expect(r.leaderboard[1]).toMatchObject({ applicable: 3, total: 3 })
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

describe('na handling', () => {
  // stories: s1 w2 theme core, s2 w1 theme core, s3 w1 theme extras (as v1), all with group fields
  const verdicts = [
    v('a', 's1', 'full', 10), v('a', 's2', 'full', 10), vNa('a', 's3'),
    v('b', 's1', 'none', 0), v('b', 's2', 'full', 10), v('b', 's3', 'full', 10),
  ]
  const r = buildRankings(products, stories, verdicts, '2026-08-27T00:00:00.000Z')

  it('excludes na cells from the denominator', () => {
    // a: applicable = s1,s2 -> (20+10)/((2+1)*10)*100 = 100
    const a = r.leaderboard.find((e) => e.productId === 'a')!
    expect(a.score).toBe(100)
    expect(a.applicable).toBe(2)
    expect(a.total).toBe(3)
  })

  it('yields null theme score when no applicable cells in theme', () => {
    const a = r.leaderboard.find((e) => e.productId === 'a')!
    expect(a.themeScores.extras).toBeNull()
    expect(a.themeScores.core).toBe(100)
  })

  it('marks rounds na and excludes them from record and winner math', () => {
    const battle = r.battles[0]
    const s3 = battle.rounds.find((x) => x.storyId === 's3')!
    expect(s3).toEqual({ storyId: 's3', winner: 'na', margin: 0 })
    // s1: a full(w2) beats b none -> a win. s2: both full(w1) -> draw. s3: na (a side is na) -> excluded.
    expect(battle.record).toEqual({ aWins: 1, bWins: 0, draws: 1 })
    expect(battle.winner).toBe('a') // a's only weighted win (s1, w2) outweighs b's 0
  })
})

describe('agenticness index (split into agentReady and agenticApp)', () => {
  const storiesWithAgentic: Story[] = [
    ...stories,
    { id: 's4', persona: 'ai-native', title: 't4', theme: 'agenticness', group: 'agent-access', weight: 3 },
    { id: 's5', persona: 'ai-native', title: 't5', theme: 'agenticness', group: 'agentic-features', weight: 2 },
  ]

  it('surfaces independent agentReady/agenticApp group scores, null when theme absent', () => {
    const verdicts = [
      v('a', 's1', 'full', 10), v('a', 's2', 'full', 10), v('a', 's3', 'full', 10), v('a', 's4', 'full', 10), v('a', 's5', 'none', 0),
      v('b', 's1', 'full', 10), v('b', 's2', 'full', 10), v('b', 's3', 'full', 10), v('b', 's4', 'none', 0), v('b', 's5', 'full', 10),
    ]
    const r = buildRankings(products, storiesWithAgentic, verdicts, '2026-08-27T00:00:00.000Z')
    const a = r.leaderboard.find((e) => e.productId === 'a')!
    const b = r.leaderboard.find((e) => e.productId === 'b')!
    // a: agent-access (s4) full -> 100; agentic-features (s5) none -> 0
    expect(a.agentReady).toBe(100)
    expect(a.agenticApp).toBe(0)
    // b: agent-access (s4) none -> 0; agentic-features (s5) full -> 100
    expect(b.agentReady).toBe(0)
    expect(b.agenticApp).toBe(100)

    // 3-story set has no 'agenticness' theme at all -> both null
    const noAgenticVerdicts = [
      v('a', 's1', 'full', 10), v('a', 's2', 'full', 10), v('a', 's3', 'full', 10),
      v('b', 's1', 'full', 10), v('b', 's2', 'full', 10), v('b', 's3', 'full', 10),
    ]
    const r3 = buildRankings(products, stories, noAgenticVerdicts, '2026-08-27T00:00:00.000Z')
    const a3 = r3.leaderboard.find((e) => e.productId === 'a')!
    expect(a3.agentReady).toBeNull()
    expect(a3.agenticApp).toBeNull()
  })

  it('nulls one group independently when only that group is missing applicable cells', () => {
    const verdicts = [
      v('a', 's1', 'full', 10), v('a', 's2', 'full', 10), v('a', 's3', 'full', 10), vNa('a', 's4'), v('a', 's5', 'full', 8),
      v('b', 's1', 'full', 10), v('b', 's2', 'full', 10), v('b', 's3', 'full', 10), v('b', 's4', 'full', 10), vNa('b', 's5'),
    ]
    const r = buildRankings(products, storiesWithAgentic, verdicts, '2026-08-27T00:00:00.000Z')
    const a = r.leaderboard.find((e) => e.productId === 'a')!
    const b = r.leaderboard.find((e) => e.productId === 'b')!
    expect(a.agentReady).toBeNull()
    expect(a.agenticApp).toBe(80)
    expect(b.agentReady).toBe(100)
    expect(b.agenticApp).toBeNull()
  })
})

describe('zero applicable cells', () => {
  it('scores 0 and nulls all theme scores when every cell is na', () => {
    const verdicts = [
      vNa('a', 's1'), vNa('a', 's2'), vNa('a', 's3'),
      v('b', 's1', 'full', 10), v('b', 's2', 'full', 10), v('b', 's3', 'full', 10),
    ]
    const r = buildRankings(products, stories, verdicts, '2026-08-27T00:00:00.000Z')
    const a = r.leaderboard.find((e) => e.productId === 'a')!
    expect(a.score).toBe(0)
    expect(a.applicable).toBe(0)
    expect(a.total).toBe(3)
    expect(a.themeScores).toEqual({ core: null, extras: null })
    expect(a.agentReady).toBeNull()
    expect(a.agenticApp).toBeNull()
  })
})
