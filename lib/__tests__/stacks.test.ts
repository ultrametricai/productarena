import { describe, expect, it } from 'vitest'
import type { CategoryData } from '@/lib/data'
import type { Category, Product, Stack, Story, Verdict } from '@/lib/schemas'
import { stackCoverage } from '@/lib/stacks'

const category: Category = { id: 'cat', name: 'Cat', description: 'd', personas: ['dev'] }
const products: Product[] = [
  { id: 'a', name: 'A', vendor: 'v', type: 'oss', urls: { site: 'https://a.example' } },
  { id: 'b', name: 'B', vendor: 'v', type: 'oss', urls: { site: 'https://b.example' } },
]
const stories: Story[] = [
  { id: 's1', persona: 'dev', title: 't1', theme: 'core', group: 'core-basics', weight: 2 },
  { id: 's2', persona: 'dev', title: 't2', theme: 'core', group: 'core-basics', weight: 1 },
  { id: 's3', persona: 'ai-native', title: 't3', theme: 'agenticness', group: 'agent-access', weight: 3 },
]

const v = (productId: string, storyId: string, verdict: Verdict['verdict'], quality: number): Verdict => ({
  productId, storyId, verdict, quality, confidence: 'high', rationale: 'r',
  evidenceIds: verdict === 'none' || verdict === 'na' ? [] : ['e1'],
})

function makeData(verdicts: Verdict[]): CategoryData {
  return {
    category,
    products,
    stories,
    evidence: {},
    verdicts,
    rankings: { generatedAt: '2026-08-26T00:00:00.000Z', leaderboard: [], battles: [] },
    stacks: [],
  }
}

const stack: Stack = { id: 'ab', name: 'A + B', productIds: ['a', 'b'] }

describe('stackCoverage', () => {
  it('takes the best member cell per story', () => {
    // s1: a=full/10 (score 20), b=partial/10 (score 12) -> best is a's full
    // s2: a=none/0 (score 0), b=full/8 (score 8) -> best is b's full
    // s3: a=na, b=na -> both na, excluded from denominator
    const data = makeData([
      v('a', 's1', 'full', 10), v('a', 's2', 'none', 0), v('a', 's3', 'na', 0),
      v('b', 's1', 'partial', 10), v('b', 's2', 'full', 8), v('b', 's3', 'na', 0),
    ])
    const cov = stackCoverage(stack, data)
    // applicable: s1 (weight 2, score 20), s2 (weight 1, score 8). denom = (2+1)*10 = 30
    // numerator = 20 + 8 = 28 -> 93.3%
    expect(cov.applicable).toBe(2)
    expect(cov.total).toBe(3)
    expect(cov.score).toBeCloseTo(93.3, 1)
  })

  it('excludes a story only when ALL members are na', () => {
    const data = makeData([
      v('a', 's1', 'na', 0), v('a', 's2', 'full', 10), v('a', 's3', 'na', 0),
      v('b', 's1', 'full', 10), v('b', 's2', 'full', 10), v('b', 's3', 'na', 0),
    ])
    const cov = stackCoverage(stack, data)
    // s1: a na, b full -> not all-na, so b's full counts (not excluded)
    // s3: both na -> excluded
    expect(cov.applicable).toBe(2)
    expect(cov.themeScores.agenticness).toBeNull()
  })

  it('propagates null agentReady when no member has an applicable agent-access cell', () => {
    const data = makeData([
      v('a', 's1', 'full', 10), v('a', 's2', 'full', 10), v('a', 's3', 'na', 0),
      v('b', 's1', 'full', 10), v('b', 's2', 'full', 10), v('b', 's3', 'na', 0),
    ])
    const cov = stackCoverage(stack, data)
    expect(cov.agentReady).toBeNull()
    expect(cov.agenticApp).toBeNull()
  })

  it('surfaces a non-null agentReady score when at least one member has an applicable cell', () => {
    const data = makeData([
      v('a', 's1', 'full', 10), v('a', 's2', 'full', 10), v('a', 's3', 'na', 0),
      v('b', 's1', 'full', 10), v('b', 's2', 'full', 10), v('b', 's3', 'full', 9),
    ])
    const cov = stackCoverage(stack, data)
    expect(cov.agentReady).toBe(90)
  })

  it('scores agenticApp independently from agentReady over the agentic-features group', () => {
    const stories2: Story[] = [
      ...stories,
      { id: 's4', persona: 'ai-native', title: 't4', theme: 'agenticness', group: 'agentic-features', weight: 2 },
    ]
    const data: CategoryData = { ...makeData([]), stories: stories2 }
    data.verdicts = [
      v('a', 's1', 'full', 10), v('a', 's2', 'full', 10), v('a', 's3', 'na', 0), v('a', 's4', 'full', 10),
      v('b', 's1', 'full', 10), v('b', 's2', 'full', 10), v('b', 's3', 'na', 0), v('b', 's4', 'na', 0),
    ]
    const cov = stackCoverage(stack, data)
    expect(cov.agentReady).toBeNull()
    expect(cov.agenticApp).toBe(100)
  })
})
