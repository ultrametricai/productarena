import { describe, expect, it } from 'vitest'
import type { CompareProduct } from '../compare'
import {
  buildStack,
  DEFAULT_CONSTRAINTS,
  encodeStackParams,
  parseStackParams,
  pickForRole,
  STACK_PRESETS,
  STACK_ROLES,
  stackAgentReadiness,
  type StackConstraints,
} from '../stackBuilder'

const PAYMENTS = STACK_ROLES.find((r) => r.id === 'payments')!
const BANKING = STACK_ROLES.find((r) => r.id === 'banking')!

function product(overrides: Partial<CompareProduct>): CompareProduct {
  return {
    id: 'p',
    name: 'P',
    arenaId: 'payments',
    arenaName: 'Payments',
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

const constraints = (overrides: Partial<StackConstraints> = {}): StackConstraints => ({
  ...DEFAULT_CONSTRAINTS,
  ...overrides,
})

describe('pickForRole', () => {
  const field = [
    product({ id: 'stripe', name: 'Stripe', agentReady: 90, aiEra: 85 }),
    product({ id: 'adyen', name: 'Adyen', agentReady: 70, aiEra: 88 }),
    product({ id: 'hyperswitch', name: 'Hyperswitch', type: 'oss', agentReady: 60, aiEra: 60, themeScores: { openness: 95 } }),
    product({ id: 'legacy-pay', name: 'LegacyPay', agentReady: null, aiEra: null }),
  ]

  it('picks the metric leader with rank, field size, and runner-up', () => {
    const { pick, emptyReason } = pickForRole(field, PAYMENTS, constraints())
    expect(emptyReason).toBeNull()
    expect(pick?.product.id).toBe('stripe')
    expect(pick?.metricValue).toBe(90)
    expect(pick?.rank).toBe(1)
    // legacy-pay has no agentReady score, so the ranked field is 3, not 4
    expect(pick?.fieldSize).toBe(3)
    expect(pick?.runnerUp?.id).toBe('adyen')
  })

  it('switches leaders when the metric changes', () => {
    const { pick } = pickForRole(field, PAYMENTS, constraints({ metric: 'aiEra' }))
    expect(pick?.product.id).toBe('adyen')
    expect(pick?.metricValue).toBe(88)
  })

  it('ossOnly filters the pick but keeps the honest full-field rank', () => {
    const { pick } = pickForRole(field, PAYMENTS, constraints({ ossOnly: true }))
    expect(pick?.product.id).toBe('hyperswitch')
    // #3 of 3 in the full agentReady field — not "#1 of 1" of the filtered field
    expect(pick?.rank).toBe(3)
    expect(pick?.fieldSize).toBe(3)
    expect(pick?.runnerUp).toBeNull()
  })

  it('selfHostPreferred re-orders by the openness blend without changing displayed metric', () => {
    // Blend: stripe 0.7*90=63 (no openness), adyen 0.7*70=49, hyperswitch 0.7*60+0.3*95=70.5
    const { pick } = pickForRole(field, PAYMENTS, constraints({ selfHostPreferred: true }))
    expect(pick?.product.id).toBe('hyperswitch')
    expect(pick?.metricValue).toBe(60) // raw metric, not the blend
    expect(pick?.rank).toBe(3)
  })

  it('reports an honest empty reason when a constraint eliminates every product', () => {
    const commercialOnly = field.filter((p) => p.type !== 'oss')
    const { pick, emptyReason } = pickForRole(commercialOnly, PAYMENTS, constraints({ ossOnly: true }))
    expect(pick).toBeNull()
    expect(emptyReason).toBe('No open-source option ranked in Payments yet.')
  })

  it('reports an empty reason when no product has the metric scored', () => {
    const unscored = [product({ id: 'x', agentReady: null })]
    const { pick, emptyReason } = pickForRole(unscored, PAYMENTS, constraints())
    expect(pick).toBeNull()
    expect(emptyReason).toMatch(/no product in payments is scored on agent-ready/i)
  })

  it('reports an empty reason when the arena has no products at all', () => {
    const { pick, emptyReason } = pickForRole(field, BANKING, constraints())
    expect(pick).toBeNull()
    expect(emptyReason).toMatch(/isn't live yet/i)
  })
})

describe('buildStack / stackAgentReadiness', () => {
  const products = [
    product({ id: 'stripe', name: 'Stripe', agentReady: 90 }),
    product({ id: 'mercury', name: 'Mercury', arenaId: 'startup-banking', arenaName: 'Startup Banking', agentReady: 70 }),
  ]

  it('builds one result per selected role, in STACK_ROLES order', () => {
    const results = buildStack(products, ['payments', 'banking'], constraints())
    expect(results.map((r) => r.role.id)).toEqual(['banking', 'payments'])
    expect(results[0].pick?.product.id).toBe('mercury')
    expect(results[1].pick?.product.id).toBe('stripe')
  })

  it('stackAgentReadiness is the mean of picks and null when there are no picks', () => {
    const results = buildStack(products, ['payments', 'banking'], constraints())
    expect(stackAgentReadiness(results)).toBe(80)
    expect(stackAgentReadiness([])).toBeNull()
    const eliminated = buildStack(products, ['payments'], constraints({ ossOnly: true }))
    expect(stackAgentReadiness(eliminated)).toBeNull()
  })
})

describe('stack URL state', () => {
  it('round-trips roles + constraints', () => {
    const state = {
      roles: ['banking', 'payments'],
      constraints: constraints({ ossOnly: true, selfHostPreferred: true, metric: 'aiEra' as const }),
    }
    const qs = encodeStackParams(state)
    expect(qs).toContain('roles=banking%2Cpayments')
    expect(qs).toContain('oss=1')
    expect(qs).toContain('sh=1')
    expect(qs).toContain('metric=aiEra')
    expect(parseStackParams(new URLSearchParams(qs))).toEqual(state)
  })

  it('drops unknown/duplicate roles and falls back on an invalid metric', () => {
    const state = parseStackParams(new URLSearchParams('roles=banking,not-a-role,banking&metric=vibes'))
    expect(state.roles).toEqual(['banking'])
    expect(state.constraints.metric).toBe('agentReady')
    expect(state.constraints.ossOnly).toBe(false)
    expect(state.constraints.selfHostPreferred).toBe(false)
  })

  it('encodes the all-default empty state as an empty string (clean URL)', () => {
    expect(encodeStackParams({ roles: [], constraints: constraints() })).toBe('')
  })
})

describe('STACK_PRESETS', () => {
  it('only reference known role ids', () => {
    const known = new Set(STACK_ROLES.map((r) => r.id))
    for (const preset of STACK_PRESETS) {
      for (const role of preset.roles) expect(known.has(role), `${preset.id} → ${role}`).toBe(true)
    }
  })
})
