import { describe, expect, it } from 'vitest'
import {
  aggregateBySurface,
  classifyUp,
  currentlyDownSurfaces,
  formatUptimePct,
  hasMatureSloHistory,
  parseSloHistoryJsonl,
  summarizeSlo,
  type SloEntry,
} from '@/lib/slo'

function entry(overrides: Partial<SloEntry> & { date: string; up: boolean }): SloEntry {
  return {
    productId: 'stripe',
    arena: 'payments',
    surface: 'mcp',
    url: 'https://mcp.stripe.com/',
    status: overrides.up === false ? 0 : 200,
    ...overrides,
  }
}

const NOW = new Date('2026-10-08T12:00:00Z')

describe('classifyUp', () => {
  it('counts 2xx as up', () => {
    expect(classifyUp(200)).toBe(true)
    expect(classifyUp(204)).toBe(true)
  })

  it('counts auth-gated / method-fussy answers as up (the surface is alive)', () => {
    for (const status of [400, 401, 403, 405, 406, 429]) expect(classifyUp(status)).toBe(true)
  })

  it('counts 404/410, 5xx and no-response as down', () => {
    for (const status of [0, 404, 410, 500, 502, 503]) expect(classifyUp(status)).toBe(false)
  })
})

describe('parseSloHistoryJsonl', () => {
  it('parses lines and tolerates blank lines', () => {
    const text =
      '{"date":"2026-09-08T00:00:00Z","productId":"stripe","arena":"payments","surface":"mcp","url":"https://mcp.stripe.com/","up":true,"status":401}\n\n'
    const entries = parseSloHistoryJsonl(text)
    expect(entries).toHaveLength(1)
    expect(entries[0].surface).toBe('mcp')
    expect(entries[0].up).toBe(true)
  })

  it('rejects malformed lines (the file is machine-written only)', () => {
    expect(() => parseSloHistoryJsonl('{"date":"x"}')).toThrow()
  })
})

describe('summarizeSlo', () => {
  it('computes window uptime per (arena, product, surface) series', () => {
    const entries = [
      entry({ date: '2026-09-10T00:00:00Z', up: true }),
      entry({ date: '2026-09-20T00:00:00Z', up: false, status: 503 }),
      entry({ date: '2026-09-30T00:00:00Z', up: true }),
      entry({ date: '2026-10-05T00:00:00Z', up: true }),
    ]
    const [s] = summarizeSlo(entries, NOW)
    expect(s.checks).toBe(4)
    expect(s.windowChecks).toBe(4)
    expect(s.windowUptimePct).toBe(75)
    expect(s.currentlyUp).toBe(true)
    expect(s.downSince).toBeNull()
    expect(s.firstDate).toBe('2026-09-10T00:00:00Z')
  })

  it('excludes checks older than the window from the percentage', () => {
    const entries = [
      entry({ date: '2026-08-01T00:00:00Z', up: false, status: 404 }), // outside 30d of NOW
      entry({ date: '2026-09-20T00:00:00Z', up: true }),
      entry({ date: '2026-10-01T00:00:00Z', up: true }),
    ]
    const [s] = summarizeSlo(entries, NOW)
    expect(s.checks).toBe(3)
    expect(s.windowChecks).toBe(2)
    expect(s.windowUptimePct).toBe(100)
  })

  it('reports downSince as the start of the trailing consecutive-down run', () => {
    const entries = [
      entry({ date: '2026-09-25T00:00:00Z', up: true }),
      entry({ date: '2026-10-01T00:00:00Z', up: false, status: 404 }),
      entry({ date: '2026-10-07T00:00:00Z', up: false, status: 404 }),
    ]
    const [s] = summarizeSlo(entries, NOW)
    expect(s.currentlyUp).toBe(false)
    expect(s.downSince).toBe('2026-10-01T00:00:00Z')
    expect(s.lastStatus).toBe(404)
    expect(currentlyDownSurfaces([s])).toHaveLength(1)
  })

  it('keeps distinct surfaces of the same product as separate series, sorted', () => {
    const entries = [
      entry({ date: '2026-10-01T00:00:00Z', up: true, surface: 'mcp' }),
      entry({ date: '2026-10-01T00:00:00Z', up: false, status: 404, surface: 'llms-txt', url: 'https://docs.stripe.com/llms.txt' }),
    ]
    const summaries = summarizeSlo(entries, NOW)
    expect(summaries.map((s) => s.surface)).toEqual(['llms-txt', 'mcp'])
    expect(summaries[0].currentlyUp).toBe(false)
    expect(summaries[1].currentlyUp).toBe(true)
  })

  it('keeps two distinct URLs of the same surface as separate series (docs-MCP vs API-MCP)', () => {
    const entries = [
      entry({ date: '2026-10-01T00:00:00Z', up: true, url: 'https://api.example.com/mcp' }),
      entry({ date: '2026-10-01T00:00:00Z', up: false, status: 503, url: 'https://docs.example.com/mcp' }),
    ]
    const summaries = summarizeSlo(entries, NOW)
    expect(summaries).toHaveLength(2)
    expect(summaries.map((s) => s.currentlyUp)).toEqual([true, false])
  })

  it('treats trailing-slash URL variants as one series', () => {
    const entries = [
      entry({ date: '2026-10-01T00:00:00Z', up: true, url: 'https://mcp.stripe.com/' }),
      entry({ date: '2026-10-02T00:00:00Z', up: true, url: 'https://mcp.stripe.com' }),
    ]
    expect(summarizeSlo(entries, NOW)).toHaveLength(1)
  })

  it('sorts entries by timestamp before summarizing (append order not assumed)', () => {
    const entries = [
      entry({ date: '2026-10-05T00:00:00Z', up: true }),
      entry({ date: '2026-10-01T00:00:00Z', up: false, status: 500 }),
    ]
    const [s] = summarizeSlo(entries, NOW)
    expect(s.currentlyUp).toBe(true)
    expect(s.downSince).toBeNull()
  })
})

describe('aggregateBySurface', () => {
  it('folds multi-endpoint series into one row: combined %, up only when all up', () => {
    const entries = [
      entry({ date: '2026-09-20T00:00:00Z', up: true, url: 'https://api.example.com/mcp' }),
      entry({ date: '2026-10-01T00:00:00Z', up: true, url: 'https://api.example.com/mcp' }),
      entry({ date: '2026-09-20T00:00:00Z', up: true, url: 'https://docs.example.com/mcp' }),
      entry({ date: '2026-10-01T00:00:00Z', up: false, status: 404, url: 'https://docs.example.com/mcp' }),
    ]
    const rows = aggregateBySurface(summarizeSlo(entries, NOW))
    expect(rows).toHaveLength(1)
    expect(rows[0].windowChecks).toBe(4)
    expect(rows[0].windowUptimePct).toBe(75)
    expect(rows[0].currentlyUp).toBe(false)
    expect(rows[0].downSince).toBe('2026-10-01T00:00:00Z')
    expect(rows[0].lastStatus).toBe(404)
  })

  it('passes single-endpoint series through untouched', () => {
    const rows = aggregateBySurface(summarizeSlo([entry({ date: '2026-10-01T00:00:00Z', up: true })], NOW))
    expect(rows).toHaveLength(1)
    expect(rows[0].windowUptimePct).toBe(100)
  })
})

describe('hasMatureSloHistory', () => {
  it('requires 7 days of tracking before a percentage may be quoted', () => {
    const young = summarizeSlo([entry({ date: '2026-10-05T00:00:00Z', up: true })], NOW)[0]
    expect(hasMatureSloHistory(young, NOW)).toBe(false)
    const mature = summarizeSlo(
      [entry({ date: '2026-09-30T00:00:00Z', up: true }), entry({ date: '2026-10-05T00:00:00Z', up: true })],
      NOW,
    )[0]
    expect(hasMatureSloHistory(mature, NOW)).toBe(true)
  })
})

describe('formatUptimePct', () => {
  it('drops trailing .0 and keeps real decimals', () => {
    expect(formatUptimePct(100)).toBe('100%')
    expect(formatUptimePct(99.4)).toBe('99.4%')
  })
})
