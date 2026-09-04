import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadCategory } from '@/lib/data'
import {
  buildSimSteps, chainTasks, computeCeiling, formatMinutes, gapThemes, loadChains,
  loadProcesses, processSlug, siteCeiling, taskCeiling, VENDOR_ARENA, vendorRoles,
  type DagNode,
} from '@/lib/processes'

const DATA_DIR = path.resolve(__dirname, '../../data')

const node = (over: Partial<DagNode>): DagNode => ({
  id: 'n1',
  label: 'step',
  route: 'agent',
  estimatedMinutes: 5,
  ...over,
})

describe('corpus', () => {
  it('loads all 96 processes with unique, non-empty slugs', () => {
    const tasks = loadProcesses(DATA_DIR)
    expect(tasks.length).toBe(96)
    const slugs = tasks.map((t) => processSlug(t.title))
    expect(new Set(slugs).size).toBe(tasks.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('contains no scrubbed vendor names', () => {
    const raw = JSON.stringify(loadProcesses(DATA_DIR)).toLowerCase()
    for (const banned of ['searchmarq', 'domscan', 'daytona', 'linear.app']) {
      expect(raw.includes(banned), `corpus must not mention ${banned}`).toBe(false)
    }
  })
})

describe('computeCeiling', () => {
  it('computes agent share, minutes, approval gates, and gaps', () => {
    const ceiling = computeCeiling([
      node({ id: 'a', route: 'agent', estimatedMinutes: 2 }),
      node({ id: 'b', route: 'agent', estimatedMinutes: 4, approvalRequired: true }),
      node({ id: 'c', label: 'Notarized signature', route: 'person', estimatedMinutes: 10 }),
      node({ id: 'd', label: 'State portal filing', route: 'form', estimatedMinutes: 8 }),
    ])
    expect(ceiling.agentSteps).toBe(2)
    expect(ceiling.totalSteps).toBe(4)
    expect(ceiling.pct).toBe(50)
    expect(ceiling.agentMinutes).toBe(6)
    expect(ceiling.totalMinutes).toBe(24)
    expect(ceiling.approvalGates).toBe(1)
    expect(ceiling.gaps).toEqual([
      { label: 'Notarized signature', route: 'person', why: 'needs a human' },
      { label: 'State portal filing', route: 'form', why: 'manual form/portal — no API path' },
    ])
  })

  it('an all-agent process has a 100% ceiling and no gaps', () => {
    const ceiling = computeCeiling([node({ id: 'a' }), node({ id: 'b' })])
    expect(ceiling.pct).toBe(100)
    expect(ceiling.gaps).toEqual([])
  })

  it('site-wide ceiling aggregates every task and stays in (0, 100)', () => {
    const tasks = loadProcesses(DATA_DIR)
    const site = siteCeiling(tasks)
    expect(site.totalSteps).toBe(tasks.reduce((n, t) => n + t.dag.nodes.length, 0))
    expect(site.agentSteps).toBe(tasks.reduce((n, t) => n + taskCeiling(t).agentSteps, 0))
    expect(site.pct).toBeGreaterThan(0)
    expect(site.pct).toBeLessThan(100)
  })
})

describe('gap themes', () => {
  it('classifies every non-agent step into exactly one theme', () => {
    const tasks = loadProcesses(DATA_DIR)
    const themes = gapThemes(tasks)
    const gapCount = tasks.reduce((n, t) => n + taskCeiling(t).gaps.length, 0)
    expect(themes.reduce((n, th) => n + th.count, 0)).toBe(gapCount)
    for (const th of themes) expect(th.examples.length).toBeGreaterThan(0)
  })
})

describe('vendor -> arena mapping', () => {
  it('every mapped vendor resolves to a real product in its arena', () => {
    for (const [vendor, arenaId] of Object.entries(VENDOR_ARENA)) {
      const data = loadCategory(arenaId, DATA_DIR)
      expect(
        data.products.some((p) => p.id === vendor),
        `${vendor} should be a product id in ${arenaId}`,
      ).toBe(true)
    }
  })

  it('vendorRoles dedupes per arena, defaults to the canonical vendor, and ranks by agentReady', () => {
    const tasks = loadProcesses(DATA_DIR)
    const payrollTask = tasks.find((t) => t.id === 'qs_063')!
    const roles = vendorRoles([payrollTask], DATA_DIR)
    const payroll = roles.find((r) => r.arenaId === 'payroll')
    expect(payroll).toBeDefined()
    // gusto is listed first in the task's vendors, so it is the canonical default.
    expect(payroll!.canonicalVendor).toBe('gusto')
    expect(payroll!.defaultProductId).toBe('gusto')
    const scores = payroll!.alternatives.map((o) => o.agentReady ?? -1)
    expect([...scores].sort((a, b) => b - a)).toEqual(scores)
    // one role per arena, not one per vendor
    expect(roles.filter((r) => r.arenaId === 'payroll').length).toBe(1)
  })

  it('node vendors take precedence over the task vendor list as canonical', () => {
    const tasks = loadProcesses(DATA_DIR)
    const hire = tasks.find((t) => t.id === 'hr_001')!
    const roles = vendorRoles([hire], DATA_DIR)
    const payroll = roles.find((r) => r.arenaId === 'payroll')
    expect(payroll?.canonicalVendor).toBe('gusto')
    expect(payroll!.stepCount).toBeGreaterThan(0)
  })
})

describe('chains', () => {
  it('every chain taskId exists in the corpus and ids are unique kebab-case', () => {
    const chains = loadChains(DATA_DIR)
    expect(chains.length).toBeGreaterThanOrEqual(4)
    const taskIds = new Set(loadProcesses(DATA_DIR).map((t) => t.id))
    const ids = new Set<string>()
    for (const chain of chains) {
      expect(ids.has(chain.id)).toBe(false)
      ids.add(chain.id)
      for (const tid of chain.taskIds) {
        expect(taskIds.has(tid), `${chain.id}: unknown task ${tid}`).toBe(true)
      }
      expect(chainTasks(chain, DATA_DIR).map((t) => t.id)).toEqual(chain.taskIds)
    }
  })
})

describe('buildSimSteps', () => {
  it('flattens tasks into ordered serializable steps with mapped arenas', () => {
    const tasks = loadProcesses(DATA_DIR)
    const payroll = tasks.find((t) => t.id === 'hr_002')!
    const steps = buildSimSteps([payroll])
    expect(steps.length).toBe(payroll.dag.nodes.length)
    for (const s of steps) {
      expect(s.taskId).toBe('hr_002')
      if (s.vendor && VENDOR_ARENA[s.vendor]) expect(s.arenaId).toBe(VENDOR_ARENA[s.vendor])
      if (s.vendor && !VENDOR_ARENA[s.vendor]) expect(s.arenaId).toBeNull()
    }
    // steps must be plain JSON (client-component props)
    expect(JSON.parse(JSON.stringify(steps))).toEqual(steps)
  })
})

describe('formatMinutes', () => {
  it('renders minutes, hours, and days at human scale', () => {
    expect(formatMinutes(12)).toBe('12 min')
    expect(formatMinutes(90)).toBe('1.5 h')
    expect(formatMinutes(2880)).toBe('2 d')
  })
})
