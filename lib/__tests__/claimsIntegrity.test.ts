import { describe, expect, it } from 'vitest'
import { claimsIntegrity } from '@/lib/claimsIntegrity'
import type { CategoryData } from '@/lib/data'
import type { Category, Claim, Evidence, Product, Story, Verdict } from '@/lib/schemas'

// Same fixture shape as lib/__tests__/claims.test.ts: five stories covering every claim bucket.
const category: Category = { id: 'cat', name: 'Cat', description: 'd', personas: ['dev'] }
const products: Product[] = [{ id: 'p', name: 'P', vendor: 'v', type: 'oss', urls: { site: 'https://p.example' } }]
const stories: Story[] = [
  { id: 's1', persona: 'dev', title: 'claimed + tested', theme: 'core', group: 'g', weight: 1 },
  { id: 's2', persona: 'dev', title: 'claimed + vendor evidence only', theme: 'core', group: 'g', weight: 1 },
  { id: 's3', persona: 'dev', title: 'claimed but disputed', theme: 'core', group: 'g', weight: 1 },
  { id: 's4', persona: 'dev', title: 'delivered but never claimed', theme: 'core', group: 'g', weight: 1 },
  { id: 's5', persona: 'dev', title: 'neither claimed nor delivered', theme: 'core', group: 'g', weight: 1 },
]

const ev = (id: string, tier: Evidence['tier']): Evidence => ({
  id, tier, url: 'https://p.example/e', excerpt: 'x', fetchedAt: '2026-08-27T00:00:00.000Z',
})

const verdict = (storyId: string, over: Partial<Verdict>): Verdict => ({
  productId: 'p', storyId, verdict: 'full', quality: 8, confidence: 'high', rationale: 'r', evidenceIds: [], ...over,
})

const claim = (id: string, storyIds: string[]): Claim => ({
  id, text: `text ${id}`, quote: `quote ${id}`, url: 'https://p.example/docs',
  sourceTier: 'claimed-docs', storyIds, extractedAt: '2026-08-27T00:00:00.000Z',
})

function makeData(claims: Claim[]): CategoryData {
  return {
    category,
    products,
    stories,
    evidence: { p: [ev('docs-1', 'claimed-docs'), ev('community-1', 'community'), ev('probe-1', 'probe')] },
    verdicts: [
      verdict('s1', { evidenceIds: ['probe-1'] }), // claimed-verified when claimed
      verdict('s2', { evidenceIds: ['docs-1'] }), // claimed-unverified when claimed
      verdict('s3', { verdict: 'disputed', quality: 3, evidenceIds: ['docs-1', 'community-1'] }), // claimed-contradicted when claimed
      verdict('s4', { evidenceIds: ['docs-1'] }), // delivered-unclaimed
      verdict('s5', { verdict: 'none', quality: 0, evidenceIds: [] }), // unclaimed-none
    ],
    rankings: { generatedAt: '2026-08-27T00:00:00.000Z', leaderboard: [], battles: [] },
    stacks: [],
    popularity: {},
    claims: { p: claims },
    uncertainty: [],
  }
}

describe('claimsIntegrity', () => {
  it('scores 100 × max(0, verified − 2×contradicted) / testable, excluding untestable claims', () => {
    // s1 verified, s2 unverified, no contradiction: testable 2, score = 100 × 1 / 2 = 50 —
    // the unverified claim counts for nothing but still inflates the denominator.
    const data = makeData([claim('c1', ['s1']), claim('c2', ['s2'])])
    expect(claimsIntegrity(data, 'p')).toEqual({
      score: 50, verified: 1, unverified: 1, contradicted: 0, untestable: 0, total: 2,
    })
  })

  it('penalizes contradicted claims doubly and clamps the score at 0 (never negative)', () => {
    // verified 1, unverified 1, contradicted 1 → max(0, 1 − 2) = 0 → score 0, not −33.
    const data = makeData([claim('c1', ['s1']), claim('c2', ['s2']), claim('c3', ['s3'])])
    const result = claimsIntegrity(data, 'p')
    expect(result.score).toBe(0)
    expect(result.contradicted).toBe(1)
    expect(result.total).toBe(3)
  })

  it('a contradiction lowers the score even when it does not hit the clamp', () => {
    // Without the contradicted claim: verified 1 / testable 1 → 100. With it:
    // max(0, 1 − 2×1)/2 = 0 — strictly lower than the same claims minus the contradiction.
    const clean = claimsIntegrity(makeData([claim('c1', ['s1'])]), 'p')
    const dirty = claimsIntegrity(makeData([claim('c1', ['s1']), claim('c3', ['s3'])]), 'p')
    expect(clean.score).toBe(100)
    expect(dirty.score).not.toBeNull()
    expect(dirty.score!).toBeLessThan(clean.score!)
  })

  it('excludes untestable (unmapped) claims from the score but counts them in total', () => {
    const data = makeData([claim('c1', ['s1']), claim('c-unmapped', [])])
    expect(claimsIntegrity(data, 'p')).toEqual({
      score: 100, verified: 1, unverified: 0, contradicted: 0, untestable: 1, total: 2,
    })
  })

  it('is null (never a fabricated 0) when the product has no claims data at all', () => {
    const data = { ...makeData([]), claims: {} }
    expect(claimsIntegrity(data, 'p')).toEqual({
      score: null, verified: 0, unverified: 0, contradicted: 0, untestable: 0, total: 0,
    })
  })

  it('is null when every claim is untestable (nothing to score against)', () => {
    const data = makeData([claim('c-unmapped', [])])
    const result = claimsIntegrity(data, 'p')
    expect(result.score).toBeNull()
    expect(result.untestable).toBe(1)
    expect(result.total).toBe(1)
  })
})
