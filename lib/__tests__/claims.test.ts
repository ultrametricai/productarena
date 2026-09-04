import { describe, expect, it } from 'vitest'
import { claimBucketCounts, claimedStoryCount, claimEntriesByStatus, claimsVerifiedPercent, claimStatus, unmappedClaims } from '@/lib/claims'
import type { CategoryData } from '@/lib/data'
import type { Category, Claim, Evidence, Product, Story, Verdict } from '@/lib/schemas'

const category: Category = { id: 'cat', name: 'Cat', description: 'd', personas: ['dev'] }
const products: Product[] = [{ id: 'p', name: 'P', vendor: 'v', type: 'oss', urls: { site: 'https://p.example' } }]
const stories: Story[] = [
  { id: 's1', persona: 'dev', title: 'delivered and claimed, well-verified', theme: 'core', group: 'g', weight: 1 },
  { id: 's2', persona: 'dev', title: 'delivered and claimed, only vendor evidence', theme: 'core', group: 'g', weight: 1 },
  { id: 's3', persona: 'dev', title: 'claimed but disputed', theme: 'core', group: 'g', weight: 1 },
  { id: 's4', persona: 'dev', title: 'delivered but never claimed (undersold)', theme: 'core', group: 'g', weight: 1 },
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

function makeData(): CategoryData {
  return {
    category,
    products,
    stories,
    evidence: { p: [ev('docs-1', 'claimed-docs'), ev('community-1', 'community'), ev('probe-1', 'probe')] },
    verdicts: [
      verdict('s1', { evidenceIds: ['probe-1'] }), // claimed + tested -> claimed-verified
      verdict('s2', { evidenceIds: ['docs-1'] }), // claimed + vendor-claim only -> claimed-unverified
      verdict('s3', { verdict: 'disputed', quality: 3, evidenceIds: ['docs-1', 'community-1'] }), // claimed but disputed -> claimed-contradicted
      verdict('s4', { evidenceIds: ['docs-1'] }), // delivered, no claim -> delivered-unclaimed
      verdict('s5', { verdict: 'none', quality: 0, evidenceIds: [] }), // neither -> unclaimed-none
    ],
    rankings: { generatedAt: '2026-08-27T00:00:00.000Z', leaderboard: [], battles: [] },
    stacks: [],
    popularity: {},
    claims: { p: [claim('p-claim-1', ['s1']), claim('p-claim-2', ['s2']), claim('p-claim-3', ['s3']), claim('p-claim-4', [])] },
    uncertainty: [],
    vendorResponses: [],
  }
}

describe('claimStatus', () => {
  const data = makeData()

  it('is claimed-verified when a claim maps to a story whose verdict is full/partial with corroborated/tested evidence', () => {
    expect(claimStatus(data, 'p', 's1')).toBe('claimed-verified')
  })

  it('is claimed-unverified when a claim maps to a story whose verdict is full/partial but only vendor-claim evidence backs it', () => {
    expect(claimStatus(data, 'p', 's2')).toBe('claimed-unverified')
  })

  it('is claimed-contradicted when a claim maps to a story whose verdict is disputed', () => {
    expect(claimStatus(data, 'p', 's3')).toBe('claimed-contradicted')
  })

  it('is claimed-contradicted when a claim maps to a story whose verdict is none', () => {
    const withNoneClaimed: CategoryData = {
      ...data,
      verdicts: data.verdicts.map((v) => (v.storyId === 's3' ? { ...v, verdict: 'none' as const, quality: 0, evidenceIds: [] } : v)),
    }
    expect(claimStatus(withNoneClaimed, 'p', 's3')).toBe('claimed-contradicted')
  })

  it('is delivered-unclaimed when no claim maps to a story but the verdict is full/partial', () => {
    expect(claimStatus(data, 'p', 's4')).toBe('delivered-unclaimed')
  })

  it('is unclaimed-none when there is no claim and nothing is delivered', () => {
    expect(claimStatus(data, 'p', 's5')).toBe('unclaimed-none')
  })

  it('treats a product with no claims file as having no claims at all (empty map, not an error)', () => {
    const noClaims: CategoryData = { ...data, claims: {} }
    expect(claimStatus(noClaims, 'p', 's1')).toBe('delivered-unclaimed') // s1's verdict is still full
    expect(claimStatus(noClaims, 'p', 's5')).toBe('unclaimed-none')
  })
})

describe('claimBucketCounts / claimedStoryCount', () => {
  it('counts every story into exactly one bucket', () => {
    const data = makeData()
    const counts = claimBucketCounts(data, 'p')
    expect(counts).toEqual({
      'claimed-verified': 1,
      'claimed-unverified': 1,
      'claimed-contradicted': 1,
      'delivered-unclaimed': 1,
      'unclaimed-none': 1,
    })
    expect(claimedStoryCount(counts)).toBe(3) // verified + unverified + contradicted
  })
})

describe('claimsVerifiedPercent', () => {
  it('is the percentage of mapped claims (verified+unverified+contradicted) that are verified', () => {
    const data = makeData()
    expect(claimsVerifiedPercent(data, 'p')).toBe(33) // 1 of 3 mapped claims verified, rounded
  })

  it('is null when nothing is claimed at all', () => {
    const data = { ...makeData(), claims: {} }
    expect(claimsVerifiedPercent(data, 'p')).toBeNull()
  })
})

describe('claimEntriesByStatus', () => {
  it('returns the (claim, story) pairing for a claimed bucket', () => {
    const data = makeData()
    const entries = claimEntriesByStatus(data, 'p', 'claimed-verified')
    expect(entries).toEqual([{ claim: data.claims.p![0], storyId: 's1' }])
  })

  it('returns story-only entries (claim: null) for delivered-unclaimed', () => {
    const data = makeData()
    const entries = claimEntriesByStatus(data, 'p', 'delivered-unclaimed')
    expect(entries).toEqual([{ claim: null, storyId: 's4' }])
  })

  it('returns an entry per mapped story when one claim covers multiple stories', () => {
    const data = makeData()
    const multi = { ...data, claims: { p: [claim('p-claim-multi', ['s1', 's2'])] } }
    const entries = claimEntriesByStatus(multi, 'p', 'claimed-verified')
    expect(entries).toEqual([{ claim: multi.claims.p![0], storyId: 's1' }])
    expect(claimEntriesByStatus(multi, 'p', 'claimed-unverified')).toEqual([{ claim: multi.claims.p![0], storyId: 's2' }])
  })
})

describe('unmappedClaims', () => {
  it('returns only claims with an empty storyIds array', () => {
    const data = makeData()
    const unmapped = unmappedClaims(data, 'p')
    expect(unmapped).toHaveLength(1)
    expect(unmapped[0].id).toBe('p-claim-4')
  })

  it('returns an empty array for a product with no claims at all', () => {
    const data = { ...makeData(), claims: {} }
    expect(unmappedClaims(data, 'p')).toEqual([])
  })
})
