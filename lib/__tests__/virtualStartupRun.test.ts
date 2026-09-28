// Virtual Startup v3 run layer (lib/virtualStartupRun.ts + lib/virtualStartupData.ts), checked
// against the LIVE corpus where the founder contract demands it: outcome math under the disclosed
// multipliers, event gating by decisions + corpus risk, permalink round-trips, pricing citation
// presence, and the labeling invariants (every simulation constant names itself a "simulation
// assumption" — judged data and simulation constants never blend silently).
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadChains, loadProcesses, processSlug, vendorRoles } from '@/lib/processes'
import type { VendorRole } from '@/lib/processSim'
import {
  allChoiceCombos,
  DEFAULT_CHOICES,
  journeyPhases,
  journeyTaskIds,
  unionTaskIds,
  VS_CHAIN_IDS,
  type Choices,
  type VirtualTaskPayload,
  type VsChain,
} from '@/lib/virtualStartup'
import { buildVsAccess, buildVsPricing, buildVsTaskRisks } from '@/lib/virtualStartupData'
import {
  computeBurn,
  computeStackOutcome,
  corpusLaunchDay,
  decodeRunState,
  drawVsEvents,
  eligibleVsEvents,
  encodeCombo,
  decodeCombo,
  encodeRunState,
  eventSeedKey,
  FOUNDER_HOURS_MULTIPLIER,
  hasAgentSurface,
  journeyOutcomeInputs,
  launchPhaseIdOf,
  optimalSelections,
  personaById,
  resolveVsEvents,
  SECOND_TIMER_MULTIPLIER,
  taskMinutesById,
  VS_ASSUMPTIONS,
  VS_EVENTS,
  VS_PERSONAS,
  type OutcomeStepInput,
  type VsAccessMap,
  type VsRunState,
} from '@/lib/virtualStartupRun'

const DATA_DIR = path.resolve(__dirname, '../../data')

const chains: VsChain[] = loadChains(DATA_DIR).map(({ id, name, taskIds }) => ({ id, name, taskIds }))
const vsChains = VS_CHAIN_IDS.map((id) => chains.find((c) => c.id === id)!)
const corpus = loadProcesses(DATA_DIR)
const corpusById = new Map(corpus.map((t) => [t.id, t]))
const union = unionTaskIds(vsChains)
const unionTasks = union.map((id) => corpusById.get(id)!)
const liveRoles = vendorRoles(unionTasks, DATA_DIR)
const liveAccess = buildVsAccess(liveRoles, DATA_DIR)
const liveRisks = buildVsTaskRisks(DATA_DIR)

// ---------------------------------------------------------------------------
// Fixtures for the outcome math (pure — no corpus needed to test the rules)
// ---------------------------------------------------------------------------

const role = (arenaId: string, def: string, alts: Array<{ id: string; name: string }>): VendorRole => ({
  arenaId,
  arenaName: arenaId,
  canonicalVendor: def,
  defaultProductId: def,
  defaultProductName: def,
  stepCount: 1,
  alternatives: alts.map((a) => ({ ...a, agentReady: null })),
})

const ROLES: VendorRole[] = [
  role('payments', 'stripe', [{ id: 'stripe', name: 'Stripe' }, { id: 'square', name: 'Square' }]),
]

const ACCESS: VsAccessMap = {
  payments: {
    stripe: { mcp: 'none', cli: 'none' },
    square: { mcp: 'full', cli: 'na' },
  },
}

const input = (key: string, over: Partial<OutcomeStepInput> = {}): OutcomeStepInput => ({
  key,
  taskId: key.split(':')[0],
  phaseId: 'revenue',
  chainId: 'get-paid',
  route: 'agent',
  arenaId: null,
  estimatedMinutes: 10,
  ...over,
})

describe('outcome math — vendor picks change outcomes', () => {
  it('agent step served by a surface-bearing pick runs at agent speed; a surface-less pick falls back to founder-hours', () => {
    const inputs = [input('qs_021:0', { arenaId: 'payments' })]
    const withSurface = computeStackOutcome(inputs, { payments: 'square' }, ROLES, ACCESS, 'solo-technical')
    expect(withSurface.steps[0]).toMatchObject({ minutes: 10, agentRun: true, note: null })

    const withoutSurface = computeStackOutcome(inputs, { payments: 'stripe' }, ROLES, ACCESS, 'solo-technical')
    expect(withoutSurface.steps[0].minutes).toBe(10 * FOUNDER_HOURS_MULTIPLIER)
    expect(withoutSurface.steps[0].agentRun).toBe(false)
    // The multiplier is never dressed as judged data.
    expect(withoutSurface.steps[0].note).toContain('simulation assumption')
  })

  it('unserved steps are unchanged: agent steps with no swappable role stay agent-speed, non-agent steps keep corpus minutes', () => {
    const inputs = [
      input('a:0'), // agent, no arena
      input('a:1', { route: 'person' }),
      input('a:2', { route: 'form' }),
    ]
    const o = computeStackOutcome(inputs, {}, ROLES, ACCESS, 'solo-technical')
    expect(o.steps.map((s) => s.minutes)).toEqual([10, 10, 10])
    expect(o.steps.map((s) => s.agentRun)).toEqual([true, false, false])
    expect(o.agentRunPct).toBe(33)
  })

  it('defaults apply when the reader picked nothing (the role default is the pick)', () => {
    const inputs = [input('qs_021:0', { arenaId: 'payments' })]
    const o = computeStackOutcome(inputs, {}, ROLES, ACCESS, 'solo-technical')
    // stripe (default) has no surface in this fixture → founder-hours.
    expect(o.steps[0].minutes).toBe(10 * FOUNDER_HOURS_MULTIPLIER)
  })

  it('all-manual baseline and founder-hours saved derive from the same disclosed multiplier', () => {
    const inputs = [input('a:0'), input('a:1', { route: 'person', estimatedMinutes: 20 })]
    const o = computeStackOutcome(inputs, {}, ROLES, ACCESS, 'solo-technical')
    expect(o.totalMinutes).toBe(30)
    expect(o.allManualMinutes).toBe(10 * FOUNDER_HOURS_MULTIPLIER + 20)
    expect(o.founderHoursSavedMinutes).toBe(o.allManualMinutes - o.totalMinutes)
  })

  it('the launch milestone excludes post-launch phases from the launch clock', () => {
    const inputs = [
      input('a:0', { phaseId: 'website', estimatedMinutes: 1440 }),
      input('a:1', { phaseId: 'launch', estimatedMinutes: 1440 }),
      input('a:2', { phaseId: 'enterprise', estimatedMinutes: 14400 }),
    ]
    const o = computeStackOutcome(inputs, {}, ROLES, ACCESS, 'solo-technical')
    expect(o.launchMinutes).toBe(2880)
    expect(o.launchDay).toBe(3)
    expect(o.totalMinutes).toBe(2880 + 14400)
    expect(launchPhaseIdOf([{ id: 'website' }, { id: 'launch' }, { id: 'enterprise' }])).toBe('launch')
    expect(launchPhaseIdOf([{ id: 'website' }, { id: 'revenue' }])).toBe('website')
  })

  it('is deterministic: identical inputs replay identical outcomes', () => {
    const inputs = journeyOutcomeInputs(
      journeyPhases(DEFAULT_CHOICES, vsChains),
      Object.fromEntries(union.map((id) => [id, payloadFor(id)])),
    )
    const a = computeStackOutcome(inputs, { payments: 'square' }, liveRoles, liveAccess, 'second-timer')
    const b = computeStackOutcome(inputs, { payments: 'square' }, liveRoles, liveAccess, 'second-timer')
    expect(a).toEqual(b)
  })
})

describe('personas', () => {
  it('non-technical: engineering-chain steps gain the founder-hours multiplier unless agent-run', () => {
    const eng = input('prod_006:0', { chainId: 'ship-v1', route: 'person' })
    const engAgent = input('prod_006:1', { chainId: 'ship-v1' }) // agent, unserved → agent-run
    const other = input('qs_023:0', { chainId: 'company-launch', route: 'person' })
    const o = computeStackOutcome([eng, engAgent, other], {}, ROLES, ACCESS, 'non-technical')
    expect(o.steps[0].minutes).toBe(10 * FOUNDER_HOURS_MULTIPLIER)
    expect(o.steps[0].note).toContain('simulation assumption')
    expect(o.steps[1].minutes).toBe(10) // agent-run — the modifier never applies
    expect(o.steps[2].minutes).toBe(10) // not an engineering chain
  })

  it('second-timer: legal/finance steps run faster, agent-run steps untouched', () => {
    const legal = input('legal_002:0', { route: 'person' })
    const founderAgreement = input('startup_002:0', { route: 'person' })
    const nonLegal = input('brand_001:0', { route: 'person' })
    const o = computeStackOutcome([legal, founderAgreement, nonLegal], {}, ROLES, ACCESS, 'second-timer')
    expect(o.steps[0].minutes).toBe(10 * SECOND_TIMER_MULTIPLIER)
    expect(o.steps[0].note).toContain('simulation assumption')
    expect(o.steps[1].minutes).toBe(10 * SECOND_TIMER_MULTIPLIER)
    expect(o.steps[2].minutes).toBe(10)
  })

  it('every persona modifier is a named, disclosed simulation assumption; icp cross-references are real lenses', () => {
    const icpIds = new Set(
      (JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'icp-types.json'), 'utf8')) as Array<{ id: string }>).map((t) => t.id),
    )
    expect(VS_PERSONAS).toHaveLength(3)
    for (const p of VS_PERSONAS) {
      if (p.assumption !== null) expect(p.assumption).toContain('simulation assumption')
      if (p.icpId !== null) expect(icpIds.has(p.icpId)).toBe(true)
    }
    expect(personaById('non-technical')?.assumption).toBeTruthy()
    expect(personaById('nope')).toBeNull()
    for (const a of VS_ASSUMPTIONS) expect(a.text).toContain('simulation assumption')
  })
})

describe('optimal stack — computed, judged-surface-bearing', () => {
  it('picks the first alternative with an MCP/CLI surface per role, keeping the default when none has one', () => {
    const picks = optimalSelections(ROLES, ACCESS)
    expect(picks.payments).toBe('square')
    const noSurface: VsAccessMap = { payments: { stripe: { mcp: 'none', cli: 'disputed' }, square: { mcp: 'na', cli: 'none' } } }
    expect(optimalSelections(ROLES, noSurface).payments).toBe('stripe')
    expect(hasAgentSurface({ mcp: 'disputed', cli: 'none' })).toBe(false)
    expect(hasAgentSurface({ mcp: 'na', cli: 'partial' })).toBe(true)
    expect(hasAgentSurface(undefined)).toBe(false)
  })

  it('the agents-first optimal stack never launches later than the reader stack (live corpus, default combo)', () => {
    const tasks = Object.fromEntries(union.map((id) => [id, payloadFor(id)]))
    const inputs = journeyOutcomeInputs(journeyPhases(DEFAULT_CHOICES, vsChains), tasks)
    const yours = computeStackOutcome(inputs, {}, liveRoles, liveAccess, 'solo-technical')
    const optimal = computeStackOutcome(inputs, optimalSelections(liveRoles, liveAccess), liveRoles, liveAccess, 'solo-technical')
    expect(optimal.launchMinutes).toBeLessThanOrEqual(yours.launchMinutes)
    expect(optimal.agentRunSteps).toBeGreaterThanOrEqual(yours.agentRunSteps)
  })
})

// ---------------------------------------------------------------------------
// Event engine
// ---------------------------------------------------------------------------

// The corpus reshape the page performs — enough of VirtualTaskPayload for the run layer.
function payloadFor(taskId: string): VirtualTaskPayload {
  const t = corpusById.get(taskId)!
  return {
    id: t.id,
    title: t.title,
    slug: processSlug(t.title),
    phase: t.phase,
    description: t.description,
    steps: t.dag.nodes.map((n) => ({
      taskId: t.id,
      taskTitle: t.title,
      label: n.label,
      route: n.route,
      vendor: n.vendor ?? null,
      vendorLabel: null,
      arenaId: null,
      choiceArenaId: null,
      calls: [],
      toolCall: null,
      approvalRequired: false,
      legalSignature: n.legalSignature ?? false,
      riskLevel: null,
      estimatedMinutes: n.estimatedMinutes,
      async: n.async ?? false,
      gap: null,
    })),
    tops: t.dag.nodes.map(() => null),
  }
}

describe('event engine — grounded, gated, seeded, deterministic', () => {
  it('every curated event is grounded in a real corpus process some decision combo reaches, and its risk floor is satisfied by the corpus', () => {
    const unionSet = new Set(union)
    for (const e of VS_EVENTS) {
      expect(unionSet.has(e.groundedIn), `event ${e.id} grounded in unreachable task ${e.groundedIn}`).toBe(true)
      const risk = liveRisks[e.groundedIn]
      expect(risk, `event ${e.id}: no corpus risk for ${e.groundedIn}`).toBeGreaterThanOrEqual(e.minRisk)
    }
    // …and each event actually fires for at least one combo (the gate is satisfiable).
    for (const e of VS_EVENTS) {
      const fires = allChoiceCombos().some((combo) =>
        eligibleVsEvents(combo, journeyTaskIds(combo, vsChains), liveRisks).some((x) => x.id === e.id),
      )
      expect(fires, `event ${e.id} never fires for any combo`).toBe(true)
    }
  })

  it('gates by the run decisions: SOC 2 demand needs enterprise ON and compliance LATER; cofounder departure needs cofounders', () => {
    const base: Choices = { ...DEFAULT_CHOICES, enterprise: 'yes', compliance: 'later', team: 'cofounders' }
    const on = eligibleVsEvents(base, journeyTaskIds(base, vsChains), liveRisks).map((e) => e.id)
    expect(on).toContain('soc2-demand')
    expect(on).toContain('cofounder-departure')

    const complianceNow: Choices = { ...base, compliance: 'now' }
    expect(eligibleVsEvents(complianceNow, journeyTaskIds(complianceNow, vsChains), liveRisks).map((e) => e.id)).not.toContain('soc2-demand')

    const solo: Choices = { ...base, team: 'solo' }
    expect(eligibleVsEvents(solo, journeyTaskIds(solo, vsChains), liveRisks).map((e) => e.id)).not.toContain('cofounder-departure')
  })

  it('gates by the corpus risk floor', () => {
    const journey = journeyTaskIds(DEFAULT_CHOICES, vsChains)
    const lowRisks = Object.fromEntries(Object.keys(liveRisks).map((k) => [k, 1]))
    expect(eligibleVsEvents(DEFAULT_CHOICES, journey, lowRisks).filter((e) => e.minRisk > 1)).toHaveLength(0)
  })

  it('draws 2–4 events deterministically from (combo, preset, yc, persona, seed); persona and seed are part of the key', () => {
    const journey = journeyTaskIds(DEFAULT_CHOICES, vsChains)
    const eligible = eligibleVsEvents(DEFAULT_CHOICES, journey, liveRisks)
    expect(eligible.length).toBeGreaterThanOrEqual(2)
    const key = eventSeedKey(DEFAULT_CHOICES, null, false, 'solo-technical', 0)
    const a = drawVsEvents(eligible, key, 30)
    const b = drawVsEvents(eligible, key, 30)
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThanOrEqual(Math.min(2, eligible.length))
    expect(a.length).toBeLessThanOrEqual(4)
    for (const d of a) expect(d.day).toBeGreaterThanOrEqual(2)
    expect([...a].sort((x, y) => x.day - y.day).map((d) => d.def.id)).toEqual(a.map((d) => d.def.id))
    // Persona and seed change the seed key (the founder spec: persona is part of the seed).
    expect(eventSeedKey(DEFAULT_CHOICES, null, false, 'second-timer', 0)).not.toBe(key)
    expect(eventSeedKey(DEFAULT_CHOICES, null, false, 'solo-technical', 1)).not.toBe(key)
    expect(drawVsEvents([], key, 30)).toEqual([])
  })

  it('resolves choices deterministically: real corpus minutes, named wait constants, lost deals, and arena re-picks', () => {
    const tasks = Object.fromEntries(union.map((id) => [id, payloadFor(id)]))
    const minutes = taskMinutesById(tasks)
    const soc2 = VS_EVENTS.find((e) => e.id === 'soc2-demand')!
    const processor = VS_EVENTS.find((e) => e.id === 'processor-review')!
    const drawn = [
      { def: soc2, day: 4 },
      { def: processor, day: 9 },
    ]
    const paymentsRole = liveRoles.find((r) => r.arenaId === 'payments')!
    const ctx = { roles: liveRoles, selections: {}, taskMinutes: minutes, chains: vsChains }

    // Undecided events add no time.
    const pending = resolveVsEvents(drawn, {}, ctx)
    expect(pending.deltaMinutes).toBe(0)
    expect(pending.decided).toBe(0)

    // SOC 2 accepted: the set-up-compliance chain's REAL corpus minutes land pre-launch.
    const complianceChain = vsChains.find((c) => c.id === 'set-up-compliance')!
    const chainMinutes = complianceChain.taskIds.reduce((acc, id) => acc + (minutes[id] ?? 0), 0)
    const accepted = resolveVsEvents(drawn, { 'soc2-demand': 'start-now' }, ctx)
    expect(accepted.deltaMinutes).toBe(chainMinutes)
    expect(accepted.dealsLost).toBe(0)

    // SOC 2 declined: no time, one simulated deal lost.
    const declined = resolveVsEvents(drawn, { 'soc2-demand': 'decline' }, ctx)
    expect(declined.deltaMinutes).toBe(0)
    expect(declined.dealsLost).toBe(1)

    // Processor wait: the named constant, in minutes.
    const waitChoice = processor.choices.find((c) => c.id === 'wait')!
    expect(waitChoice.effect.kind).toBe('wait-days')
    const waited = resolveVsEvents(drawn, { 'processor-review': 'wait' }, ctx)
    expect(waited.deltaMinutes).toBe((waitChoice.effect as { days: number }).days * 24 * 60)

    // Processor switch: re-pick from the REAL arena ranking (≠ current), plus the real re-setup time.
    const switched = resolveVsEvents(drawn, { 'processor-review': 'switch' }, ctx)
    expect(switched.pickOverrides.payments).toBeDefined()
    expect(switched.pickOverrides.payments).not.toBe(paymentsRole.defaultProductId)
    expect(paymentsRole.alternatives.some((o) => o.id === switched.pickOverrides.payments)).toBe(true)
    expect(switched.deltaMinutes).toBe(minutes.qs_021)
  })

  it('every wait branch names itself a simulation assumption; every real-time branch resolves to corpus minutes', () => {
    for (const e of VS_EVENTS) {
      expect(e.choices.length).toBeGreaterThanOrEqual(2)
      for (const c of e.choices) {
        if (c.effect.kind === 'wait-days') {
          expect(c.effect.assumption).toContain('simulation assumption')
          expect(c.effect.days).toBeGreaterThan(0)
        }
        if (c.effect.kind === 'redo-tasks') {
          for (const id of c.effect.taskIds) expect(corpusById.has(id), `event ${e.id} redoes unknown task ${id}`).toBe(true)
        }
        if (c.effect.kind === 'add-chain-time') {
          expect(chains.some((ch) => ch.id === (c.effect as { chainId: string }).chainId)).toBe(true)
        }
        if (c.effect.kind === 'switch-vendor') {
          expect(corpusById.has(c.effect.redoTaskId)).toBe(true)
        }
      }
    }
  })

  it('corpusLaunchDay is deterministic from the combo and covers the pre-launch prefix', () => {
    const tasks = Object.fromEntries(union.map((id) => [id, payloadFor(id)]))
    const inputs = journeyOutcomeInputs(journeyPhases(DEFAULT_CHOICES, vsChains), tasks)
    const d = corpusLaunchDay(inputs)
    expect(d).toBeGreaterThanOrEqual(1)
    expect(d).toBe(corpusLaunchDay(inputs))
  })
})

// ---------------------------------------------------------------------------
// Permalink codec
// ---------------------------------------------------------------------------

describe('permalink — the whole run state round-trips through ?run=', () => {
  const state: VsRunState = {
    choices: { ...DEFAULT_CHOICES, entity: 'llc', team: 'solo' },
    preset: 'hardware',
    yc: true,
    persona: 'second-timer',
    picks: { payments: 'square', accounting: 'xero' },
    eventChoices: { 'soc2-demand': 'decline', 'processor-review': 'wait' },
    seed: 7,
  }

  it('round-trips every field, and the param is URL-safe', () => {
    const encoded = encodeRunState(state)
    expect(encoded).toMatch(/^[A-Za-z0-9\-_]+$/)
    expect(decodeRunState(encoded)).toEqual(state)
  })

  it('round-trips the default state compactly (defaults omitted)', () => {
    const def: VsRunState = { choices: DEFAULT_CHOICES, preset: null, yc: false, persona: 'solo-technical', picks: {}, eventChoices: {}, seed: 0 }
    const encoded = encodeRunState(def)
    expect(decodeRunState(encoded)).toEqual(def)
    expect(encoded.length).toBeLessThan(encodeRunState(state).length)
  })

  it('combo digits round-trip for every decision combo', () => {
    for (const combo of allChoiceCombos()) {
      expect(decodeCombo(encodeCombo(combo))).toEqual(combo)
    }
  })

  it('rejects garbage defensively (null, never a crash or a half-applied state)', () => {
    expect(decodeRunState(null)).toBeNull()
    expect(decodeRunState('')).toBeNull()
    expect(decodeRunState('%%%not-base64url%%%')).toBeNull()
    expect(decodeRunState('aGVsbG8')).toBeNull() // valid base64url, not our JSON
    // Wrong version / unknown persona / unknown preset / malformed picks.
    const tamper = (o: Record<string, unknown>) => {
      const json = JSON.stringify(o)
      const bytes = new TextEncoder().encode(json)
      const b64 = Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      return decodeRunState(b64)
    }
    expect(tamper({ v: 99, c: encodeCombo(DEFAULT_CHOICES) })).toBeNull()
    expect(tamper({ v: 1, c: 'zzzzzzzzz' })).toBeNull()
    expect(tamper({ v: 1, c: encodeCombo(DEFAULT_CHOICES), f: 'ceo' })).toBeNull()
    expect(tamper({ v: 1, c: encodeCombo(DEFAULT_CHOICES), p: 'unicorn' })).toBeNull()
    expect(tamper({ v: 1, c: encodeCombo(DEFAULT_CHOICES), k: { a: 1 } })).toBeNull()
    expect(tamper({ v: 1, c: encodeCombo(DEFAULT_CHOICES), s: 'NaN' })).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Serialized payloads (lib/virtualStartupData.ts) + burn honesty
// ---------------------------------------------------------------------------

describe('server payloads — canonical verdicts, cited pricing, corpus risks', () => {
  it('buildVsAccess covers every alternative of every role with valid verdict kinds', () => {
    const kinds = new Set(['full', 'partial', 'disputed', 'none', 'na'])
    for (const r of liveRoles) {
      const byProduct = liveAccess[r.arenaId]
      expect(byProduct, `no access map for arena ${r.arenaId}`).toBeDefined()
      for (const o of r.alternatives) {
        const s = byProduct[o.id]
        expect(s, `no surface for ${r.arenaId}/${o.id}`).toBeDefined()
        expect(kinds.has(s.mcp)).toBe(true)
        expect(kinds.has(s.cli)).toBe(true)
      }
    }
  })

  it('pricing citation presence: every serialized fact carries its source URL and as-of date (verbatim-extraction contract)', () => {
    const pricing = buildVsPricing(liveRoles, DATA_DIR)
    // The journey's payments arena is price-covered — the scorecard has at least one real cite.
    expect(Object.keys(pricing).length).toBeGreaterThan(0)
    let facts = 0
    for (const byProduct of Object.values(pricing)) {
      for (const info of Object.values(byProduct)) {
        if (info.kind === 'fact') {
          facts += 1
          expect(info.sourceUrl).toMatch(/^https?:\/\//)
          expect(info.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/)
          expect(info.label.length).toBeGreaterThan(0)
          // Only per-month entry-plan sticker prices are ever summable.
          if (info.monthly) expect(info.tier).toBe('entry-paid')
        } else {
          expect(info.reason.length).toBeGreaterThan(0)
        }
      }
    }
    expect(facts).toBeGreaterThan(0)
  })

  it('buildVsTaskRisks mirrors the committed corpus risk axis', () => {
    expect(Object.keys(liveRisks)).toHaveLength(corpus.length)
    expect(liveRisks.startup_002).toBe(corpusById.get('startup_002')!.risk)
    for (const v of Object.values(liveRisks)) {
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(5)
    }
  })

  it('computeBurn sums ONLY monthly entry plans; usage prices are listed, not blended; gaps stay gaps', () => {
    const burn = computeBurn(
      ROLES,
      {},
      {
        payments: {
          stripe: { kind: 'fact', label: '2.9% + $0.3', unit: 'per transaction', tier: 'usage', amountUsd: 0.3, percent: 2.9, monthly: false, sourceUrl: 'https://stripe.example/pricing', asOf: '2026-09-01' },
        },
      },
    )
    expect(burn.monthlyUsd).toBeNull() // a usage rate never becomes a monthly figure
    expect(burn.usageVendors).toBe(1)
    expect(burn.lines).toHaveLength(1)

    const monthly = computeBurn(
      [role('accounting', 'quickbooks', [{ id: 'quickbooks', name: 'QuickBooks' }]), ...ROLES],
      {},
      {
        accounting: {
          quickbooks: { kind: 'fact', label: '$35', unit: 'per month (entry plan)', tier: 'entry-paid', amountUsd: 35, monthly: true, sourceUrl: 'https://intuit.example/pricing', asOf: '2026-09-01' },
        },
      },
    )
    expect(monthly.monthlyUsd).toBe(35)
    expect(monthly.monthlyVendors).toBe(1)
    expect(monthly.noPricingVendors).toBe(1) // the payments pick has no entry here — a gap, not a guess
  })
})
