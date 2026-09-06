import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FACETS,
  filterEverythingRows,
  groupRowsByArena,
  hasMcp,
  rowMatchesFacets,
  sortRowsFlat,
  type EverythingFacets,
  type EverythingRow,
} from '../everythingFacets'

function row(overrides: Partial<EverythingRow>): EverythingRow {
  return {
    productId: 'p',
    name: 'Product',
    vendor: 'Vendor',
    arenaId: 'arena-a',
    arenaName: 'Arena A',
    oss: false,
    score: 50,
    agentReady: 50,
    agenticApp: 50,
    grade: 'C',
    access: '———',
    trend: null,
    ...overrides,
  }
}

const facets = (overrides: Partial<EverythingFacets>): EverythingFacets => ({ ...DEFAULT_FACETS, ...overrides })

describe('hasMcp', () => {
  it('counts full and partial MCP glyphs as evidenced', () => {
    expect(hasMcp(row({ access: '✓——' }))).toBe(true)
    expect(hasMcp(row({ access: '~✓✓' }))).toBe(true)
  })

  it('rejects disputed and none — only the FIRST char (MCP) is read', () => {
    expect(hasMcp(row({ access: '!✓✓' }))).toBe(false)
    expect(hasMcp(row({ access: '—✓✓' }))).toBe(false)
  })
})

describe('rowMatchesFacets', () => {
  it('matches everything under the defaults', () => {
    expect(rowMatchesFacets(row({}), DEFAULT_FACETS)).toBe(true)
  })

  it('filters by arena id', () => {
    expect(rowMatchesFacets(row({ arenaId: 'arena-a' }), facets({ arenaId: 'arena-a' }))).toBe(true)
    expect(rowMatchesFacets(row({ arenaId: 'arena-b' }), facets({ arenaId: 'arena-a' }))).toBe(false)
  })

  it('ossOnly keeps only open-source rows', () => {
    expect(rowMatchesFacets(row({ oss: true }), facets({ ossOnly: true }))).toBe(true)
    expect(rowMatchesFacets(row({ oss: false }), facets({ ossOnly: true }))).toBe(false)
  })

  it('mcpOnly keeps only rows with evidenced MCP access', () => {
    expect(rowMatchesFacets(row({ access: '~——' }), facets({ mcpOnly: true }))).toBe(true)
    expect(rowMatchesFacets(row({ access: '—✓✓' }), facets({ mcpOnly: true }))).toBe(false)
  })

  it('confBPlus keeps A and B grades only', () => {
    expect(rowMatchesFacets(row({ grade: 'A' }), facets({ confBPlus: true }))).toBe(true)
    expect(rowMatchesFacets(row({ grade: 'B' }), facets({ confBPlus: true }))).toBe(true)
    expect(rowMatchesFacets(row({ grade: 'C' }), facets({ confBPlus: true }))).toBe(false)
    expect(rowMatchesFacets(row({ grade: 'D' }), facets({ confBPlus: true }))).toBe(false)
  })

  it('query matches name, vendor, arena name, and arena id, case-insensitively', () => {
    const r = row({ name: 'Stripe', vendor: 'Stripe Inc', arenaId: 'payments', arenaName: 'Payments' })
    expect(rowMatchesFacets(r, facets({ query: 'stri' }))).toBe(true)
    expect(rowMatchesFacets(r, facets({ query: 'INC' }))).toBe(true)
    expect(rowMatchesFacets(r, facets({ query: 'payme' }))).toBe(true)
    expect(rowMatchesFacets(r, facets({ query: 'banking' }))).toBe(false)
    // whitespace-only queries are no-ops
    expect(rowMatchesFacets(r, facets({ query: '   ' }))).toBe(true)
  })

  it('facets compose (AND semantics)', () => {
    const r = row({ oss: true, access: '✓——', grade: 'D' })
    expect(rowMatchesFacets(r, facets({ ossOnly: true, mcpOnly: true }))).toBe(true)
    expect(rowMatchesFacets(r, facets({ ossOnly: true, mcpOnly: true, confBPlus: true }))).toBe(false)
  })
})

describe('filterEverythingRows', () => {
  it('keeps original order of the survivors', () => {
    const rows = [
      row({ productId: 'a', oss: true }),
      row({ productId: 'b', oss: false }),
      row({ productId: 'c', oss: true }),
    ]
    expect(filterEverythingRows(rows, facets({ ossOnly: true })).map((r) => r.productId)).toEqual(['a', 'c'])
  })
})

describe('groupRowsByArena', () => {
  const all = [
    row({ productId: 'a1', name: 'Leader A', arenaId: 'arena-a', arenaName: 'Arena A' }),
    row({ productId: 'a2', name: 'Second A', arenaId: 'arena-a', arenaName: 'Arena A' }),
    row({ productId: 'b1', name: 'Leader B', arenaId: 'arena-b', arenaName: 'Arena B' }),
  ]

  it('groups visible rows in first-seen arena order', () => {
    const groups = groupRowsByArena(all, all)
    expect(groups.map((g) => g.arenaId)).toEqual(['arena-a', 'arena-b'])
    expect(groups[0].rows.map((r) => r.productId)).toEqual(['a1', 'a2'])
  })

  it('keeps the canonical leader even when facets filter it out', () => {
    const visible = all.filter((r) => r.productId !== 'a1')
    const groups = groupRowsByArena(all, visible)
    const arenaA = groups.find((g) => g.arenaId === 'arena-a')!
    expect(arenaA.leaderName).toBe('Leader A')
    expect(arenaA.rows.map((r) => r.productId)).toEqual(['a2'])
  })

  it('drops arenas with no visible rows', () => {
    const groups = groupRowsByArena(all, all.filter((r) => r.arenaId === 'arena-b'))
    expect(groups.map((g) => g.arenaId)).toEqual(['arena-b'])
  })
})

describe('sortRowsFlat', () => {
  it('sorts by agent-readiness desc with nulls last, ties by score then name', () => {
    const rows = [
      row({ productId: 'none', name: 'Zed', agentReady: null }),
      row({ productId: 'low', name: 'Low', agentReady: 10 }),
      row({ productId: 'tie-b', name: 'Bravo', agentReady: 80, score: 70 }),
      row({ productId: 'tie-a', name: 'Alpha', agentReady: 80, score: 70 }),
      row({ productId: 'tie-hi', name: 'Hi score', agentReady: 80, score: 90 }),
    ]
    expect(sortRowsFlat(rows).map((r) => r.productId)).toEqual(['tie-hi', 'tie-a', 'tie-b', 'low', 'none'])
  })

  it('does not mutate the input', () => {
    const rows = [row({ productId: 'b', agentReady: 1 }), row({ productId: 'a', agentReady: 2 })]
    sortRowsFlat(rows)
    expect(rows.map((r) => r.productId)).toEqual(['b', 'a'])
  })
})
