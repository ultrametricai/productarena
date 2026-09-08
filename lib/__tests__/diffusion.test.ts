import { describe, expect, it } from 'vitest'
import { adoptionNow, diffusionCurve, type FirstTracked } from '@/lib/diffusion'
import type { GlobalStoryCell } from '@/lib/globalStories'

function cell(productId: string, verdict: GlobalStoryCell['verdict'], categoryId = 'payments'): GlobalStoryCell {
  return {
    categoryId,
    categoryName: categoryId.toUpperCase(),
    productId,
    productName: productId.toUpperCase(),
    verdict,
    quality: verdict === 'full' ? 8 : 0,
    evidenceCount: verdict === 'full' ? 2 : 0,
  }
}

const NOW = new Date('2026-11-15T00:00:00Z')

describe('adoptionNow', () => {
  it('counts full and partial as adopters, over all cells', () => {
    const cells = [cell('a', 'full'), cell('b', 'partial'), cell('c', 'none'), cell('d', 'na'), cell('e', 'disputed')]
    expect(adoptionNow(cells)).toEqual({ adopters: 2, total: 5, pct: 40 })
  })

  it('handles the empty case without dividing by zero', () => {
    expect(adoptionNow([])).toEqual({ adopters: 0, total: 0, pct: 0 })
  })
})

describe('diffusionCurve', () => {
  const dates: Record<string, string> = {
    a: '2026-09-03T17:57:17-07:00',
    b: '2026-09-20T00:00:00Z',
    c: '2026-10-12T00:00:00Z',
    d: '2026-11-01T00:00:00Z',
  }
  const firstTracked: FirstTracked = (c) => dates[c.productId] ?? null

  it('grows the denominator as products enter tracking, one point per month', () => {
    const cells = [cell('a', 'full'), cell('b', 'none'), cell('c', 'partial'), cell('d', 'none')]
    const points = diffusionCurve(cells, firstTracked, NOW)
    expect(points).toEqual([
      { month: '2026-09', tracked: 2, adopters: 1, pct: 50 },
      { month: '2026-10', tracked: 3, adopters: 2, pct: 66.7 },
      { month: '2026-11', tracked: 4, adopters: 2, pct: 50 },
    ])
  })

  it('extends the curve through the current month even without new entrants', () => {
    const cells = [cell('a', 'full'), cell('b', 'partial')]
    const points = diffusionCurve(cells, firstTracked, NOW)
    expect(points.map((p) => p.month)).toEqual(['2026-09', '2026-10', '2026-11'])
    expect(points.every((p) => p.pct === 100)).toBe(true)
  })

  it('spans a year boundary', () => {
    const points = diffusionCurve([cell('a', 'full')], () => '2026-12-05T00:00:00Z', new Date('2027-02-01T00:00:00Z'))
    expect(points.map((p) => p.month)).toEqual(['2026-12', '2027-01', '2027-02'])
  })

  it('excludes cells with no first-tracked date from the curve', () => {
    const cells = [cell('a', 'full'), cell('untracked', 'full')]
    const points = diffusionCurve(cells, firstTracked, NOW)
    expect(points[points.length - 1].tracked).toBe(1)
  })

  it('returns [] when nothing has a tracking date yet', () => {
    expect(diffusionCurve([cell('untracked', 'full')], firstTracked, NOW)).toEqual([])
  })

  it('counts the same product in two arenas as two cells (per-cell tracking)', () => {
    const cells = [cell('a', 'full', 'payments'), cell('a', 'none', 'scheduling')]
    const points = diffusionCurve(cells, () => '2026-11-02T00:00:00Z', NOW)
    expect(points).toEqual([{ month: '2026-11', tracked: 2, adopters: 1, pct: 50 }])
  })
})
