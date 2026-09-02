import { describe, expect, it } from 'vitest'
import { buildInitIndex } from '@/components/InitIndexTable'
import type { CategoryData } from '@/lib/data'
import type { Category, Product } from '@/lib/schemas'

const category: Category = { id: 'cat', name: 'Cat', description: 'd', personas: ['dev'] }
const products: Product[] = [
  { id: 'a', name: 'A', vendor: 'v', type: 'oss', urls: { site: 'https://a.example' } },
  { id: 'b', name: 'B', vendor: 'v', type: 'oss', urls: { site: 'https://b.example' } },
  { id: 'c', name: 'C', vendor: 'v', type: 'oss', urls: { site: 'https://c.example' } },
]

function makeData(entries: CategoryData['rankings']['leaderboard']): CategoryData {
  return {
    category,
    products,
    stories: [],
    evidence: {},
    verdicts: [],
    rankings: { generatedAt: '2026-08-26T00:00:00.000Z', leaderboard: entries, battles: [] },
    stacks: [],
    popularity: {},
  }
}

const entry = (productId: string, aiEra: number | null, score: number): CategoryData['rankings']['leaderboard'][number] => ({
  productId, score, agentReady: null, agenticApp: null, apiQuality: null, aiEra, applicable: 1, total: 1, themeScores: {},
})

describe('buildInitIndex', () => {
  it('sorts descending by aiEra across every category, nulls last', () => {
    const data = makeData([entry('a', 40, 40), entry('b', 90, 90), entry('c', null, 10)])
    const rows = buildInitIndex([data])
    expect(rows.map((r) => r.product.id)).toEqual(['b', 'a', 'c'])
  })

  it('ties on aiEra break on the raw coverage score, desc', () => {
    const data = makeData([entry('a', 50, 30), entry('b', 50, 70), entry('c', 50, 50)])
    const rows = buildInitIndex([data])
    expect(rows.map((r) => r.product.id)).toEqual(['b', 'c', 'a'])
  })

  it('merges rows from multiple categories into one flat, sorted list', () => {
    const dataX = makeData([entry('a', 20, 20)])
    const dataY: CategoryData = { ...makeData([entry('b', 80, 80)]), category: { ...category, id: 'cat2' } }
    const rows = buildInitIndex([dataX, dataY])
    expect(rows.map((r) => r.product.id)).toEqual(['b', 'a'])
  })
})
