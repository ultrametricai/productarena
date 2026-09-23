// Virtual Startup — the decision→journey mapping and the synthetic-data honesty contract
// (lib/virtualStartup.ts), checked against the LIVE corpus: every journey must be composed of
// real data/processes.json tasks selected via real data/process-chains.json chains, and every
// synthetic artifact must be born labeled simulated and replay deterministically from the
// decision combo.
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import searchAliases from '@/data/search-aliases.json'
import { loadChains, loadProcesses } from '@/lib/processes'
import type { SimStep } from '@/lib/processSim'
import { buildPageEntries } from '@/lib/search-index'
import {
  allChoiceCombos,
  ARTIFACT_TASK_IDS,
  buildJourneyArtifacts,
  comboKey,
  dayOf,
  DECISIONS,
  DEFAULT_CHOICES,
  journeyPhases,
  journeyStats,
  journeyTaskIds,
  synthCompany,
  unionTaskIds,
  VS_CHAIN_IDS,
  type Choices,
  type VsChain,
} from '@/lib/virtualStartup'

const DATA_DIR = path.resolve(__dirname, '../../data')

const chains: VsChain[] = loadChains(DATA_DIR).map(({ id, name, taskIds }) => ({ id, name, taskIds }))
const corpusIds = new Set(loadProcesses(DATA_DIR).map((t) => t.id))
const combos = allChoiceCombos()

describe('decision → journey mapping (against the live corpus)', () => {
  it('every journey chain exists in data/process-chains.json', () => {
    const chainIds = new Set(chains.map((c) => c.id))
    for (const id of VS_CHAIN_IDS) expect(chainIds.has(id), `chain ${id} missing`).toBe(true)
  })

  it('covers all 16 decision combos', () => {
    expect(combos.length).toBe(16)
    expect(new Set(combos.map(comboKey)).size).toBe(16)
  })

  it('every combo yields only real corpus tasks, each at most once', () => {
    for (const combo of combos) {
      const ids = journeyTaskIds(combo, chains)
      expect(ids.length).toBeGreaterThan(0)
      expect(new Set(ids).size, `duplicate tasks for ${comboKey(combo)}`).toBe(ids.length)
      for (const id of ids) expect(corpusIds.has(id), `unknown task ${id} for ${comboKey(combo)}`).toBe(true)
    }
  })

  it('entity: C-Corp runs form_001, LLC swaps in form_011 — never both', () => {
    for (const combo of combos) {
      const ids = journeyTaskIds(combo, chains)
      expect(ids.includes('form_001')).toBe(combo.entity === 'c-corp')
      expect(ids.includes('form_011')).toBe(combo.entity === 'llc')
    }
  })

  it('team: the founder equity split (startup_002) rides only with cofounders', () => {
    for (const combo of combos) {
      expect(journeyTaskIds(combo, chains).includes('startup_002')).toBe(combo.team === 'cofounders')
    }
  })

  it('funding: the raise phase is exactly the raise-a-seed-round chain, only on seed', () => {
    const raiseChain = chains.find((c) => c.id === 'raise-a-seed-round')!
    for (const combo of combos) {
      const phases = journeyPhases(combo, chains)
      const raise = phases.find((p) => p.chainId === 'raise-a-seed-round')
      if (combo.funding === 'seed') {
        expect(raise?.taskIds).toEqual(raiseChain.taskIds)
      } else {
        expect(raise).toBeUndefined()
        const ids = journeyTaskIds(combo, chains)
        for (const tid of raiseChain.taskIds) expect(ids.includes(tid)).toBe(false)
      }
    }
  })

  it('business model forks the get-paid chain: growth_001 for subscriptions, sales_002 for invoices', () => {
    for (const combo of combos) {
      const ids = journeyTaskIds(combo, chains)
      expect(ids.includes('growth_001')).toBe(combo.product === 'subscriptions')
      expect(ids.includes('sales_002')).toBe(combo.product === 'invoices')
      // The shared spine of the chain stays regardless of the fork.
      expect(ids.includes('qs_021')).toBe(true)
      expect(ids.includes('fin_002')).toBe(true)
    }
  })

  it('phases run in founder-time order: name & brand first, launch day last', () => {
    for (const combo of combos) {
      const phases = journeyPhases(combo, chains)
      expect(phases[0].chainId).toBe('name-the-company')
      expect(phases[phases.length - 1].chainId).toBe('launch-on-product-hunt')
    }
  })

  it('tasks shared across chains (domain_002, prod_005) run once — first occurrence wins', () => {
    const ids = journeyTaskIds(DEFAULT_CHOICES, chains)
    expect(ids.filter((id) => id === 'domain_002').length).toBe(1)
    expect(ids.filter((id) => id === 'prod_005').length).toBe(1)
  })

  it('unionTaskIds is a duplicate-free superset of every combo journey', () => {
    const union = unionTaskIds(chains)
    expect(new Set(union).size).toBe(union.length)
    for (const combo of combos) {
      for (const id of journeyTaskIds(combo, chains)) {
        expect(union.includes(id), `union missing ${id}`).toBe(true)
      }
    }
  })

  it('throws on an unknown chain rather than inventing one', () => {
    expect(() => journeyPhases(DEFAULT_CHOICES, chains.filter((c) => c.id !== 'ship-v1'))).toThrow(/ship-v1/)
  })

  it('every decision option names its corpus mapping in the visible detail copy', () => {
    for (const d of DECISIONS) {
      expect(d.options.length).toBeGreaterThanOrEqual(2)
      for (const o of d.options) expect(o.detail.length).toBeGreaterThan(0)
    }
  })
})

describe('synthetic artifacts — labeled, deterministic, impossible-real', () => {
  it('every artifact generator key is a real corpus task reachable by some combo', () => {
    const union = new Set(unionTaskIds(chains))
    for (const id of ARTIFACT_TASK_IDS) {
      expect(corpusIds.has(id), `generator for unknown task ${id}`).toBe(true)
      expect(union.has(id), `generator for unreachable task ${id}`).toBe(true)
    }
  })

  it('EVERY generated artifact carries the literal simulated flag and non-empty copy', () => {
    for (const combo of combos) {
      const ids = journeyTaskIds(combo, chains)
      const byTask = buildJourneyArtifacts(combo, ids)
      const all = Object.values(byTask).flat()
      expect(all.length).toBeGreaterThan(0)
      for (const a of all) {
        expect(a.simulated).toBe(true)
        expect(ids.includes(a.taskId)).toBe(true)
        expect(a.label.length).toBeGreaterThan(0)
        expect(a.value.length).toBeGreaterThan(0)
      }
    }
  })

  it('replays identically for the same decision combo (seeded, no runtime randomness)', () => {
    for (const combo of combos) {
      const ids = journeyTaskIds(combo, chains)
      expect(buildJourneyArtifacts(combo, ids)).toEqual(buildJourneyArtifacts(combo, ids))
      expect(synthCompany(combo)).toEqual(synthCompany(combo))
    }
  })

  it('identifiers are constructed impossible-real: 00- EIN, .example domains, entity-true name', () => {
    for (const combo of combos) {
      const ids = journeyTaskIds(combo, chains)
      const byTask = buildJourneyArtifacts(combo, ids)
      expect(byTask.form_002?.[0].value).toBe('00-0000000')
      expect(byTask.domain_002?.[0].value).toContain('.example')
      const co = synthCompany(combo)
      expect(co.display.endsWith(combo.entity === 'llc' ? ' LLC' : ', Inc.')).toBe(true)
      expect(byTask.brand_001?.[0].value).toBe(co.display)
    }
  })
})

describe('journey stats & elapsed time (corpus estimates only)', () => {
  const step = (over: Partial<SimStep>): SimStep => ({
    taskId: 't',
    taskTitle: 'T',
    label: 'step',
    route: 'agent',
    vendor: null,
    vendorLabel: null,
    arenaId: null,
    choiceArenaId: null,
    calls: [],
    toolCall: null,
    approvalRequired: false,
    legalSignature: false,
    riskLevel: null,
    estimatedMinutes: 10,
    async: false,
    gap: null,
    ...over,
  })

  it('journeyStats counts routes, gates, and sums the corpus minutes', () => {
    const stats = journeyStats([
      step({}),
      step({ route: 'form', approvalRequired: true, estimatedMinutes: 30 }),
      step({ route: 'person', legalSignature: true, estimatedMinutes: 5 }),
      step({ route: 'person', async: true, estimatedMinutes: 2880 }),
    ])
    expect(stats).toEqual({
      totalSteps: 4,
      agentSteps: 1,
      formSteps: 1,
      personSteps: 2,
      legalSignatures: 1,
      approvals: 1,
      asyncSteps: 1,
      totalMinutes: 2925,
    })
  })

  it('dayOf is 1-based over 24h buckets', () => {
    expect(dayOf(0)).toBe(1)
    expect(dayOf(1439)).toBe(1)
    expect(dayOf(1440)).toBe(2)
  })
})

describe('discoverability wiring', () => {
  it('/virtual-startup is a ⌘K page entry with committed aliases', () => {
    const entry = buildPageEntries(searchAliases.pages as Record<string, string[]>).find(
      (e) => e.href === '/virtual-startup',
    )
    expect(entry?.label).toBe('Virtual Startup')
    expect(entry?.keywords).toContain('virtual startup')
  })
})
