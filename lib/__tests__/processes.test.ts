import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadCategory } from '@/lib/data'
import {
  buildSimSteps, chainTasks, computeCeiling, findProcessBySlug, formatMinutes, gapThemes,
  loadChains, loadProcesses, processSlug, siteCeiling, slugAliasFor, taskCeiling, VENDOR_ARENA,
  VENDOR_SIGNUP_URL, vendorChipInfo, vendorProductId, vendorRoles,
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
  it('loads all 106 processes with unique, non-empty slugs', () => {
    const tasks = loadProcesses(DATA_DIR)
    expect(tasks.length).toBe(106)
    const slugs = tasks.map((t) => processSlug(t.title))
    expect(new Set(slugs).size).toBe(tasks.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('keeps renamed processes reachable via slug aliases, with unique slugs across the namespace', () => {
    const tasks = loadProcesses(DATA_DIR)
    const canonical = new Set(tasks.map((t) => processSlug(t.title)))
    const aliases = tasks.flatMap((t) => t.slugAliases ?? [])
    expect(aliases.length).toBeGreaterThan(0)
    for (const a of aliases) expect(canonical.has(a.slug), `alias ${a.slug} collides with a canonical slug`).toBe(false)

    // The founder example: "Send Stripe invoice" is now the vendor-neutral "Send an invoice",
    // but the old indexed slug still resolves to the same task — with the alias identifiable
    // so the page can render its canonical pointer.
    const viaAlias = findProcessBySlug('send-stripe-invoice', DATA_DIR)
    expect(viaAlias?.title).toBe('Send an invoice')
    expect(slugAliasFor(viaAlias!, 'send-stripe-invoice')?.label).toBe('Send Stripe invoice')
    expect(slugAliasFor(viaAlias!, 'send-an-invoice')).toBeNull()
    expect(findProcessBySlug('send-an-invoice', DATA_DIR)?.id).toBe(viaAlias?.id)
  })

  it('vendor-neutral titles: no tracked vendor is named in a process title', () => {
    const vendorPhrases = Object.keys(VENDOR_ARENA)
      .map((v) => v.replace(/_/g, ' '))
      .filter((p) => p.length > 3)
    for (const t of loadProcesses(DATA_DIR)) {
      const words = new Set(t.title.toLowerCase().split(/[^a-z0-9]+/))
      for (const phrase of vendorPhrases) {
        const named = phrase.includes(' ') ? t.title.toLowerCase().includes(phrase) : words.has(phrase)
        expect(named, `"${t.title}" names vendor "${phrase}" — titles are vendor-neutral (use slugAliases for old names)`).toBe(false)
      }
    }
  })

  it('every step actionUrl is https and labeled, and every signup URL is https', () => {
    for (const t of loadProcesses(DATA_DIR)) {
      for (const n of t.dag.nodes) {
        if (!n.actionUrl) continue
        expect(n.actionUrl.startsWith('https://'), `${t.id}/${n.id} actionUrl must be https`).toBe(true)
        expect(n.actionLabel, `${t.id}/${n.id} actionUrl needs an actionLabel`).toBeTruthy()
      }
    }
    for (const [vendor, url] of Object.entries(VENDOR_SIGNUP_URL)) {
      expect(url.startsWith('https://'), `${vendor} signup URL must be https`).toBe(true)
    }
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
  it('every mapped vendor resolves (via vendorProductId) to a real product in its arena', () => {
    for (const [vendor, arenaId] of Object.entries(VENDOR_ARENA)) {
      const data = loadCategory(arenaId, DATA_DIR)
      const productId = vendorProductId(vendor)
      expect(
        data.products.some((p) => p.id === productId),
        `${vendor} (product id ${productId}) should be a product id in ${arenaId}`,
      ).toBe(true)
    }
  })

  it('every corpus vendorOption is either arena-tracked or an intentional unlinked chip', () => {
    const tracked = new Set(Object.keys(VENDOR_ARENA))
    // Untracked options we still show honestly (no arena yet) — keep this list deliberate.
    const allowedUntracked = new Set([
      'doola', 'google_sheets', 'google_drive', 'dropbox', 'legalzoom', 'northwest',
      'vanta', 'termly', 'iubenda', 'producthunt', 'betalist', 'hackernews',
      'ahrefs', 'semrush', 'google_search_console', 'apollo', 'mailchimp', 'sendgrid',
    ])
    for (const task of loadProcesses(DATA_DIR)) {
      for (const n of task.dag.nodes) {
        for (const v of n.vendorOptions ?? []) {
          expect(
            tracked.has(v) || allowedUntracked.has(v),
            `${task.id}/${n.id}: vendorOption ${v} is neither tracked nor allow-listed`,
          ).toBe(true)
        }
      }
    }
  })

  it('vendorChipInfo resolves tracked vendors to a live product with rank, untracked to an unlinked chip', () => {
    const clerky = vendorChipInfo('clerky', DATA_DIR)
    expect(clerky.productId).toBe('clerky')
    expect(clerky.arenaId).toBe('legal-ops')
    expect(clerky.arenaName).toBeTruthy()
    expect(clerky.rank).toBeGreaterThanOrEqual(1)

    // snake_case vendor key resolves to the kebab-case judged product id
    const atlas = vendorChipInfo('stripe_atlas', DATA_DIR)
    expect(atlas.productId).toBe('stripe-atlas')
    expect(atlas.arenaId).toBe('legal-ops')
    expect(atlas.label).toBe('Stripe Atlas')

    // untracked vendor: honest unlinked chip, label still pretty
    const doola = vendorChipInfo('doola', DATA_DIR)
    expect(doola.productId).toBeNull()
    expect(doola.arenaId).toBeNull()
    expect(doola.label).toBe('Doola')
  })

  it('the formation-service step lists the real market: clerky, stripe_atlas, firstbase tracked + doola unlinked', () => {
    const incorporate = loadProcesses(DATA_DIR).find((t) => t.id === 'form_001')!
    const choose = incorporate.dag.nodes.find((n) => n.label === 'Choose formation service')!
    expect(choose.vendorOptions).toEqual(['clerky', 'stripe_atlas', 'firstbase', 'doola'])
    const chips = choose.vendorOptions!.map((v) => vendorChipInfo(v, DATA_DIR))
    expect(chips.filter((c) => c.productId).length).toBe(3)
    expect(chips.filter((c) => !c.productId).map((c) => c.label)).toEqual(['Doola'])
  })

  it('track-runway lists the real market: banking AND accounting options, not just Mercury', () => {
    const runway = loadProcesses(DATA_DIR).find((t) => t.id === 'qs_050')!
    const optionVendors = new Set(runway.dag.nodes.flatMap((n) => n.vendorOptions ?? []))
    for (const v of ['mercury', 'brex', 'relay', 'quickbooks', 'xero', 'pilot']) {
      expect(optionVendors.has(v), `track-runway should list ${v}`).toBe(true)
    }
    const roles = vendorRoles([runway], DATA_DIR)
    const arenas = roles.map((r) => r.arenaId)
    expect(arenas).toContain('startup-banking')
    expect(arenas).toContain('accounting')
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
