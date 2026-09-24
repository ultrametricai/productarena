import { describe, expect, it } from 'vitest'
import type { CategoryData } from '@/lib/data'
import { batchLabel, batchOrdinal, buildYcRows, sortYcRows, ycBatchSummaries } from '@/lib/yc'

// Minimal synthetic CategoryData: only the fields lib/yc.ts reads (category id/name,
// products id/name/type/ycBatch, rankings.leaderboard entries). Cast through unknown — the
// full CategoryData shape is irrelevant to these units.
function cat(
  id: string,
  products: { id: string; name: string; ycBatch?: string }[],
  leaderboard: { productId: string; agentReady: number | null; agenticApp: number | null; aiEra: number | null }[],
): CategoryData {
  return {
    category: { id, name: id.toUpperCase() },
    products: products.map((p) => ({ ...p, type: 'commercial' })),
    rankings: { leaderboard },
  } as unknown as CategoryData
}

describe('batchOrdinal / batchLabel', () => {
  it('orders YC batch codes by year then season (W < X < S < F)', () => {
    const codes = ['F24', 'W25', 'X25', 'S24', 'W16', 'F26']
    const sorted = [...codes].sort((a, b) => batchOrdinal(a)! - batchOrdinal(b)!)
    expect(sorted).toEqual(['W16', 'S24', 'F24', 'W25', 'X25', 'F26'])
  })

  it('rejects non-batch strings', () => {
    expect(batchOrdinal('yc')).toBeNull()
    expect(batchOrdinal('W2023')).toBeNull()
  })

  it('expands codes to YC season names (X is Spring)', () => {
    expect(batchLabel('W23')).toBe('Winter 2023')
    expect(batchLabel('X25')).toBe('Spring 2025')
    expect(batchLabel('S09')).toBe('Summer 2009')
    expect(batchLabel('F24')).toBe('Fall 2024')
  })
})

describe('buildYcRows', () => {
  it('keeps only YC-stamped products and dedupes by product id on highest Overall score', () => {
    const rows = buildYcRows([
      cat('a', [{ id: 'p1', name: 'P1', ycBatch: 'W23' }, { id: 'p2', name: 'P2' }], [
        { productId: 'p1', agentReady: 50, agenticApp: 10, aiEra: 40 },
        { productId: 'p2', agentReady: 90, agenticApp: 90, aiEra: 90 },
      ]),
      cat('b', [{ id: 'p1', name: 'P1', ycBatch: 'W23' }], [
        { productId: 'p1', agentReady: 60, agenticApp: 20, aiEra: 55 },
      ]),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0].arenaId).toBe('b') // aiEra 55 beats 40
    expect(rows[0].ycBatch).toBe('W23')
  })
})

describe('sortYcRows / ycBatchSummaries', () => {
  const rows = buildYcRows([
    cat(
      'a',
      [
        { id: 'x', name: 'X', ycBatch: 'S22' },
        { id: 'y', name: 'Y', ycBatch: 'S22' },
        { id: 'z', name: 'Z', ycBatch: 'W25' },
      ],
      [
        { productId: 'x', agentReady: null, agenticApp: 5, aiEra: 10 },
        { productId: 'y', agentReady: 70, agenticApp: 1, aiEra: 30 },
        { productId: 'z', agentReady: 40, agenticApp: 2, aiEra: 20 },
      ],
    ),
  ])

  it('ranks by agent readiness with nulls last', () => {
    const sorted = sortYcRows(rows.filter((r) => r.ycBatch === 'S22'))
    expect(sorted.map((r) => r.productId)).toEqual(['y', 'x'])
  })

  it('summarizes batches newest-first with the most agent-ready leader', () => {
    const batches = ycBatchSummaries(rows)
    expect(batches.map((b) => b.code)).toEqual(['W25', 'S22'])
    expect(batches[1].count).toBe(2)
    expect(batches[1].leader?.productId).toBe('y')
    expect(batches[0].label).toBe('Winter 2025')
  })
})
