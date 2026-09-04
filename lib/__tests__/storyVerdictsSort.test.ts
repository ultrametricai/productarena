import { describe, expect, it } from 'vitest'
import {
  type StoryVerdictRow,
  defaultDirectionFor,
  filterStoryVerdictRows,
  isStoryUntested,
  sortStoryVerdictRows,
} from '@/lib/storyVerdictsSort'

function row(overrides: Partial<StoryVerdictRow> & { storyId: string }): StoryVerdictRow {
  return {
    title: `Story ${overrides.storyId}`,
    persona: 'a developer',
    origin: 'canonical',
    theme: 'core',
    group: 'core',
    weight: 1,
    verdict: 'full',
    quality: 5,
    confidence: 'high',
    rationale: 'because',
    verification: 'vendor-claim',
    evidence: [{ id: 'e1', tier: 'claimed-docs', url: 'https://example.com/doc', excerpt: 'quoted' }],
    proofUrl: null,
    globalHref: null,
    vendorResponse: null,
    ...overrides,
  }
}

describe('isStoryUntested', () => {
  it('is true only for a zero-evidence none/na', () => {
    expect(isStoryUntested(row({ storyId: 'a', verdict: 'none', evidence: [] }))).toBe(true)
    expect(isStoryUntested(row({ storyId: 'b', verdict: 'na', evidence: [] }))).toBe(true)
    expect(isStoryUntested(row({ storyId: 'c', verdict: 'none' }))).toBe(false)
    expect(isStoryUntested(row({ storyId: 'd', verdict: 'full', evidence: [] }))).toBe(false)
  })
})

describe('defaultDirectionFor', () => {
  it('text columns ascend, ranked columns descend', () => {
    expect(defaultDirectionFor('title')).toBe('asc')
    expect(defaultDirectionFor('theme')).toBe('asc')
    expect(defaultDirectionFor('quality')).toBe('desc')
    expect(defaultDirectionFor('verdict')).toBe('desc')
    expect(defaultDirectionFor('weight')).toBe('desc')
    expect(defaultDirectionFor('verification')).toBe('desc')
  })
})

describe('sortStoryVerdictRows', () => {
  it('sorts quality descending with untested cells last', () => {
    const rows = [
      row({ storyId: 'untested', verdict: 'none', quality: 0, evidence: [] }),
      row({ storyId: 'low', quality: 2 }),
      row({ storyId: 'high', quality: 9 }),
    ]
    expect(sortStoryVerdictRows(rows, 'quality', 'desc').map((r) => r.storyId)).toEqual(['high', 'low', 'untested'])
    // untested (null) stays last even ascending — "we don't know" is never the best or worst.
    expect(sortStoryVerdictRows(rows, 'quality', 'asc').map((r) => r.storyId)).toEqual(['low', 'high', 'untested'])
  })

  it('ranks verdict strength full > partial > disputed > none > na', () => {
    const rows = (['na', 'none', 'partial', 'disputed', 'full'] as const).map((v) =>
      row({ storyId: v, verdict: v }),
    )
    expect(sortStoryVerdictRows(rows, 'verdict', 'desc').map((r) => r.storyId)).toEqual([
      'full', 'partial', 'disputed', 'none', 'na',
    ])
  })

  it('ranks verification tested > corroborated > vendor-claim > disputed > unverified', () => {
    const rows = (['unverified', 'vendor-claim', 'tested', 'disputed', 'corroborated'] as const).map((v) =>
      row({ storyId: v, verification: v }),
    )
    expect(sortStoryVerdictRows(rows, 'verification', 'desc').map((r) => r.storyId)).toEqual([
      'tested', 'corroborated', 'vendor-claim', 'disputed', 'unverified',
    ])
  })

  it('sorts title and theme alphabetically, reversible', () => {
    const rows = [
      row({ storyId: 'b', title: 'Bravo', theme: 'zeta' }),
      row({ storyId: 'a', title: 'alpha', theme: 'alpha' }),
    ]
    expect(sortStoryVerdictRows(rows, 'title', 'asc').map((r) => r.storyId)).toEqual(['a', 'b'])
    expect(sortStoryVerdictRows(rows, 'title', 'desc').map((r) => r.storyId)).toEqual(['b', 'a'])
    expect(sortStoryVerdictRows(rows, 'theme', 'asc').map((r) => r.storyId)).toEqual(['a', 'b'])
  })

  it('sorts weight and evidence count numerically', () => {
    const rows = [
      row({ storyId: 'light', weight: 1, evidence: [] }),
      row({ storyId: 'heavy', weight: 3 }),
    ]
    expect(sortStoryVerdictRows(rows, 'weight', 'desc').map((r) => r.storyId)).toEqual(['heavy', 'light'])
    expect(sortStoryVerdictRows(rows, 'evidence', 'desc').map((r) => r.storyId)).toEqual(['heavy', 'light'])
  })

  it('does not mutate the input array', () => {
    const rows = [row({ storyId: 'b', quality: 1 }), row({ storyId: 'a', quality: 9 })]
    sortStoryVerdictRows(rows, 'quality', 'desc')
    expect(rows.map((r) => r.storyId)).toEqual(['b', 'a'])
  })
})

describe('filterStoryVerdictRows', () => {
  const rows = [
    row({ storyId: 'a', title: 'Run the agent', persona: 'an operator', theme: 'agentic', group: 'agent-access' }),
    row({ storyId: 'b', title: 'Export data', persona: 'a developer', theme: 'openness', group: 'openness' }),
  ]

  it('matches title, persona, theme, and group case-insensitively', () => {
    expect(filterStoryVerdictRows(rows, 'AGENT').map((r) => r.storyId)).toEqual(['a'])
    expect(filterStoryVerdictRows(rows, 'operator').map((r) => r.storyId)).toEqual(['a'])
    expect(filterStoryVerdictRows(rows, 'openness').map((r) => r.storyId)).toEqual(['b'])
    expect(filterStoryVerdictRows(rows, '')).toHaveLength(2)
  })

  it('intersects the theme dropdown with the text query', () => {
    expect(filterStoryVerdictRows(rows, '', 'openness').map((r) => r.storyId)).toEqual(['b'])
    expect(filterStoryVerdictRows(rows, 'agent', 'openness')).toHaveLength(0)
  })

  it('filters by exact scope, leaving untagged rows out of any scope selection', () => {
    const scoped = [
      row({ storyId: 'g', scope: 'global' }),
      row({ storyId: 'c', scope: 'category' }),
      row({ storyId: 'p', scope: 'product' }),
      row({ storyId: 'untagged' }),
    ]
    expect(filterStoryVerdictRows(scoped, '', '', 'global').map((r) => r.storyId)).toEqual(['g'])
    expect(filterStoryVerdictRows(scoped, '', '', 'product').map((r) => r.storyId)).toEqual(['p'])
    // Empty scope = no restriction (same contract as the theme dropdown).
    expect(filterStoryVerdictRows(scoped, '', '', '')).toHaveLength(4)
    // Scope intersects the text query and theme like every other filter.
    expect(filterStoryVerdictRows(scoped, 'story g', '', 'category')).toHaveLength(0)
  })
})
