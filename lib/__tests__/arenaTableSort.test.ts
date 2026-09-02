import { describe, expect, it } from 'vitest'
import {
  type ArenaTableRow,
  defaultDirectionFor,
  filterArenaRows,
  sortArenaRows,
} from '@/lib/arenaTableSort'

const rows: ArenaTableRow[] = [
  { productId: 'b', name: 'Bravo', vendor: 'Vendor B', initScore: 40, agentReady: 50, agenticApp: null, apiQuality: 20, openness: 30, automation: 10, popularity: 500, claimsVerified: 60 },
  { productId: 'a', name: 'Alpha', vendor: 'Vendor A', initScore: 80, agentReady: null, agenticApp: 60, apiQuality: 70, openness: 90, automation: 40, popularity: null, claimsVerified: null },
  { productId: 'c', name: 'Charlie', vendor: 'Vendor C', initScore: null, agentReady: 10, agenticApp: 20, apiQuality: null, openness: null, automation: 5, popularity: 200_000, claimsVerified: 90 },
]

describe('sortArenaRows', () => {
  it('sorts a numeric column descending by default, nulls last', () => {
    const sorted = sortArenaRows(rows, 'initScore', 'desc')
    expect(sorted.map((r) => r.productId)).toEqual(['a', 'b', 'c'])
  })

  it('sorts a numeric column ascending, nulls still last', () => {
    const sorted = sortArenaRows(rows, 'initScore', 'asc')
    expect(sorted.map((r) => r.productId)).toEqual(['b', 'a', 'c'])
  })

  it('keeps nulls last on agentReady regardless of direction', () => {
    const desc = sortArenaRows(rows, 'agentReady', 'desc')
    expect(desc.map((r) => r.productId)).toEqual(['b', 'c', 'a'])
    const asc = sortArenaRows(rows, 'agentReady', 'asc')
    expect(asc.map((r) => r.productId)).toEqual(['c', 'b', 'a'])
  })

  it('sorts the popularity column descending by default, nulls last', () => {
    const sorted = sortArenaRows(rows, 'popularity', 'desc')
    expect(sorted.map((r) => r.productId)).toEqual(['c', 'b', 'a'])
  })

  it('sorts the popularity column ascending, nulls still last', () => {
    const sorted = sortArenaRows(rows, 'popularity', 'asc')
    expect(sorted.map((r) => r.productId)).toEqual(['b', 'c', 'a'])
  })

  it('sorts the claimsVerified column descending by default, nulls last', () => {
    const sorted = sortArenaRows(rows, 'claimsVerified', 'desc')
    expect(sorted.map((r) => r.productId)).toEqual(['c', 'b', 'a'])
  })

  it('sorts the claimsVerified column ascending, nulls still last', () => {
    const sorted = sortArenaRows(rows, 'claimsVerified', 'asc')
    expect(sorted.map((r) => r.productId)).toEqual(['b', 'c', 'a'])
  })

  it('sorts name alphabetically ascending', () => {
    const sorted = sortArenaRows(rows, 'name', 'asc')
    expect(sorted.map((r) => r.name)).toEqual(['Alpha', 'Bravo', 'Charlie'])
  })

  it('sorts name reverse-alphabetically descending', () => {
    const sorted = sortArenaRows(rows, 'name', 'desc')
    expect(sorted.map((r) => r.name)).toEqual(['Charlie', 'Bravo', 'Alpha'])
  })

  it('treats rank as an alias for initScore ordering', () => {
    expect(sortArenaRows(rows, 'rank', 'desc').map((r) => r.productId)).toEqual(
      sortArenaRows(rows, 'initScore', 'desc').map((r) => r.productId),
    )
  })

  it('does not mutate the input array', () => {
    const copy = [...rows]
    sortArenaRows(rows, 'initScore', 'desc')
    expect(rows).toEqual(copy)
  })
})

describe('defaultDirectionFor', () => {
  it('defaults numeric columns to descending', () => {
    expect(defaultDirectionFor('initScore')).toBe('desc')
    expect(defaultDirectionFor('agentReady')).toBe('desc')
    expect(defaultDirectionFor('popularity')).toBe('desc')
    expect(defaultDirectionFor('claimsVerified')).toBe('desc')
  })

  it('defaults name to ascending', () => {
    expect(defaultDirectionFor('name')).toBe('asc')
  })
})

describe('filterArenaRows', () => {
  it('returns all rows for an empty query', () => {
    expect(filterArenaRows(rows, '')).toHaveLength(3)
  })

  it('matches case-insensitively on product name', () => {
    expect(filterArenaRows(rows, 'alph').map((r) => r.productId)).toEqual(['a'])
  })

  it('matches on vendor too', () => {
    expect(filterArenaRows(rows, 'vendor c').map((r) => r.productId)).toEqual(['c'])
  })

  it('returns no rows when nothing matches', () => {
    expect(filterArenaRows(rows, 'zzz')).toHaveLength(0)
  })
})
