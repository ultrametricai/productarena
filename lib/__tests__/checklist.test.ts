import { describe, expect, it } from 'vitest'
import {
  checklistMarkdown, checklistThemes, matrixGlyph, priorityForWeight, topWeightedStories,
} from '@/lib/checklist'
import type { CategoryData } from '@/lib/data-helpers'
import type { Story, Verdict } from '@/lib/schemas'

function story(id: string, theme: string, weight: number, capability = id.replace(/-/g, ' ')): Story {
  return { id, persona: 'a developer', title: `As a developer, I can ${capability}`, theme, group: theme, weight }
}

function verdict(productId: string, storyId: string, tier: Verdict['verdict']): Verdict {
  return { productId, storyId, verdict: tier, quality: tier === 'full' ? 8 : 0, confidence: 'high', rationale: 'r', evidenceIds: tier === 'full' ? ['e1'] : [] }
}

const stories = [
  story('take-payment', 'checkout', 3),
  story('refund', 'checkout', 1),
  story('instant-payout', 'payouts', 2),
]

const data: CategoryData = {
  category: { id: 'pay', name: 'Payments', description: '', personas: ['a developer'] },
  products: [
    { id: 'x', name: 'X', vendor: 'v', type: 'oss', urls: { site: 'https://example.com/x' } },
  ],
  stories,
  evidence: {},
  verdicts: [
    verdict('x', 'take-payment', 'full'),
    verdict('x', 'refund', 'na'),
    verdict('x', 'instant-payout', 'none'),
  ],
  rankings: { generatedAt: '2026-01-01T00:00:00.000Z', leaderboard: [], battles: [] },
  stacks: [],
  popularity: {},
  claims: {},
  uncertainty: [],
  vendorResponses: [],
}

describe('priorityForWeight', () => {
  it('maps the 3/2/1 story weights to buyer priorities', () => {
    expect(priorityForWeight(3)).toBe('must-have')
    expect(priorityForWeight(2)).toBe('should-have')
    expect(priorityForWeight(1)).toBe('nice-to-have')
  })
})

describe('checklistThemes / topWeightedStories', () => {
  it('groups by theme in first-seen order, heaviest first within a theme', () => {
    const themes = checklistThemes(stories)
    expect(themes.map(([t]) => t)).toEqual(['checkout', 'payouts'])
    expect(themes[0][1].map((s) => s.id)).toEqual(['take-payment', 'refund'])
  })

  it('selects the top-N stories by weight with stable tie-breaks', () => {
    expect(topWeightedStories(stories, 2).map((s) => s.id)).toEqual(['take-payment', 'instant-payout'])
    expect(topWeightedStories(stories).map((s) => s.id)).toEqual(['take-payment', 'instant-payout', 'refund'])
  })
})

describe('matrixGlyph', () => {
  it('uses the shared glyph vocabulary, with an explicit n/a', () => {
    expect(matrixGlyph(data, 'x', 'take-payment')).toBe('✓')
    expect(matrixGlyph(data, 'x', 'instant-payout')).toBe('—')
    expect(matrixGlyph(data, 'x', 'refund')).toBe('n/a')
  })
})

describe('checklistMarkdown', () => {
  const md = checklistMarkdown(data)

  it('produces a titled, theme-grouped GFM task list with priority tags', () => {
    expect(md).toContain('# Payments — buyer checklist (RFP)')
    expect(md).toContain('## checkout')
    expect(md).toContain('## payouts')
    expect(md).toContain('- [ ] **[must-have]** Take payment')
    expect(md).toContain('- [ ] **[nice-to-have]** Refund')
    expect(md).toContain('- [ ] **[should-have]** Instant payout')
  })

  it('orders each theme heaviest-first and strips persona prefixes', () => {
    expect(md.indexOf('Take payment')).toBeLessThan(md.indexOf('Refund'))
    expect(md).not.toContain('As a developer')
  })

  it('ends with a provenance line back to the arena', () => {
    expect(md).toMatch(/Source: .*\/arena\/pay/)
    expect(md).toMatch(/methodology: .*\/methodology/)
  })
})
