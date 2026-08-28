import { describe, expect, it } from 'vitest'
import { EvidenceSchema, ProductSchema, RankingsSchema, StorySchema, VerdictSchema } from '@/lib/schemas'

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
    expect(StorySchema.safeParse({ id: 's', persona: 'developer', title: 't', theme: 'x', group: 'core', weight: 4 }).success).toBe(false)
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

  it('requires a group on stories', () => {
    expect(StorySchema.safeParse({ id: 's', persona: 'developer', title: 't', theme: 'security', weight: 2 }).success).toBe(false)
    expect(StorySchema.safeParse({ id: 's', persona: 'ai-native', title: 't', theme: 'security', group: 'two-factor-auth', weight: 2 }).success).toBe(true)
  })

  it('accepts na verdicts with zero evidence and quality 0 only', () => {
    const base = { productId: 'p', storyId: 's', confidence: 'medium', rationale: 'axis does not apply', evidenceIds: [] }
    expect(VerdictSchema.safeParse({ ...base, verdict: 'na', quality: 0 }).success).toBe(true)
    expect(VerdictSchema.safeParse({ ...base, verdict: 'na', quality: 3 }).success).toBe(false)
  })

  it('accepts nullable theme scores, agentReady/agenticApp and applicability on rankings', () => {
    const r = {
      generatedAt: '2026-08-27T00:00:00Z',
      leaderboard: [{
        productId: 'p', score: 50, agentReady: null, agenticApp: 75,
        applicable: 10, total: 12, themeScores: { security: null, agenticness: 75 },
      }],
      battles: [{ a: 'p', b: 'q', winner: 'draw', record: { aWins: 0, bWins: 0, draws: 1 }, rounds: [{ storyId: 's', winner: 'na', margin: 0 }] }],
    }
    expect(RankingsSchema.safeParse(r).success).toBe(true)
  })

  it('accepts an optional links object on products', () => {
    const base = { id: 'p', name: 'P', vendor: 'V', type: 'oss' as const, urls: { site: 'https://p.example' } }
    expect(ProductSchema.safeParse(base).success).toBe(true)
    expect(ProductSchema.safeParse({ ...base, links: { app: 'https://app.p.example', api: 'https://docs.p.example' } }).success).toBe(true)
    expect(ProductSchema.safeParse({ ...base, links: { app: 'not-a-url' } }).success).toBe(false)
  })
})
