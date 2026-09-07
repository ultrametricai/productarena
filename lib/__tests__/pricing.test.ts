import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  allowedUnitsFor,
  ENTRY_PLAN_UNIT,
  formatFactAmount,
  loadPricing,
  PRICING_ARENAS,
  PricingFactSchema,
  pricingCellFor,
  pricingCoverage,
  ProductPricingSchema,
  unitShortLabel,
  type PricingFact,
  type ProductPricing,
} from '@/lib/pricing'

const fact = (overrides: Partial<PricingFact> = {}): PricingFact => ({
  unit: 'per 1M tokens',
  amountUsd: 0.59,
  tier: 'usage',
  sourceUrl: 'https://x.example/pricing',
  excerpt: '$0.59 per 1M tokens',
  fetchedAt: '2026-09-06T00:00:00.000Z',
  ...overrides,
})

describe('pricing schemas', () => {
  it('accepts a well-formed fact and both ProductPricing branches', () => {
    expect(PricingFactSchema.parse(fact())).toEqual(fact())
    expect(ProductPricingSchema.parse({ facts: [fact()] })).toEqual({ facts: [fact()] })
    const unavailable: ProductPricing = { unavailable: true, reason: 'JS shell', fetchedAt: '2026-09-06T00:00:00.000Z' }
    expect(ProductPricingSchema.parse(unavailable)).toEqual(unavailable)
  })
  it('rejects a fact without a source URL or excerpt — every figure must be traceable', () => {
    expect(PricingFactSchema.safeParse({ ...fact(), sourceUrl: undefined }).success).toBe(false)
    expect(PricingFactSchema.safeParse({ ...fact(), excerpt: undefined }).success).toBe(false)
  })
  it('rejects a free fact with a nonzero price and a priced fact with no figure', () => {
    expect(PricingFactSchema.safeParse(fact({ tier: 'free', amountUsd: 3 })).success).toBe(false)
    expect(PricingFactSchema.safeParse(fact({ amountUsd: 0 })).success).toBe(false)
  })
  it('rejects an available entry with zero facts (that is what unavailable is for)', () => {
    expect(ProductPricingSchema.safeParse({ facts: [] }).success).toBe(false)
  })
})

describe('units', () => {
  it('every covered arena allows its primary unit plus the entry-plan escape hatch', () => {
    for (const [arenaId, { primary }] of Object.entries(PRICING_ARENAS)) {
      const allowed = allowedUnitsFor(arenaId)
      expect(allowed).toContain(primary)
      expect(allowed).toContain(ENTRY_PLAN_UNIT)
    }
    expect(allowedUnitsFor('email')).toEqual([])
  })
})

describe('formatFactAmount / unitShortLabel', () => {
  it('renders the extracted digits verbatim, never a computed blend', () => {
    expect(formatFactAmount(fact())).toBe('$0.59')
    expect(formatFactAmount(fact({ amountUsd: 0.008 }))).toBe('$0.008')
    expect(formatFactAmount(fact({ amountUsd: 0.3, percent: 2.9 }))).toBe('2.9% + $0.3')
    expect(formatFactAmount(fact({ amountUsd: 0, percent: 5.5 }))).toBe('5.5%')
    expect(formatFactAmount(fact({ amountUsd: 0, tier: 'free' }))).toBe('free')
    // A zero percent is only shown alone ("0% markup") — never as a "+ $" rate structure.
    expect(formatFactAmount(fact({ amountUsd: 0.49, percent: 0 }))).toBe('$0.49')
    expect(formatFactAmount(fact({ amountUsd: 0, percent: 0 }))).toBe('0%')
  })
  it('shortens "per …" units and passes others through', () => {
    expect(unitShortLabel('per 1M tokens')).toBe('1M tokens')
    expect(unitShortLabel('gateway fee')).toBe('gateway fee')
  })
})

describe('pricingCellFor', () => {
  it('prefers the cheapest usage fact in the primary unit', () => {
    const entry: ProductPricing = {
      facts: [
        fact({ unit: 'per 1M output tokens', amountUsd: 0.79 }),
        fact({ unit: 'per 1M tokens', amountUsd: 0.6 }),
        fact({ unit: ENTRY_PLAN_UNIT, amountUsd: 29, tier: 'entry-paid' }),
      ],
    }
    expect(pricingCellFor(entry, 'inference-providers')).toEqual({
      label: '$0.6',
      unit: '1M tokens',
      tier: 'usage',
      sourceUrl: 'https://x.example/pricing',
      asOf: '2026-09-06',
    })
  })
  it('falls back usage → entry-paid → free', () => {
    const entryPaid: ProductPricing = { facts: [fact({ unit: ENTRY_PLAN_UNIT, amountUsd: 29, tier: 'entry-paid' })] }
    expect(pricingCellFor(entryPaid, 'inference-providers')).toMatchObject({ label: '$29', tier: 'entry-paid' })
    const freeOnly: ProductPricing = { facts: [fact({ amountUsd: 0, tier: 'free' })] }
    expect(pricingCellFor(freeOnly, 'inference-providers')).toMatchObject({ label: 'free tier', tier: 'free' })
  })
  it('renders unavailable as an unclear cell with the honest reason', () => {
    const entry: ProductPricing = { unavailable: true, reason: 'JS-rendered shell', fetchedAt: '2026-09-06T00:00:00.000Z' }
    expect(pricingCellFor(entry, 'inference-providers')).toEqual({ unclear: true, reason: 'JS-rendered shell' })
  })
})

describe('loadPricing / pricingCoverage', () => {
  it('tolerates a missing pricing.json and counts extracted vs unclear', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-pricing-'))
    fs.mkdirSync(path.join(dir, 'inference-providers'))
    fs.writeFileSync(
      path.join(dir, 'inference-providers', 'pricing.json'),
      JSON.stringify({
        a: { facts: [fact()] },
        b: { unavailable: true, reason: 'bot wall', fetchedAt: '2026-09-06T00:00:00.000Z' },
      }),
    )
    expect(loadPricing('payments', dir)).toEqual({})
    expect(Object.keys(loadPricing('inference-providers', dir))).toEqual(['a', 'b'])
    const coverage = pricingCoverage(
      [
        { arenaId: 'inference-providers', productIds: ['a', 'b', 'c'] },
        { arenaId: 'payments', productIds: ['x'] },
        { arenaId: 'crm', productIds: ['y'] }, // not a covered arena — excluded entirely
      ],
      dir,
    )
    expect(coverage).toEqual({ coveredArenas: 2, coveredProducts: 4, extracted: 1, unclear: 1 })
  })
})
