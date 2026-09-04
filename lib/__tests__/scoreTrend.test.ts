import { describe, expect, it } from 'vitest'
import { parseScoreHistoryJsonl, roundScore, seriesFor, trendDelta } from '@/lib/scoreTrend'

const NOW = new Date('2026-09-04T00:00:00Z')

function point(date: string, value: number) {
  return { date, value }
}

describe('parseScoreHistoryJsonl', () => {
  it('parses one entry per line, tolerating blank lines and the trailing newline', () => {
    const text =
      '{"productId":"a","date":"2026-08-28T00:00:00Z","aiEra":41.3,"agentReady":38}\n' +
      '\n' +
      '{"productId":"a","date":"2026-09-01T12:20:33-07:00","aiEra":42.1,"agentReady":null}\n'
    expect(parseScoreHistoryJsonl(text)).toEqual([
      { productId: 'a', date: '2026-08-28T00:00:00Z', aiEra: 41.3, agentReady: 38 },
      { productId: 'a', date: '2026-09-01T12:20:33-07:00', aiEra: 42.1, agentReady: null },
    ])
  })

  it('rejects malformed lines loudly (the file is machine-written only)', () => {
    expect(() => parseScoreHistoryJsonl('{"productId":"a"}\n')).toThrow()
  })
})

describe('roundScore', () => {
  it('rounds to 1 decimal and passes null/undefined/NaN through as null', () => {
    expect(roundScore(41.27)).toBe(41.3)
    expect(roundScore(38)).toBe(38)
    expect(roundScore(null)).toBeNull()
    expect(roundScore(undefined)).toBeNull()
    expect(roundScore(Number.NaN)).toBeNull()
  })
})

describe('seriesFor', () => {
  it('drops null values for the requested metric and sorts by date', () => {
    const entries = [
      { productId: 'a', date: '2026-09-02T00:00:00Z', aiEra: 43, agentReady: null },
      { productId: 'a', date: '2026-08-28T00:00:00Z', aiEra: 41.3, agentReady: 38 },
      { productId: 'a', date: '2026-09-01T00:00:00Z', aiEra: null, agentReady: 39 },
    ]
    expect(seriesFor(entries, 'aiEra')).toEqual([
      point('2026-08-28T00:00:00Z', 41.3),
      point('2026-09-02T00:00:00Z', 43),
    ])
    expect(seriesFor(entries, 'agentReady')).toEqual([
      point('2026-08-28T00:00:00Z', 38),
      point('2026-09-01T00:00:00Z', 39),
    ])
  })
})

describe('trendDelta', () => {
  it('is null with fewer than 2 points', () => {
    expect(trendDelta([], NOW)).toBeNull()
    expect(trendDelta([point('2026-09-01T00:00:00Z', 41.3)], NOW)).toBeNull()
  })

  it('uses the value in effect 30 days ago as the baseline (change-only series carries forward)', () => {
    const series = [
      point('2026-06-01T00:00:00Z', 40), // in effect at the 30d cutoff (Aug 5)
      point('2026-08-28T00:00:00Z', 41.3),
      point('2026-09-02T00:00:00Z', 43),
    ]
    expect(trendDelta(series, NOW)).toBe(3)
  })

  it('falls back to the earliest point when the whole history is younger than 30 days', () => {
    const series = [point('2026-08-28T00:00:00Z', 41.3), point('2026-09-02T00:00:00Z', 40)]
    expect(trendDelta(series, NOW)).toBe(-1.3)
  })

  it('is 0 (not null) when nothing moved inside the window', () => {
    const series = [point('2026-05-01T00:00:00Z', 40), point('2026-06-01T00:00:00Z', 41)]
    expect(trendDelta(series, NOW)).toBe(0)
  })

  it('rounds away float noise in the subtraction', () => {
    const series = [point('2026-08-28T00:00:00Z', 61.1), point('2026-09-02T00:00:00Z', 62.3)]
    expect(trendDelta(series, NOW)).toBe(1.2)
  })
})
