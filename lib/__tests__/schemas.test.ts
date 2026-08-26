import { describe, expect, it } from 'vitest'
import { EvidenceSchema, ProductSchema, StorySchema, VerdictSchema } from '@/lib/schemas'

describe('schemas', () => {
  it('accepts a valid verdict', () => {
    const v = {
      productId: 'omarchy', storyId: 'keyboard-tiling', verdict: 'full',
      quality: 9, confidence: 'high', rationale: 'Tiling is the default paradigm.',
      evidenceIds: ['omarchy-docs-1'],
    }
    expect(VerdictSchema.parse(v)).toEqual(v)
  })

  it('rejects a non-none verdict with zero evidence', () => {
    const r = VerdictSchema.safeParse({
      productId: 'p', storyId: 's', verdict: 'full', quality: 9,
      confidence: 'high', rationale: 'x', evidenceIds: [],
    })
    expect(r.success).toBe(false)
  })

  it('allows a none verdict with zero evidence', () => {
    const r = VerdictSchema.safeParse({
      productId: 'p', storyId: 's', verdict: 'none', quality: 0,
      confidence: 'medium', rationale: 'No sign of this capability.', evidenceIds: [],
    })
    expect(r.success).toBe(true)
  })

  it('rejects out-of-range quality and weight', () => {
    expect(StorySchema.safeParse({ id: 's', persona: 'developer', title: 't', theme: 'x', weight: 4 }).success).toBe(false)
    expect(VerdictSchema.safeParse({
      productId: 'p', storyId: 's', verdict: 'full', quality: 11,
      confidence: 'high', rationale: 'x', evidenceIds: ['e'],
    }).success).toBe(false)
  })

  it('rejects an unknown evidence tier', () => {
    expect(EvidenceSchema.safeParse({
      id: 'e', tier: 'blog', url: 'https://x.com', excerpt: 'q', fetchedAt: '2026-08-26T00:00:00Z',
    }).success).toBe(false)
  })

  it('requires a valid site url on products', () => {
    expect(ProductSchema.safeParse({
      id: 'p', name: 'P', vendor: 'V', type: 'oss', urls: { site: 'not-a-url' },
    }).success).toBe(false)
  })
})
