import { describe, expect, it } from 'vitest'
import {
  DEFAULT_COLUMN,
  DEFAULT_DIRECTION,
  defaultDirectionFor,
  filterMegaRowsByArena,
  filterMegaRowsByQuery,
  rankMegaRows,
  sortMegaRows,
  type MegaTableRow,
} from '@/lib/megaTableSort'

const glyph = { char: '—', className: 'text-zinc-400', title: '', href: '/arena/zeta/product/x#story-agentic-public-api' }
const access = { MCP: glyph, CLI: glyph, API: glyph }

const rows: MegaTableRow[] = [
  {
    productId: 'b', name: 'Bravo', vendor: 'Vendor B', type: 'commercial', arenaId: 'zeta', arenaName: 'Zeta',
    hasLogo: false, initScore: 40, agentReady: 50, agenticApp: null, apiQuality: 20, apiUntested: false, popularity: 500, access,
  },
  {
    productId: 'a', name: 'Alpha', vendor: 'Vendor A', type: 'oss', arenaId: 'alpha-arena', arenaName: 'Alpha Arena',
    hasLogo: false, initScore: 80, agentReady: null, agenticApp: 60, apiQuality: 70, apiUntested: false, popularity: null, access,
  },
  {
    productId: 'c', name: 'Charlie', vendor: 'Vendor C', type: 'commercial', arenaId: 'zeta', arenaName: 'Zeta',
    hasLogo: false, initScore: null, agentReady: 10, agenticApp: 20, apiQuality: null, apiUntested: true, popularity: 200_000, access,
  },
]

describe('sortMegaRows', () => {
  it('defaults to AGENTREADYNESS desc, nulls last', () => {
    expect(DEFAULT_COLUMN).toBe('agentReady')
    expect(DEFAULT_DIRECTION).toBe('desc')
    const sorted = sortMegaRows(rows, DEFAULT_COLUMN, DEFAULT_DIRECTION)
    expect(sorted.map((r) => r.productId)).toEqual(['b', 'c', 'a'])
  })

  it('sorts a numeric column ascending, nulls still last', () => {
    const sorted = sortMegaRows(rows, 'agentReady', 'asc')
    expect(sorted.map((r) => r.productId)).toEqual(['c', 'b', 'a'])
  })

  it('sorts the Arena Score column descending by default, nulls last', () => {
    const sorted = sortMegaRows(rows, 'initScore', 'desc')
    expect(sorted.map((r) => r.productId)).toEqual(['a', 'b', 'c'])
  })

  it('sorts name alphabetically ascending', () => {
    const sorted = sortMegaRows(rows, 'name', 'asc')
    expect(sorted.map((r) => r.name)).toEqual(['Alpha', 'Bravo', 'Charlie'])
  })

  it('sorts arena alphabetically ascending', () => {
    const sorted = sortMegaRows(rows, 'arena', 'asc')
    expect(sorted.map((r) => r.arenaName)).toEqual(['Alpha Arena', 'Zeta', 'Zeta'])
  })

  it('treats rank as an alias for AGENTREADYNESS ordering', () => {
    expect(sortMegaRows(rows, 'rank', 'desc').map((r) => r.productId)).toEqual(
      sortMegaRows(rows, 'agentReady', 'desc').map((r) => r.productId),
    )
  })

  it('does not mutate the input array', () => {
    const copy = [...rows]
    sortMegaRows(rows, 'initScore', 'desc')
    expect(rows).toEqual(copy)
  })
})

describe('defaultDirectionFor', () => {
  it('defaults numeric columns to descending', () => {
    expect(defaultDirectionFor('agentReady')).toBe('desc')
    expect(defaultDirectionFor('initScore')).toBe('desc')
    expect(defaultDirectionFor('popularity')).toBe('desc')
  })

  it('defaults name and arena to ascending', () => {
    expect(defaultDirectionFor('name')).toBe('asc')
    expect(defaultDirectionFor('arena')).toBe('asc')
  })
})

describe('filterMegaRowsByQuery', () => {
  it('returns all rows for an empty query', () => {
    expect(filterMegaRowsByQuery(rows, '')).toHaveLength(3)
  })

  it('matches case-insensitively on product name', () => {
    expect(filterMegaRowsByQuery(rows, 'alph').map((r) => r.productId)).toEqual(['a'])
  })

  it('matches on vendor too', () => {
    expect(filterMegaRowsByQuery(rows, 'vendor c').map((r) => r.productId)).toEqual(['c'])
  })
})

describe('filterMegaRowsByArena', () => {
  it('returns all rows for "all"', () => {
    expect(filterMegaRowsByArena(rows, 'all')).toHaveLength(3)
  })

  it('filters down to one arena', () => {
    expect(filterMegaRowsByArena(rows, 'zeta').map((r) => r.productId)).toEqual(['b', 'c'])
  })
})

describe('rankMegaRows', () => {
  it('assigns rank 1 to the global AGENTREADYNESS leader regardless of sort/filter applied elsewhere', () => {
    const ranks = rankMegaRows(rows)
    expect(ranks.get('b')).toBe(1)
    expect(ranks.get('c')).toBe(2)
    expect(ranks.get('a')).toBe(3)
  })
})
