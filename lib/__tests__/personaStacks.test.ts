import { describe, expect, it } from 'vitest'
import type { CategoryData } from '@/lib/data'
import type { Category, Product, Story, Verdict } from '@/lib/schemas'
import { allPersonaStacks, personaStacks } from '@/lib/personaStacks'

const category: Category = { id: 'cat', name: 'Cat', description: 'd', personas: ['dev', 'designer'] }
const products: Product[] = [
  { id: 'a', name: 'A', vendor: 'v', type: 'oss', urls: { site: 'https://a.example' } },
  { id: 'b', name: 'B', vendor: 'v', type: 'oss', urls: { site: 'https://b.example' } },
  { id: 'c', name: 'C', vendor: 'v', type: 'oss', urls: { site: 'https://c.example' } },
]
const stories: Story[] = [
  { id: 'd1', persona: 'dev', title: 'As a developer, I can d1', theme: 'core', group: 'core-basics', weight: 2 },
  { id: 'd2', persona: 'dev', title: 'As a developer, I can d2', theme: 'core', group: 'core-basics', weight: 1 },
  { id: 'g1', persona: 'designer', title: 'As a designer, I can g1', theme: 'core', group: 'core-basics', weight: 1 },
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
    popularity: {},
    claims: {},
    uncertainty: [],
    vendorResponses: [],
  }
}

describe('personaStacks', () => {
  it('ranks products by persona-weighted coverage over only that persona\'s stories', () => {
    const data = makeData([
      v('a', 'd1', 'full', 10), v('a', 'd2', 'full', 10), v('a', 'g1', 'none', 0),
      v('b', 'd1', 'none', 0), v('b', 'd2', 'none', 0), v('b', 'g1', 'full', 10),
      v('c', 'd1', 'partial', 5), v('c', 'd2', 'full', 10), v('c', 'g1', 'na', 0),
    ])
    const result = personaStacks(data, 'dev')
    expect(result.storyCount).toBe(2)
    expect(result.winner?.productId).toBe('a')
    expect(result.winner?.score).toBe(100)
    expect(result.runnerUp?.productId).toBe('c')
  })

  it('excludes a product with zero applicable cells for the persona rather than ranking it at 0', () => {
    const data = makeData([
      v('a', 'd1', 'full', 10), v('a', 'd2', 'full', 10), v('a', 'g1', 'none', 0),
      v('b', 'd1', 'na', 0), v('b', 'd2', 'na', 0), v('b', 'g1', 'full', 10),
      v('c', 'd1', 'full', 10), v('c', 'd2', 'full', 10), v('c', 'g1', 'na', 0),
    ])
    const result = personaStacks(data, 'dev')
    // b has no applicable dev-persona cells (both na) -> excluded, not scored 0.
    expect([result.winner?.productId, result.runnerUp?.productId]).not.toContain('b')
  })

  it('returns null winner/runnerUp when the category has no stories for the persona', () => {
    const data = makeData([])
    const result = personaStacks(data, 'nonexistent-persona')
    expect(result.storyCount).toBe(0)
    expect(result.winner).toBeNull()
    expect(result.runnerUp).toBeNull()
  })

  it('returns null runnerUp when only one product has applicable cells', () => {
    const data = makeData([
      v('a', 'd1', 'full', 10), v('a', 'd2', 'full', 10), v('a', 'g1', 'none', 0),
      v('b', 'd1', 'na', 0), v('b', 'd2', 'na', 0), v('b', 'g1', 'full', 10),
      v('c', 'd1', 'na', 0), v('c', 'd2', 'na', 0), v('c', 'g1', 'na', 0),
    ])
    const result = personaStacks(data, 'dev')
    expect(result.winner?.productId).toBe('a')
    expect(result.runnerUp).toBeNull()
  })

  it('allPersonaStacks computes one result per category persona, in declared order', () => {
    const data = makeData([
      v('a', 'd1', 'full', 10), v('a', 'd2', 'full', 10), v('a', 'g1', 'none', 0),
      v('b', 'd1', 'none', 0), v('b', 'd2', 'none', 0), v('b', 'g1', 'full', 10),
      v('c', 'd1', 'partial', 5), v('c', 'd2', 'full', 10), v('c', 'g1', 'na', 0),
    ])
    const results = allPersonaStacks(data)
    expect(results.map((r) => r.persona)).toEqual(['dev', 'designer'])
    expect(results[0].winner?.productId).toBe('a')
    expect(results[1].winner?.productId).toBe('b')
  })
})
