import { describe, expect, it } from 'vitest'
import { accessLine, fmtScore, glyphFor, renderTable } from '../format'
import { METRIC_LABELS, METRICS, metricValue, normalizeMetric } from '../metrics'
import type { LeaderboardEntry } from '../types'

describe('fmtScore', () => {
  it('formats numbers to one decimal and nulls as an em dash', () => {
    expect(fmtScore(62.06)).toBe('62.1')
    expect(fmtScore(0)).toBe('0.0')
    expect(fmtScore(null)).toBe('—')
    expect(fmtScore(undefined)).toBe('—')
  })
})

describe('renderTable', () => {
  const headers = ['#', 'PRODUCT', 'SCORE']
  const rows = [
    ['1', 'Stripe', '48.2'],
    ['2', 'Adyen', '9.0'],
  ]

  it('pads columns and right-aligns where asked, with no ANSI when color is off', () => {
    const out = renderTable(headers, rows, { align: ['r', 'l', 'r'] })
    const lines = out.split('\n')
    expect(lines[0]).toBe('#  PRODUCT  SCORE')
    expect(lines[2]).toBe('1  Stripe    48.2')
    expect(lines[3]).toBe('2  Adyen      9.0')
    expect(out).not.toContain('\u001b')
  })

  it('tints only the highlighted row when color is on, without breaking padding', () => {
    const out = renderTable(headers, rows, { align: ['r', 'l', 'r'], highlightRow: 0, color: true })
    const lines = out.split('\n')
    expect(lines[2]).toContain('\u001b[32m') // green top row
    expect(lines[3]).not.toContain('\u001b[32m')
    // Color applied after padding: stripping ANSI restores the plain line.
    expect(lines[2].replace(/\u001b\[\d+m/g, '')).toBe('1  Stripe    48.2')
  })

  it('sizes columns to the widest cell, header included', () => {
    const out = renderTable(['LONG HEADER'], [['x']])
    expect(out.split('\n')[1]).toBe('-'.repeat('LONG HEADER'.length))
  })
})

describe('glyphs', () => {
  it('uses the site vocabulary: full ✓, partial ~, disputed !, none/na —', () => {
    expect(glyphFor('full')).toBe('✓')
    expect(glyphFor('partial')).toBe('~')
    expect(glyphFor('disputed')).toBe('!')
    expect(glyphFor('none')).toBe('—')
    expect(glyphFor('na')).toBe('—')
    expect(glyphFor(null)).toBe('—')
  })

  it('renders the MCP/CLI/API access line', () => {
    const line = accessLine({ MCP: 'full', CLI: 'partial', API: 'none' }, false)
    expect(line).toBe('MCP ✓  CLI ~  API —')
  })
})

describe('metrics', () => {
  it('normalizes user spellings onto canonical metric names', () => {
    expect(normalizeMetric('agentReady')).toBe('agentReady')
    expect(normalizeMetric('agent-ready')).toBe('agentReady')
    expect(normalizeMetric('arenascore')).toBe('arenaScore')
    expect(normalizeMetric('aiEra')).toBe('arenaScore')
    expect(normalizeMetric('agentic')).toBe('agenticApp')
    expect(normalizeMetric('API')).toBe('apiQuality')
    expect(normalizeMetric('vibes')).toBeNull()
  })

  it('reads arenaScore from the aiEra field and everything else verbatim', () => {
    const entry: LeaderboardEntry = {
      productId: 'x', score: 1, agentReady: 2, agenticApp: 3, apiQuality: 4, aiEra: 5,
      applicable: 1, total: 1, themeScores: {},
    }
    expect(metricValue(entry, 'arenaScore')).toBe(5)
    expect(metricValue(entry, 'agentReady')).toBe(2)
    expect(metricValue(entry, 'score')).toBe(1)
  })

  it('labels every metric', () => {
    for (const metric of METRICS) expect(METRIC_LABELS[metric]).toBeTruthy()
  })
})
