// Virtual Startup — the decision→journey mapping and the synthetic-data honesty contract
// (lib/virtualStartup.ts), checked against the LIVE corpus: every journey must be composed of
// real data/processes.json tasks selected via real data/process-chains.json chains, and every
// synthetic artifact must be born labeled simulated and replay deterministically from the
// decision combo.
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import searchAliases from '@/data/search-aliases.json'
import { CADENCE_META, loadChains, loadProcesses, processSlug, taskCeiling } from '@/lib/processes'
import type { SimStep } from '@/lib/processSim'
import { buildPageEntries } from '@/lib/search-index'
import {
  allChoiceCombos,
  ARTIFACT_TASK_IDS,
  buildJourneyArtifacts,
  buildYearCandidates,
  comboKey,
  CORPUS_ANNUAL_MONTHS,
  dayOf,
  DECISIONS,
  DEFAULT_CHOICES,
  journeyPhases,
  journeyStats,
  journeyTaskIds,
  resolveYearMonths,
  RUNS_PER_YEAR,
  synthCompany,
  unionTaskIds,
  VS_CHAIN_IDS,
  YEAR_CHAIN_IDS,
  yearRows,
  yearStats,
  type RouteMix,
  type VsChain,
  type YearRow,
  type YearTaskSource,
} from '@/lib/virtualStartup'

const DATA_DIR = path.resolve(__dirname, '../../data')

const chains: VsChain[] = loadChains(DATA_DIR).map(({ id, name, taskIds }) => ({ id, name, taskIds }))
const corpusById = new Map(loadProcesses(DATA_DIR).map((t) => [t.id, t]))
const corpusIds = new Set(corpusById.keys())
const combos = allChoiceCombos()

describe('decision → journey mapping (against the live corpus)', () => {
  it('every journey chain exists in data/process-chains.json', () => {
    const chainIds = new Set(chains.map((c) => c.id))
    for (const id of VS_CHAIN_IDS) expect(chainIds.has(id), `chain ${id} missing`).toBe(true)
  })

  it('covers all 512 decision combos (nine binary toggles)', () => {
    expect(combos.length).toBe(512)
    expect(new Set(combos.map(comboKey)).size).toBe(512)
    expect(DECISIONS.length).toBe(9)
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

  it('ordering: name-first leads with name-the-company, build-first leads with ship-v1', () => {
    for (const combo of combos) {
      const phases = journeyPhases(combo, chains)
      expect(phases[0].chainId).toBe(combo.ordering === 'build-first' ? 'ship-v1' : 'name-the-company')
    }
  })

  it('the journey tail follows the toggles: enterprise closes, else deferred compliance, else launch day', () => {
    for (const combo of combos) {
      const phases = journeyPhases(combo, chains)
      const last = phases[phases.length - 1].chainId
      if (combo.enterprise === 'yes') expect(last).toBe('land-the-enterprise-deal')
      else if (combo.compliance === 'later') expect(last).toBe('set-up-compliance')
      else if (combo.ph === 'yes') expect(last).toBe('launch-on-product-hunt')
    }
  })

  it('hire: the first-hire chain rides only on yes, placed after revenue turns on', () => {
    const hireChain = chains.find((c) => c.id === 'first-hire')!
    for (const combo of combos) {
      const phases = journeyPhases(combo, chains)
      const hire = phases.find((p) => p.chainId === 'first-hire')
      if (combo.hire === 'yes') {
        expect(hire?.taskIds).toEqual(hireChain.taskIds)
        expect(phases.findIndex((p) => p.chainId === 'first-hire')).toBeGreaterThan(
          phases.findIndex((p) => p.chainId === 'get-paid'),
        )
      } else {
        expect(hire).toBeUndefined()
        const ids = journeyTaskIds(combo, chains)
        for (const tid of hireChain.taskIds) expect(ids.includes(tid)).toBe(false)
      }
    }
  })

  it('compliance: the set-up-compliance chain ALWAYS runs; the toggle only moves it', () => {
    for (const combo of combos) {
      const phases = journeyPhases(combo, chains)
      const idx = (chainId: string) => phases.findIndex((p) => p.chainId === chainId)
      const c = idx('set-up-compliance')
      expect(c).toBeGreaterThanOrEqual(0)
      if (combo.compliance === 'now') expect(c).toBeLessThan(idx('launch-website'))
      else expect(c).toBeGreaterThan(idx('get-paid'))
    }
  })

  it('enterprise: the land-the-enterprise-deal chain appears only on yes, as the final phase', () => {
    const entChain = chains.find((c) => c.id === 'land-the-enterprise-deal')!
    for (const combo of combos) {
      const ids = journeyTaskIds(combo, chains)
      for (const tid of entChain.taskIds) {
        expect(ids.includes(tid), `${tid} for ${comboKey(combo)}`).toBe(combo.enterprise === 'yes')
      }
    }
  })

  it('directory launch: the launch-on-product-hunt chain appears only on yes', () => {
    for (const combo of combos) {
      const ids = journeyTaskIds(combo, chains)
      // growth_010 (the PH submission) lives only in that chain among the journey chains.
      expect(ids.includes('growth_010')).toBe(combo.ph === 'yes')
      expect(journeyPhases(combo, chains).some((p) => p.chainId === 'launch-on-product-hunt')).toBe(combo.ph === 'yes')
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

describe('year one — the operating rhythm, derived from live corpus cadence', () => {
  const routeMix = (taskId: string): RouteMix => {
    const mix: RouteMix = { agent: 0, form: 0, person: 0, legalSignature: 0 }
    for (const n of corpusById.get(taskId)!.dag.nodes) {
      mix[n.route] += 1
      if (n.legalSignature) mix.legalSignature += 1
    }
    return mix
  }
  // The same corpus reshape app/virtual-startup/page.tsx performs.
  const sources: YearTaskSource[] = [...corpusById.values()].map((t) => ({
    taskId: t.id,
    title: t.title,
    slug: processSlug(t.title),
    cadence: t.cadence,
    cadenceLabel: CADENCE_META[t.cadence].label,
    totalSteps: t.dag.nodes.length,
    routes: routeMix(t.id),
    ceilingPct: taskCeiling(t).pct,
  }))
  const candidates = buildYearCandidates(chains, sources)

  it('always includes every month-end-close and tax-season task, with corpus-true runs/yr', () => {
    for (const cid of YEAR_CHAIN_IDS) {
      const chain = chains.find((c) => c.id === cid)
      expect(chain, `chain ${cid} missing`).toBeDefined()
      for (const tid of chain!.taskIds) {
        const cand = candidates.find((c) => c.taskId === tid)
        expect(cand, `candidate ${tid} missing`).toBeDefined()
        expect(cand!.always).toBe(true)
        expect(cand!.runsPerYear).toBe(RUNS_PER_YEAR[corpusById.get(tid)!.cadence])
      }
    }
  })

  it('every candidate is calendar-recurring with a corpus-true route mix and ceiling', () => {
    expect(candidates.length).toBeGreaterThan(0)
    for (const c of candidates) {
      const t = corpusById.get(c.taskId)!
      expect(RUNS_PER_YEAR[c.cadence], `${c.taskId} is not calendar-recurring`).not.toBeNull()
      expect(c.cadence).toBe(t.cadence)
      expect(c.totalSteps).toBe(t.dag.nodes.length)
      expect(c.routes.agent + c.routes.form + c.routes.person).toBe(t.dag.nodes.length)
      expect(c.ceilingPct).toBe(taskCeiling(t).pct)
    }
  })

  it('rows gate on the journey: payroll with the hire, invoicing on the invoices fork, Type II/pen test with the enterprise motion', () => {
    for (const combo of combos) {
      const ids = journeyTaskIds(combo, chains)
      const rows = yearRows(combo, ids, candidates)
      const rowIds = new Set(rows.map((r) => r.taskId))
      expect(rowIds.size).toBe(rows.length)
      // The always-on operating spine.
      expect(rowIds.has('fin_002')).toBe(true)
      expect(rowIds.has('fin_003')).toBe(true)
      expect(rowIds.has('tax_001')).toBe(true)
      // The decision-gated recurring work.
      expect(rowIds.has('hr_002')).toBe(combo.hire === 'yes')
      expect(rowIds.has('sales_002')).toBe(combo.product === 'invoices')
      expect(rowIds.has('comp_002')).toBe(combo.enterprise === 'yes')
      expect(rowIds.has('comp_013')).toBe(combo.enterprise === 'yes')
    }
  })

  it('calendar slots: monthlies fill all 12 months, quarterlies land on quarter ends — pure cadence math', () => {
    const monthly = resolveYearMonths({ taskId: 'fin_002', cadence: 'monthly' }, DEFAULT_CHOICES)
    expect(monthly).toEqual({ months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], monthSource: 'cadence', monthNote: null })
    const quarterly = resolveYearMonths({ taskId: 'x', cadence: 'quarterly' }, DEFAULT_CHOICES)
    expect(quarterly.months).toEqual([3, 6, 9, 12])
    expect(quarterly.monthSource).toBe('cadence')
  })

  it('annuals: corpus-dated months only where the corpus carries them; the rest are seeded and labeled', () => {
    expect(resolveYearMonths({ taskId: 'tax_003', cadence: 'annual' }, DEFAULT_CHOICES)).toEqual({
      months: [1],
      monthSource: 'corpus',
      monthNote: CORPUS_ANNUAL_MONTHS.tax_003.note,
    })
    expect(resolveYearMonths({ taskId: 'tax_001', cadence: 'annual' }, DEFAULT_CHOICES).months).toEqual([3])
    // An annual the corpus does NOT date (the 1120): seeded month inside the year, deterministic,
    // and carrying the note the UI renders the SIMULATED chip from.
    const seeded = resolveYearMonths({ taskId: 'tax_002', cadence: 'annual' }, DEFAULT_CHOICES)
    expect(seeded.monthSource).toBe('seeded')
    expect(seeded.months.length).toBe(1)
    expect(seeded.months[0]).toBeGreaterThanOrEqual(1)
    expect(seeded.months[0]).toBeLessThanOrEqual(12)
    expect(seeded.monthNote).toContain('simulated')
    expect(resolveYearMonths({ taskId: 'tax_002', cadence: 'annual' }, DEFAULT_CHOICES)).toEqual(seeded)
  })

  it('the corpus really carries the dated months (tax-season chain tagline)', () => {
    const taxSeason = loadChains(DATA_DIR).find((c) => c.id === 'tax-season')!
    expect(taxSeason.tagline).toContain('January')
    expect(taxSeason.tagline).toContain('March 1')
    for (const tid of Object.keys(CORPUS_ANNUAL_MONTHS)) {
      expect(taxSeason.taskIds).toContain(tid)
    }
  })

  it('yearStats totals runs and step-executions honestly', () => {
    const row = (over: Partial<YearRow>): YearRow => ({
      taskId: 't', title: 'T', slug: 't', cadence: 'monthly', cadenceLabel: 'Monthly',
      totalSteps: 4, routes: { agent: 3, form: 1, person: 0, legalSignature: 0 }, ceilingPct: 75,
      runsPerYear: 12, always: true, months: [1], monthSource: 'cadence', monthNote: null,
      ...over,
    })
    const stats = yearStats([
      row({}),
      row({ taskId: 'a', cadence: 'annual', cadenceLabel: 'Annual', runsPerYear: 1, totalSteps: 3, routes: { agent: 1, form: 1, person: 1, legalSignature: 0 } }),
    ])
    expect(stats).toEqual({ rows: 2, totalRuns: 13, stepRuns: 51, agentStepRuns: 37 })
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
