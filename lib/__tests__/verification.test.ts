import { describe, expect, it } from 'vitest'
import type { Evidence, Verdict } from '@/lib/schemas'
import { verificationLevel } from '@/lib/verification'

const ev = (id: string, tier: Evidence['tier']): Evidence => ({
  id, tier, url: 'https://example.com', excerpt: 'x', fetchedAt: '2026-08-26T00:00:00.000Z',
})

const evidence = new Map<string, Evidence>([
  ['docs-1', ev('docs-1', 'claimed-docs')],
  ['gh-1', ev('gh-1', 'github')],
  ['community-1', ev('community-1', 'community')],
  ['probe-1', ev('probe-1', 'probe')],
])

const v = (verdict: Verdict['verdict'], evidenceIds: string[]): Verdict => ({
  productId: 'p', storyId: 's', verdict, quality: verdict === 'na' ? 0 : 5,
  confidence: 'high', rationale: 'r', evidenceIds,
})

describe('verificationLevel', () => {
  it('is disputed for a disputed verdict regardless of evidence', () => {
    expect(verificationLevel(v('disputed', ['docs-1', 'community-1']), evidence)).toBe('disputed')
  })

  it('is unverified for na verdicts', () => {
    expect(verificationLevel(v('na', []), evidence)).toBe('unverified')
  })

  it('is unverified for none verdicts', () => {
    expect(verificationLevel(v('none', []), evidence)).toBe('unverified')
  })

  it('is unverified when a non-none/na verdict cites zero evidence', () => {
    expect(verificationLevel(v('full', []), evidence)).toBe('unverified')
  })

  it('is tested when any cited evidence is tier probe', () => {
    expect(verificationLevel(v('full', ['docs-1', 'probe-1']), evidence)).toBe('tested')
  })

  it('is corroborated when any cited evidence is tier community (and none is probe)', () => {
    expect(verificationLevel(v('partial', ['docs-1', 'community-1']), evidence)).toBe('corroborated')
  })

  it('is vendor-claim when only claimed-docs/github evidence is cited', () => {
    expect(verificationLevel(v('full', ['docs-1', 'gh-1']), evidence)).toBe('vendor-claim')
  })
})
