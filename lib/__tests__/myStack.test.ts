import { describe, expect, it } from 'vitest'
import { pairKey } from '../integrations'
import {
  arenaWeight,
  BREAKOUT_DELTA,
  encodeMyStackParam,
  MAX_ADD_RECS,
  MAX_MY_STACK,
  MAX_RECOMMENDATIONS,
  parseMyStackParam,
  parseStoredStack,
  recommend,
  resolvePicks,
  UPGRADE_DELTA,
  type MyStackInputs,
  type MyStackProduct,
} from '../myStack'
import { stackPairKey } from '../stackBuilder'

function product(overrides: Partial<MyStackProduct>): MyStackProduct {
  return {
    id: 'p',
    name: 'P',
    vendor: 'P Inc',
    arenaId: 'payments',
    arenaName: 'Payments',
    type: 'commercial',
    aiEra: 50,
    agentReady: 50,
    confidence: 'B',
    rank: 1,
    fieldSize: 3,
    hasLogo: false,
    ...overrides,
  }
}

function inputs(products: MyStackProduct[], overrides: Partial<MyStackInputs> = {}): MyStackInputs {
  return { products, adjacency: [], curatedStackArenas: [], verifiedPairs: [], ...overrides }
}

const kinds = (r: ReturnType<typeof recommend>) => r.recommendations.map((x) => x.kind)

describe('resolvePicks', () => {
  it('drops unknown ids and resolves a cross-listed id to its first (canonical) arena row', () => {
    const rows = [
      product({ id: 'square', arenaId: 'payments', arenaName: 'Payments' }),
      product({ id: 'square', arenaId: 'mobile-payments', arenaName: 'Mobile payments' }),
      product({ id: 'stripe' }),
    ]
    const picks = resolvePicks(['square', 'ghost', 'stripe'], rows)
    expect(picks.map((p) => p.id)).toEqual(['square', 'stripe'])
    expect(picks[0].arenaId).toBe('payments')
  })
})

describe('recommend — UPGRADE', () => {
  const field = [
    product({ id: 'leader', name: 'Leader', aiEra: 85, agentReady: 90, confidence: 'A', rank: 1, fieldSize: 3 }),
    product({ id: 'mine', name: 'Mine', aiEra: 70, agentReady: 60, confidence: 'B', rank: 2, fieldSize: 3 }),
    product({ id: 'trailer', name: 'Trailer', aiEra: 40, confidence: 'C', rank: 3, fieldSize: 3 }),
  ]

  it('fires when a same-arena product leads by at least the threshold, citing both scores', () => {
    const { recommendations } = recommend(['mine'], inputs(field))
    expect(recommendations).toHaveLength(1)
    const rec = recommendations[0]
    expect(rec.kind).toBe('upgrade')
    expect(rec.reason).toContain('85/100')
    expect(rec.reason).toContain('70/100')
    expect(rec.reason).toContain('Δ15')
    // The evidence angle: agent-ready delta and confidence grades are cited too.
    expect(rec.reason).toContain('agent-ready 90/100 vs 60/100')
    expect(rec.reason).toContain('confidence A vs B')
    expect(rec.links.map((l) => l.href)).toEqual([
      '/arena/payments/product/leader',
      '/arena/payments/product/mine',
    ])
    expect(rec.impact).toBeCloseTo(15 * arenaWeight(3), 1)
  })

  it(`stays silent below the Δ${UPGRADE_DELTA} threshold`, () => {
    const close = [
      product({ id: 'leader', aiEra: 77, rank: 1 }),
      product({ id: 'mine', aiEra: 70, rank: 2 }),
    ]
    expect(recommend(['mine'], inputs(close)).recommendations).toEqual([])
  })

  it('never recommends on a D-confidence gap — challenger D or pick D both suppress', () => {
    const dChallenger = [
      product({ id: 'leader', aiEra: 95, confidence: 'D', rank: 1 }),
      product({ id: 'mine', aiEra: 70, confidence: 'B', rank: 2 }),
    ]
    expect(recommend(['mine'], inputs(dChallenger)).recommendations).toEqual([])
    const dPick = [
      product({ id: 'leader', aiEra: 95, confidence: 'A', rank: 1 }),
      product({ id: 'mine', aiEra: 70, confidence: 'D', rank: 2 }),
    ]
    expect(recommend(['mine'], inputs(dPick)).recommendations).toEqual([])
  })

  it('does not propose another of the reader’s own picks as the upgrade (that pair is an overlap)', () => {
    const r = recommend(['mine', 'leader'], inputs(field))
    expect(kinds(r)).not.toContain('upgrade')
    expect(kinds(r)).toContain('overlap')
  })

  it('skips picks with no PA Score', () => {
    const rows = [product({ id: 'mine', aiEra: null }), product({ id: 'leader', aiEra: 90 })]
    expect(recommend(['mine'], inputs(rows)).recommendations).toEqual([])
  })
})

describe('recommend — BREAK OUT', () => {
  it(`replaces UPGRADE when the pick is bottom-third and specialists lead by ≥ Δ${BREAKOUT_DELTA}`, () => {
    const rows = [
      product({ id: 's1', name: 'Spec1', aiEra: 90, confidence: 'A', rank: 1, fieldSize: 6 }),
      product({ id: 's2', aiEra: 80, rank: 2, fieldSize: 6 }),
      product({ id: 's3', aiEra: 75, rank: 3, fieldSize: 6 }),
      product({ id: 's4', aiEra: 70, rank: 4, fieldSize: 6 }),
      product({ id: 'generalist', name: 'Generalist', aiEra: 55, confidence: 'B', rank: 5, fieldSize: 6 }),
      product({ id: 's6', aiEra: 50, rank: 6, fieldSize: 6 }),
    ]
    const { recommendations } = recommend(['generalist'], inputs(rows))
    expect(recommendations).toHaveLength(1)
    expect(recommendations[0].kind).toBe('breakout')
    expect(recommendations[0].reason).toContain('#5 of 6')
    expect(recommendations[0].reason).toContain('Spec1')
    expect(recommendations[0].reason).toContain('90/100')
  })

  it('stays an UPGRADE when the pick is not bottom-third', () => {
    const rows = [
      product({ id: 'leader', aiEra: 90, rank: 1, fieldSize: 6 }),
      product({ id: 'mine', aiEra: 70, rank: 2, fieldSize: 6 }),
      ...[3, 4, 5, 6].map((n) => product({ id: `f${n}`, aiEra: 60 - n, rank: n, fieldSize: 6 })),
    ]
    expect(kinds(recommend(['mine'], inputs(rows)))).toEqual(['upgrade'])
  })
})

describe('recommend — ADD', () => {
  const catalog = [
    product({ id: 'stripe', name: 'Stripe', arenaId: 'payments', arenaName: 'Payments' }),
    product({ id: 'mercury', name: 'Mercury', arenaId: 'startup-banking', arenaName: 'Startup banking', aiEra: 82, confidence: 'B' }),
    product({ id: 'linear', name: 'Linear', arenaId: 'project-management', arenaName: 'Project management' }),
  ]

  it('suggests the leader of an uncovered adjacent arena, citing score and confidence', () => {
    const r = recommend(['stripe'], inputs(catalog, { adjacency: [['payments', 'startup-banking']] }))
    expect(r.recommendations).toHaveLength(1)
    const rec = r.recommendations[0]
    expect(rec.kind).toBe('add')
    expect(rec.reason).toContain('Startup banking')
    expect(rec.reason).toContain('Mercury')
    expect(rec.reason).toContain('82/100')
    expect(rec.reason).toContain('confidence B')
    expect(rec.reason).toContain('Stripe') // names the pick that makes the arena adjacent
    expect(rec.links).toEqual([{ label: 'Mercury', href: '/arena/startup-banking/product/mercury' }])
  })

  it('never suggests an arena the stack already covers', () => {
    const r = recommend(
      ['stripe', 'mercury'],
      inputs(catalog, { adjacency: [['payments', 'startup-banking']] }),
    )
    expect(kinds(r)).not.toContain('add')
  })

  it('uses curated stack patterns only when ≥2 of their arenas are already covered', () => {
    const pattern = [['payments', 'startup-banking', 'project-management']]
    // One covered arena: coincidence, no ADD.
    expect(kinds(recommend(['stripe'], inputs(catalog, { curatedStackArenas: pattern })))).toEqual([])
    // Two covered arenas: the pattern's remaining slot is suggested.
    const r = recommend(['stripe', 'linear'], inputs(catalog, { curatedStackArenas: pattern }))
    expect(kinds(r)).toEqual(['add'])
    expect(r.recommendations[0].reason).toContain('curated stack pattern')
  })

  it(`keeps only the ${MAX_ADD_RECS} strongest ADDs and counts the overflow as truncated`, () => {
    // One covered arena adjacent to 6 uncovered ones, each live with a scored leader.
    const arenas = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6']
    const rows = [
      product({ id: 'stripe', arenaId: 'payments', arenaName: 'Payments' }),
      ...arenas.map((a, i) =>
        product({ id: `lead-${a}`, name: `Lead${i}`, arenaId: a, arenaName: a.toUpperCase(), aiEra: 60 + i }),
      ),
    ]
    const r = recommend(['stripe'], inputs(rows, { adjacency: [['payments', ...arenas]] }))
    expect(kinds(r)).toEqual(['add', 'add', 'add', 'add'])
    expect(r.truncated).toBe(2)
    // The kept four are the strongest (leader-score-scaled impact): n6 (65) first, n3 (63) last.
    expect(r.recommendations[0].reason).toContain('Lead5')
  })

  it('skips adjacency arenas with no live catalog rows', () => {
    const r = recommend(['stripe'], inputs(catalog, { adjacency: [['payments', 'not-live-yet']] }))
    expect(r.recommendations).toEqual([])
  })
})

describe('recommend — OVERLAP', () => {
  it('flags two picks in the same arena as possible overlap, never as a removal command', () => {
    const rows = [
      product({ id: 'a1', name: 'Alpha', aiEra: 80, rank: 1 }),
      product({ id: 'a2', name: 'Beta', aiEra: 75, rank: 2 }),
    ]
    const { recommendations } = recommend(['a1', 'a2'], inputs(rows))
    expect(recommendations).toHaveLength(1)
    expect(recommendations[0].kind).toBe('overlap')
    expect(recommendations[0].reason).toContain('possible overlap')
    expect(recommendations[0].reason).not.toMatch(/remove/i)
  })

  it('flags a pick whose arena another pick already covers via cross-listing at an equal-or-better score', () => {
    const rows = [
      product({ id: 'square', name: 'Square', arenaId: 'mobile-payments', arenaName: 'Mobile payments', aiEra: 78 }),
      product({ id: 'square', name: 'Square', arenaId: 'payments', arenaName: 'Payments', aiEra: 76, rank: 2 }),
      product({ id: 'oldpay', name: 'OldPay', arenaId: 'payments', arenaName: 'Payments', aiEra: 70, rank: 3 }),
    ]
    const { recommendations } = recommend(['square', 'oldpay'], inputs(rows))
    const overlap = recommendations.find((r) => r.kind === 'overlap')
    expect(overlap).toBeDefined()
    expect(overlap?.reason).toContain('Square is also ranked in Payments at 76/100')
    expect(overlap?.reason).toContain('OldPay')
  })

  it('does not flag cross-listing when the covering score is lower', () => {
    const rows = [
      product({ id: 'square', arenaId: 'mobile-payments', arenaName: 'Mobile payments', aiEra: 78 }),
      product({ id: 'square', arenaId: 'payments', arenaName: 'Payments', aiEra: 60, rank: 3 }),
      product({ id: 'oldpay', arenaId: 'payments', arenaName: 'Payments', aiEra: 70, rank: 2 }),
    ]
    expect(kinds(recommend(['square', 'oldpay'], inputs(rows)))).not.toContain('overlap')
  })
})

describe('recommend — GROUP', () => {
  const twoArenas = [
    product({ id: 'mypay', name: 'MyPay', vendor: 'PayCo', arenaId: 'payments', arenaName: 'Payments', aiEra: 70, rank: 2 }),
    product({ id: 'mybank', name: 'MyBank', vendor: 'BankCo', arenaId: 'startup-banking', arenaName: 'Startup banking', aiEra: 68, rank: 2 }),
    product({ id: 'unipay', name: 'UniPay', vendor: 'UniCorp', arenaId: 'payments', arenaName: 'Payments', aiEra: 74, rank: 1 }),
    product({ id: 'unibank', name: 'UniBank', vendor: 'UniCorp', arenaId: 'startup-banking', arenaName: 'Startup banking', aiEra: 71, rank: 1 }),
  ]

  it('suggests a vendor family covering both arenas when scores hold up AND the pair is verified', () => {
    const r = recommend(
      ['mypay', 'mybank'],
      inputs(twoArenas, { verifiedPairs: [pairKey('unipay', 'unibank')] }),
    )
    const group = r.recommendations.find((x) => x.kind === 'group')
    expect(group).toBeDefined()
    expect(group?.reason).toContain('UniCorp')
    expect(group?.reason).toContain('74/100')
    expect(group?.reason).toContain('71/100')
    expect(group?.reason).toContain('verified integration')
    expect(group?.links.map((l) => l.label)).toEqual(['UniPay', 'UniBank', 'MyPay', 'MyBank'])
  })

  it('stays silent without a verified integration between the family members', () => {
    const r = recommend(['mypay', 'mybank'], inputs(twoArenas))
    expect(kinds(r)).not.toContain('group')
  })

  it('treats one product ranked in both arenas as a trivially-integrated family', () => {
    const rows = [
      product({ id: 'mypay', name: 'MyPay', vendor: 'PayCo', arenaId: 'payments', arenaName: 'Payments', aiEra: 70, rank: 2 }),
      product({ id: 'mybank', name: 'MyBank', vendor: 'BankCo', arenaId: 'startup-banking', arenaName: 'Startup banking', aiEra: 68, rank: 2 }),
      product({ id: 'uni', name: 'Uni', vendor: 'UniCorp', arenaId: 'payments', arenaName: 'Payments', aiEra: 74, rank: 1 }),
      product({ id: 'uni', name: 'Uni', vendor: 'UniCorp', arenaId: 'startup-banking', arenaName: 'Startup banking', aiEra: 71, rank: 1 }),
    ]
    const group = recommend(['mypay', 'mybank'], inputs(rows)).recommendations.find((x) => x.kind === 'group')
    expect(group).toBeDefined()
    expect(group?.reason).toContain('one product could cover both slots')
  })

  it('never suggests consolidating onto the family the picks already are', () => {
    const sameFamily = [
      product({ id: 'mypay', vendor: 'UniCorp', arenaId: 'payments', arenaName: 'Payments', aiEra: 70 }),
      product({ id: 'mybank', vendor: 'UniCorp', arenaId: 'startup-banking', arenaName: 'Startup banking', aiEra: 68 }),
    ]
    const r = recommend(
      ['mypay', 'mybank'],
      inputs(sameFamily, { verifiedPairs: [pairKey('mypay', 'mybank')] }),
    )
    expect(kinds(r)).not.toContain('group')
  })
})

describe('recommend — ordering, cap, and truncation', () => {
  it('orders by impact (score delta × arena weight) descending', () => {
    const rows = [
      // Small arena, big delta: 20 × log2(3) ≈ 31.7
      product({ id: 'sl', name: 'SmallLeader', arenaId: 'a1', arenaName: 'A1', aiEra: 90, rank: 1, fieldSize: 2 }),
      product({ id: 'sm', name: 'SmallMine', arenaId: 'a1', arenaName: 'A1', aiEra: 70, rank: 2, fieldSize: 2 }),
      // Big arena, smaller delta: 10 × log2(13) ≈ 37.0 — wins on weight
      product({ id: 'bl', name: 'BigLeader', arenaId: 'a2', arenaName: 'A2', aiEra: 80, rank: 1, fieldSize: 12 }),
      product({ id: 'bm', name: 'BigMine', arenaId: 'a2', arenaName: 'A2', aiEra: 70, rank: 2, fieldSize: 12 }),
    ]
    const { recommendations } = recommend(['sm', 'bm'], inputs(rows))
    expect(recommendations.map((r) => r.kind)).toEqual(['upgrade', 'upgrade'])
    expect(recommendations[0].reason).toContain('BigLeader')
    expect(recommendations[1].reason).toContain('SmallLeader')
  })

  it(`caps at ${MAX_RECOMMENDATIONS} and reports the truncated count`, () => {
    // 12 arenas, each with an upgrade-worthy gap → 12 candidate recs.
    const rows = Array.from({ length: 12 }, (_, i) => [
      product({ id: `l${i}`, name: `L${i}`, arenaId: `a${i}`, arenaName: `A${i}`, aiEra: 90, rank: 1 }),
      product({ id: `m${i}`, name: `M${i}`, arenaId: `a${i}`, arenaName: `A${i}`, aiEra: 70, rank: 2 }),
    ]).flat()
    const r = recommend(rows.filter((p) => p.id.startsWith('m')).map((p) => p.id), inputs(rows))
    expect(r.recommendations).toHaveLength(MAX_RECOMMENDATIONS)
    expect(r.truncated).toBe(2)
  })

  it('returns nothing for an empty stack', () => {
    expect(recommend([], inputs([product({})]))).toEqual({ recommendations: [], truncated: 0 })
  })
})

describe('share-URL + stored-stack state', () => {
  const valid = new Set(['stripe', 'linear', 'slack'])

  it('parses ?s= with dedupe, validation, and cap', () => {
    expect(parseMyStackParam('stripe, linear,stripe,ghost', valid)).toEqual(['stripe', 'linear'])
    expect(parseMyStackParam(null, valid)).toEqual([])
    const many = Array.from({ length: MAX_MY_STACK + 5 }, (_, i) => `p${i}`)
    expect(parseMyStackParam(many.join(','), new Set(many))).toHaveLength(MAX_MY_STACK)
  })

  it('round-trips through encode', () => {
    const ids = ['stripe', 'slack']
    expect(parseMyStackParam(encodeMyStackParam(ids), valid)).toEqual(ids)
  })

  it('parses stored JSON tolerantly — malformed input degrades to empty, never throws', () => {
    expect(parseStoredStack(JSON.stringify(['stripe', 'stripe', 7, 'linear']))).toEqual(['stripe', 'linear'])
    expect(parseStoredStack('not json')).toEqual([])
    expect(parseStoredStack('{"a":1}')).toEqual([])
    expect(parseStoredStack(null)).toEqual([])
  })
})

describe('pair-key compatibility', () => {
  it('uses the same sorted-pair format as lib/integrations.ts', () => {
    expect(stackPairKey('b', 'a')).toBe(pairKey('a', 'b'))
  })
})
