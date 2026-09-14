import { describe, expect, it } from 'vitest'
import {
  DEFAULT_COMPARE_IDS,
  encodeCompareParam,
  initialCompareIds,
  MAX_COMPARE,
  parseCompareParam,
  rowWinners,
  sharedThemes,
  themeLabel,
  type CompareProduct,
} from '../compare'

const VALID = new Set(['stripe', 'mercury', 'claude-code', 'linear', 'github', 'slack', 'posthog'])

function product(overrides: Partial<CompareProduct>): CompareProduct {
  return {
    id: 'p',
    name: 'P',
    arenaId: 'a',
    arenaName: 'A',
    type: 'commercial',
    aiEra: null,
    agentReady: null,
    agenticApp: null,
    apiQuality: null,
    themeScores: {},
    access: { MCP: '—', CLI: '—', API: '—' },
    hasLogo: false,
    ...overrides,
  }
}

describe('initialCompareIds', () => {
  it('defaults to linear vs asana when ?p= is entirely absent', () => {
    expect(DEFAULT_COMPARE_IDS).toEqual(['linear', 'asana'])
    expect(initialCompareIds(null, new Set(['linear', 'asana', 'jira']))).toEqual(['linear', 'asana'])
  })

  it('filters the default against the live product set instead of erroring', () => {
    expect(initialCompareIds(null, new Set(['linear', 'jira']))).toEqual(['linear'])
    expect(initialCompareIds(null, new Set(['jira']))).toEqual([])
  })

  it('respects an explicit ?p= (deep links keep working, empty means empty)', () => {
    expect(initialCompareIds('stripe,mercury', VALID)).toEqual(['stripe', 'mercury'])
    expect(initialCompareIds('', VALID)).toEqual([])
  })

  it('every default id is a real tracked product (guards renames)', async () => {
    const { loadAll } = await import('../data')
    const ids = new Set(loadAll().flatMap((d) => d.products.map((p) => p.id)))
    for (const id of DEFAULT_COMPARE_IDS) expect(ids.has(id), `${id} tracked`).toBe(true)
  })
})

describe('parseCompareParam', () => {
  it('parses a comma-separated id list', () => {
    expect(parseCompareParam('stripe,mercury,claude-code', VALID)).toEqual(['stripe', 'mercury', 'claude-code'])
  })

  it('returns [] for null/empty input', () => {
    expect(parseCompareParam(null, VALID)).toEqual([])
    expect(parseCompareParam('', VALID)).toEqual([])
    expect(parseCompareParam(undefined, VALID)).toEqual([])
  })

  it('drops unknown ids (stale share links degrade, not error)', () => {
    expect(parseCompareParam('stripe,defunct-product,mercury', VALID)).toEqual(['stripe', 'mercury'])
  })

  it('dedupes and trims', () => {
    expect(parseCompareParam(' stripe , stripe,mercury,, ', VALID)).toEqual(['stripe', 'mercury'])
  })

  it(`caps at MAX_COMPARE (${MAX_COMPARE})`, () => {
    const ids = parseCompareParam('stripe,mercury,claude-code,linear,github,slack,posthog', VALID)
    expect(ids).toHaveLength(MAX_COMPARE)
    expect(ids).not.toContain('posthog')
  })

  it('round-trips through encodeCompareParam', () => {
    const ids = ['stripe', 'mercury', 'claude-code']
    expect(parseCompareParam(encodeCompareParam(ids), VALID)).toEqual(ids)
  })
})

describe('sharedThemes', () => {
  it('returns only themes scored non-null for at least two selected products', () => {
    const a = product({ id: 'a', themeScores: { openness: 50, 'automation-depth': 20, solo: 10 } })
    const b = product({ id: 'b', themeScores: { openness: 70, 'automation-depth': null } })
    expect(sharedThemes([a, b])).toEqual(['openness'])
  })

  it('is empty for a single product (no comparison to make)', () => {
    expect(sharedThemes([product({ themeScores: { openness: 50 } })])).toEqual([])
  })

  it('preserves first-appearance order across the selection', () => {
    const a = product({ id: 'a', themeScores: { zeta: 1, alpha: 2 } })
    const b = product({ id: 'b', themeScores: { alpha: 3, zeta: 4 } })
    expect(sharedThemes([a, b])).toEqual(['zeta', 'alpha'])
  })
})

describe('rowWinners', () => {
  it('returns indices of the max value', () => {
    expect(rowWinners([10, 30, 20])).toEqual([1])
  })

  it('returns every index tied at the max', () => {
    expect(rowWinners([30, 30, 20])).toEqual([0, 1])
  })

  it('ignores nulls when finding the max', () => {
    expect(rowWinners([null, 15, 40])).toEqual([2])
  })

  it('returns [] when fewer than two values are non-null', () => {
    expect(rowWinners([null, null])).toEqual([])
    expect(rowWinners([42, null])).toEqual([])
    expect(rowWinners([])).toEqual([])
  })
})

describe('themeLabel', () => {
  it('prettifies hyphenated theme ids', () => {
    expect(themeLabel('automation-depth')).toBe('Automation depth')
    expect(themeLabel('openness')).toBe('Openness')
  })
})
