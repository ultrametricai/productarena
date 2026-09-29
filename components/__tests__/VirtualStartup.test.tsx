// @vitest-environment jsdom
// VirtualStartup — the synthetic-labeling invariant at the DOM level, plus the decision →
// rendered-journey wiring. The invariant is STRUCTURAL since 2026-09-29: the founder removed the
// visible 'simulated' labels from the whole interface, so every generated artifact node carries
// data-synthetic="true" (asserted per node here) and keeps the distinct fuchsia styling — the
// honesty contract moved from a visible chip to a machine-checkable attribute, and NO visible
// 'simulated' string may render anywhere on /virtual-startup (also asserted here).
// Fixture chains/tasks keep the journey small; the decision→journey mapping itself is tested
// against the live corpus in lib/__tests__/virtualStartup.test.ts.
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import VirtualStartup from '@/components/VirtualStartup'
import type { SimStep } from '@/lib/processSim'
import type { EventExample, VirtualTaskPayload, VsChain, YearCandidate } from '@/lib/virtualStartup'

const step = (taskId: string, label: string, over: Partial<SimStep> = {}): SimStep => ({
  taskId,
  taskTitle: taskId,
  label,
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

const task = (id: string, title: string, over: Partial<VirtualTaskPayload> = {}): VirtualTaskPayload => ({
  id,
  title,
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  phase: 'formation',
  description: `${title} description`,
  steps: [step(id, `${title} — step 1`)],
  tops: [null],
  ...over,
})

// journeyPhases resolves every VS_CHAIN_IDS chain, so the fixture must cover all ten.
const CHAINS: VsChain[] = [
  { id: 'name-the-company', name: 'Name the company', taskIds: ['brand_001'] },
  { id: 'company-launch', name: 'Company launch', taskIds: ['form_001', 'startup_002', 'qs_023'] },
  { id: 'raise-a-seed-round', name: 'Raise a seed round', taskIds: ['fund_001'] },
  { id: 'set-up-compliance', name: 'Set up compliance (SOC 2-lite)', taskIds: ['ops_005'] },
  { id: 'ship-v1', name: 'Ship v1', taskIds: ['prod_006'] },
  { id: 'launch-website', name: 'Launch the website', taskIds: ['site_001'] },
  { id: 'get-paid', name: 'Get paid', taskIds: ['qs_021', 'growth_001', 'sales_002'] },
  { id: 'first-hire', name: 'First hire', taskIds: ['hr_001', 'hr_002'] },
  { id: 'launch-on-product-hunt', name: 'Launch on Product Hunt', taskIds: ['growth_010'] },
  { id: 'land-the-enterprise-deal', name: 'Land the enterprise deal', taskIds: ['comp_002'] },
]

const TASKS: Record<string, VirtualTaskPayload> = Object.fromEntries(
  [
    task('brand_001', 'Generate a company name'),
    task('form_001', 'Incorporate C-Corp', {
      steps: [
        step('form_001', 'Submit incorporation filing', { route: 'form', approvalRequired: true }),
        // A multi-day wait pushes the elapsed clock past day 1 (2880 corpus minutes).
        step('form_001', 'Receive Certificate of Incorporation', { route: 'person', async: true, estimatedMinutes: 2880 }),
      ],
      tops: [
        { productId: 'best-legal', name: 'Best Legal', score: 82.5, arenaId: 'legal-ops', arenaName: 'Legal ops' },
        null,
      ],
    }),
    task('form_011', 'Set up an LLC'),
    task('startup_002', 'Founder agreement & equity split'),
    task('qs_023', 'Open bank account'),
    task('fund_001', 'Raise pre-seed (SAFEs)'),
    task('ops_005', 'Set up a password manager'),
    task('prod_006', 'Set up a code hosting org'),
    task('site_001', 'Generate a website'),
    task('qs_021', 'Connect a payment processor'),
    task('growth_001', 'Set up subscription billing'),
    task('sales_002', 'Send an invoice'),
    task('hr_001', 'Hire first employee'),
    task('hr_002', 'Run payroll'),
    task('growth_010', 'Launch on Product Hunt & directories'),
    task('comp_002', 'Complete SOC 2 Type II'),
  ].map((t) => [t.id, t]),
)

// Year-view candidates: two always-on rhythm rows (one corpus-dated annual) plus two
// journey-gated ones (payroll with the hire, Type II with the enterprise motion).
const YEAR_CANDIDATES: YearCandidate[] = [
  {
    taskId: 'fin_002', title: 'Bookkeeping close', slug: 'bookkeeping-close', cadence: 'monthly',
    cadenceLabel: 'Monthly', totalSteps: 4, routes: { agent: 3, form: 1, person: 0, legalSignature: 0 },
    ceilingPct: 75, runsPerYear: 12, always: true, gate: null,
  },
  {
    taskId: 'hr_002', title: 'Run payroll', slug: 'run-payroll', cadence: 'monthly',
    cadenceLabel: 'Monthly', totalSteps: 5, routes: { agent: 4, form: 0, person: 1, legalSignature: 0 },
    ceilingPct: 80, runsPerYear: 12, always: false, gate: null,
  },
  // A cadence-sweep row (not journey-carried): gated on the funding decision.
  {
    taskId: 'scale_005', title: 'Board meeting prep', slug: 'board-meeting-prep', cadence: 'quarterly',
    cadenceLabel: 'Quarterly', totalSteps: 4, routes: { agent: 2, form: 1, person: 1, legalSignature: 0 },
    ceilingPct: 50, runsPerYear: 4, always: false,
    gate: { choice: 'funding', value: 'seed', why: 'a financed board meets quarterly' },
  },
  {
    taskId: 'tax_001', title: 'File DE franchise tax', slug: 'file-de-franchise-tax', cadence: 'annual',
    cadenceLabel: 'Annual', totalSteps: 3, routes: { agent: 1, form: 1, person: 1, legalSignature: 0 },
    ceilingPct: 33, runsPerYear: 1, always: true, gate: null,
  },
  {
    taskId: 'comp_002', title: 'Complete SOC 2 Type II', slug: 'complete-soc-2-type-ii', cadence: 'annual',
    cadenceLabel: 'Annual', totalSteps: 6, routes: { agent: 2, form: 2, person: 2, legalSignature: 0 },
    ceilingPct: 33, runsPerYear: 1, always: false, gate: null,
  },
]

// Event-driven examples — one always-on, one enterprise-gated.
const EVENT_EXAMPLES: EventExample[] = [
  {
    taskId: 'opp_001', title: 'Send a wire or ACH payment', slug: 'send-a-wire-or-ach-payment',
    totalSteps: 3, routes: { agent: 2, form: 1, person: 0, legalSignature: 0 }, ceilingPct: 66,
    trigger: 'a vendor bill needs paying', gate: { choice: null, why: 'every company pays vendors' },
  },
  {
    taskId: 'legal_001', title: 'Send NDA', slug: 'send-nda',
    totalSteps: 2, routes: { agent: 1, form: 0, person: 1, legalSignature: 1 }, ceilingPct: 50,
    trigger: 'an enterprise conversation starts',
    gate: { choice: 'enterprise', value: 'yes', why: 'enterprise conversations start under NDA' },
  },
]

const renderIt = () =>
  render(
    <VirtualStartup
      chains={CHAINS}
      tasks={TASKS}
      roles={[]}
      yearCandidates={YEAR_CANDIDATES}
      eventExamples={EVENT_EXAMPLES}
      // Empty v3 payloads: no roles → no outcome modifiers, and no risks → no plausibility gate
      // passes, so the seeded mid-run events stay out of these fixtures' timelines. The v3
      // surfaces get their own suite (components/__tests__/VirtualStartupRun.test.tsx).
      access={{}}
      pricing={{}}
      taskRisks={{}}
    />,
  )
// The skip-animation link is gone (founder 2026-09-28) — reveal the full timeline by running
// the startup under fake timers (the reveal interval self-clears when the last row prints).
const showAll = () => {
  vi.useFakeTimers()
  try {
    fireEvent.click(screen.getByRole('button', { name: /run this startup|run it again/i }))
    act(() => {
      vi.runAllTimers()
    })
  } finally {
    vi.useRealTimers()
  }
}
// Decisions are dropdowns (founder addendum 2026-09-29): open the trigger, click the option
// (canonical full labels are the options' accessible names).
const pickDecision = (id: string, optionName: string | RegExp) => {
  fireEvent.click(screen.getByTestId(`vs-decision-${id}`))
  fireEvent.click(screen.getByRole('option', { name: optionName }))
}
// The trigger's title carries the asserted option's full label (or 'not set').
const decisionTitle = (id: string) => screen.getByTestId(`vs-decision-${id}`).getAttribute('title') ?? ''
const rhythmSection = () => screen.getByText('The operating rhythm').closest('section')!
// The journey DAG strip (components/VsJourneyDag.tsx, 2026-09-29) mirrors the process and phase
// titles above the terminal, so journey-composition assertions scope to the terminal body.
const termBody = () => within(screen.getByTestId('vs-terminal-body'))
const showYearTab = () => fireEvent.click(within(rhythmSection()).getByRole('button', { name: 'Year one' }))

// URL state is a real contract here (?preset / ?yc) — start every test from a clean URL.
beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('VirtualStartup — synthetic labeling invariant (structural since 2026-09-29)', () => {
  it('stamps data-synthetic="true" on EVERY generated artifact node (the visible chip is gone; the attribute is the invariant)', () => {
    renderIt()
    showAll()
    const artifacts = screen.getAllByTestId('vs-artifact')
    expect(artifacts.length).toBeGreaterThan(0)
    for (const node of artifacts) {
      expect(node.getAttribute('data-synthetic')).toBe('true')
      // The distinct fuchsia artifact styling stays (color, no label).
      expect(node.className).toContain('fuchsia')
    }
  })

  it('NO visible "simulated" string renders anywhere — pre-run or after a full run', () => {
    const { container } = renderIt()
    expect(container.textContent).not.toMatch(/simulated/i)
    showAll()
    expect(container.textContent).not.toMatch(/simulated/i)
    expect(screen.getAllByTestId('vs-artifact').length).toBeGreaterThan(0)
  })
})

describe('VirtualStartup — decisions drive the rendered journey', () => {
  it('defaults to the C-Corp seed journey with judged top-vendor pills and day markers', () => {
    renderIt()
    showAll()
    expect(termBody().getByText('Incorporate C-Corp')).toBeTruthy()
    expect(screen.queryByText('Set up an LLC')).toBeNull()
    expect(termBody().getByText('Founder agreement & equity split')).toBeTruthy()
    expect(termBody().getByText('Raise pre-seed (SAFEs)')).toBeTruthy()
    expect(termBody().getByText('Set up subscription billing')).toBeTruthy()
    expect(screen.queryByText('Send an invoice')).toBeNull()
    // The judged top vendor renders as a link to its product page with its step score.
    const pill = screen.getByRole('link', { name: /best legal · 83/i })
    expect(pill.getAttribute('href')).toBe('/arena/legal-ops/product/best-legal')
    // The 2880-minute corpus wait rolls the clock into day 3.
    expect(screen.getByText(/— day 3 —/)).toBeTruthy()
  })

  it('switching decisions resets the reveal and swaps the real processes', () => {
    renderIt()
    showAll()
    pickDecision('entity', 'LLC')
    // Choice change resets the timeline — nothing revealed until re-run.
    expect(screen.queryAllByTestId('vs-artifact')).toHaveLength(0)
    showAll()
    expect(termBody().getByText('Set up an LLC')).toBeTruthy()
    expect(screen.queryByText('Incorporate C-Corp')).toBeNull()

    pickDecision('funding', 'Bootstrap')
    pickDecision('team', 'Solo founder')
    pickDecision('product', 'Invoice-billed services')
    showAll()
    expect(screen.queryByText('Raise pre-seed (SAFEs)')).toBeNull()
    expect(screen.queryByText('Founder agreement & equity split')).toBeNull()
    expect(termBody().getByText('Send an invoice')).toBeTruthy()
    expect(screen.queryByText('Set up subscription billing')).toBeNull()
  })

  it('the 2026-09-25 toggles: hire, enterprise, PH launch, build-first ordering all reshape the journey', () => {
    renderIt()
    showAll()
    // Defaults: hire yes (playbook in), enterprise no, PH yes, name-first.
    expect(termBody().getByText('Hire first employee')).toBeTruthy()
    expect(screen.queryByText('Complete SOC 2 Type II')).toBeNull()
    expect(termBody().getByText('Launch on Product Hunt & directories')).toBeTruthy()
    expect(termBody().getByText('Set up a password manager')).toBeTruthy() // compliance chain always runs

    pickDecision('hire', 'Stay founders-only')
    pickDecision('enterprise', 'Chase the enterprise deal')
    pickDecision('ph', 'Stealth mode')
    pickDecision('ordering', 'Build first')
    showAll()
    expect(screen.queryByText('Hire first employee')).toBeNull()
    expect(screen.getAllByText('Complete SOC 2 Type II').length).toBeGreaterThan(0)
    expect(screen.queryByText('Launch on Product Hunt & directories')).toBeNull()
    // Build-first: the ship-v1 phase renders before name & brand in document order.
    const build = termBody().getByText('Build & ship v1')
    const name = termBody().getByText('Name & brand')
    expect(build.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('VirtualStartup — launch options (founder round 4, item 7)', () => {
  it('Show HN runs the SAME launch playbook with the venue named; the launch-day artifact says Show HN', () => {
    renderIt()
    pickDecision('ph', 'Show HN')
    showAll()
    // The launch chain still runs — same corpus process, venue-flavored copy only.
    expect(termBody().getByText('Launch on Product Hunt & directories')).toBeTruthy()
    expect(termBody().getByText(/Show HN — the same launch playbook/)).toBeTruthy()
    const launchArtifact = screen
      .getAllByTestId('vs-artifact')
      .find((a) => /Launch day/.test(a.textContent ?? ''))!
    expect(launchArtifact.textContent).toContain('Show HN')
    expect(launchArtifact.getAttribute('data-synthetic')).toBe('true')
  })

  it('Waitlist launch runs the same playbook (email capture = the waitlist) with the venue note', () => {
    renderIt()
    pickDecision('ph', 'Waitlist launch')
    showAll()
    expect(termBody().getByText('Launch on Product Hunt & directories')).toBeTruthy()
    expect(termBody().getByText(/waitlist launch — the same launch playbook/)).toBeTruthy()
    const launchArtifact = screen
      .getAllByTestId('vs-artifact')
      .find((a) => /Launch day/.test(a.textContent ?? ''))!
    expect(launchArtifact.textContent).toContain('waitlist')
  })

  it('Stealth mode genuinely skips the launch chain — no launch phase, ongoing operations continue', () => {
    renderIt()
    pickDecision('ph', 'Stealth mode')
    showAll()
    expect(screen.queryByText('Launch on Product Hunt & directories')).toBeNull()
    expect(screen.queryByText('Launch day')).toBeNull()
    // The run still completes and the operating rhythm still opens (ops continue post-stealth).
    expect(within(screen.getByTestId('vs-terminal-body')).getByText(/journey complete/)).toBeTruthy()
    expect(screen.getByText('The operating rhythm')).toBeTruthy()
  })
})

describe('VirtualStartup — run CTA and the operating rhythm (30/90/year tabs)', () => {
  it('shows the primary run CTA with an idle terminal — no timeline content before a run', () => {
    renderIt()
    expect(screen.getByRole('button', { name: /run this startup/i })).toBeTruthy()
    expect(screen.queryAllByTestId('vs-artifact')).toHaveLength(0)
    expect(screen.queryByText('The operating rhythm')).toBeNull()
  })

  it('renders the year view (Year one tab), gated by the decisions and grouped by cadence', () => {
    renderIt()
    showAll()
    showYearTab()
    const year = within(rhythmSection())
    // Always-on spine + the hire-gated payroll + the seed-gated sweep row; no enterprise motion.
    expect(year.getByText('Bookkeeping close')).toBeTruthy()
    expect(year.getByText('Run payroll')).toBeTruthy()
    expect(year.getByText('Board meeting prep')).toBeTruthy() // sweep gate: funding=seed (default)
    expect(year.queryByText('Complete SOC 2 Type II')).toBeNull()
    expect(screen.getAllByTestId('vs-year-row')).toHaveLength(4)
    // Rows group by cadence: Monthly / Quarterly / Annual headers.
    expect(screen.getAllByTestId('vs-cadence-group').map((g) => g.textContent)).toEqual([
      'Monthly', 'Quarterly', 'Annual',
    ])
    // The corpus-dated tax deadline renders its corpus note (real data, no simulated chip).
    const taxRow = screen.getAllByTestId('vs-year-row').find((r) => r.getAttribute('data-month-source') === 'corpus')!
    expect(within(taxRow).getByText(/by March 1/)).toBeTruthy()
    expect(within(taxRow).queryByText(/^simulated$/i)).toBeNull()
    // The summary totals: 12 + 12 + 4 + 1 = 29 recurring runs.
    const summary = screen.getByTestId('vs-year-summary')
    expect(summary.textContent).toContain('29')
    expect(summary.textContent).toContain('recurring runs')
  })

  it('sweep rows leave the year when their gate turns off', () => {
    renderIt()
    pickDecision('funding', 'Bootstrap')
    showAll()
    showYearTab()
    expect(within(rhythmSection()).queryByText('Board meeting prep')).toBeNull()
  })

  it('marks seeded (non-corpus-dated) annual slots data-synthetic with the seeded note — no visible label', () => {
    renderIt()
    pickDecision('enterprise', 'Chase the enterprise deal')
    showAll()
    showYearTab()
    const seeded = screen.getAllByTestId('vs-year-row').filter((r) => r.getAttribute('data-month-source') === 'seeded')
    expect(seeded).toHaveLength(1)
    expect(within(seeded[0]).getByText('Complete SOC 2 Type II')).toBeTruthy()
    const note = seeded[0].querySelector('[data-synthetic="true"]')
    expect(note).not.toBeNull()
    expect(note!.textContent).toContain('seeded')
  })

  it('first 30 days is the default tab: cadence-math first runs, no annuals, journey day span shown', () => {
    renderIt()
    showAll()
    const section = within(rhythmSection())
    expect(section.getByRole('button', { name: 'First 30 days' }).getAttribute('aria-pressed')).toBe('true')
    // The launch journey day span comes from the corpus estimates (fixture: 2880-min wait → day 3).
    expect(section.getByText(/spans day 1–3/)).toBeTruthy()
    const rows = screen.getAllByTestId('vs-window-row')
    expect(rows).toHaveLength(2) // fin_002 + hr_002 — monthlies land once at day 30
    for (const r of rows) {
      expect(within(r).getByText('day 30')).toBeTruthy()
      expect(within(r).getByText('×1')).toBeTruthy()
    }
    // Quarterlies and annuals don't land inside 30 days.
    expect(section.queryByText('Board meeting prep')).toBeNull()
    expect(section.queryByText('File DE franchise tax')).toBeNull()
    // The annual-processes explainer was removed (founder 2026-09-29) — annuals simply absent.
    expect(section.queryByText(/Annual processes carry no day here/)).toBeNull()
  })

  it('first 90 days: monthlies ×3 and the quarterly board prep lands at day 90', () => {
    renderIt()
    showAll()
    fireEvent.click(within(rhythmSection()).getByRole('button', { name: 'First 90 days' }))
    const rows = screen.getAllByTestId('vs-window-row')
    expect(rows).toHaveLength(3) // fin_002, hr_002, scale_005
    const board = rows.find((r) => within(r).queryByText('Board meeting prep'))!
    expect(within(board).getByText('day 90')).toBeTruthy()
    expect(within(board).getByText('×1')).toBeTruthy()
    const close = rows.find((r) => within(r).queryByText('Bookkeeping close'))!
    expect(within(close).getByText('×3')).toBeTruthy()
  })

  it('event-driven examples render undated with their triggers, gated by the decisions', () => {
    renderIt()
    showAll()
    // Default: enterprise off — only the always-on wire example.
    let events = screen.getAllByTestId('vs-event-row')
    expect(events).toHaveLength(1)
    expect(within(events[0]).getByText('Send a wire or ACH payment')).toBeTruthy()
    expect(within(events[0]).getByText(/when a vendor bill needs paying/)).toBeTruthy()
    pickDecision('enterprise', 'Chase the enterprise deal')
    showAll()
    events = screen.getAllByTestId('vs-event-row')
    expect(events).toHaveLength(2)
    expect(screen.getByText(/when an enterprise conversation starts/)).toBeTruthy()
  })
})

// The compact setup band (founder 2026-09-28: "make the examples, decisions and 'who is the
// founder' much more compact, so we can see the terminal above the fold") — structure only;
// every preset/persona/toggle interaction stays semantically identical and is covered by the
// suites around this one.
describe('VirtualStartup — the compact setup band (decisions as dropdowns, 2026-09-29)', () => {
  it('one band holds presets, YC mode, founder axes, all nine decision dropdowns, drive mode, and the run CTA — and renders before the terminal', () => {
    renderIt()
    const band = screen.getByTestId('vs-setup')
    expect(within(band).getByTestId('vs-preset-software')).toBeTruthy()
    expect(within(band).getByTestId('vs-yc-toggle')).toBeTruthy()
    expect(within(band).getByTestId('vs-persona-picker')).toBeTruthy()
    expect(within(band).getByRole('group', { name: 'Drive mode' })).toBeTruthy()
    expect(within(band).getByRole('button', { name: /run this startup/i })).toBeTruthy()
    // The skip-animation link is gone (founder 2026-09-28) — Run is the band's only run control.
    expect(within(band).queryByRole('button', { name: /show the whole timeline/i })).toBeNull()
    // No pre-run company line (founder addendum 2026-09-29): the name comes into existence at
    // the run's naming step, so the band never announces a company upfront.
    expect(within(band).queryByText(/your virtual company/i)).toBeNull()
    // Every decision renders as a listbox dropdown starting at 'Not set' — EXCEPT the
    // DEFAULT-ASSERTED entity (founder round 4, item 5), which starts asserted at
    // 'Delaware C-Corp'; opening a dropdown exposes the canonical full labels as option
    // accessible names, plus the explicit Not-set row.
    const optionNames: Record<string, string[]> = {
      entity: ['Delaware C-Corp', 'LLC'],
      team: ['Cofounders', 'Solo founder'],
      funding: ['Raise a seed', 'Bootstrap'],
      product: ['SaaS subscriptions', 'Invoice-billed services'],
      ordering: ['Name first', 'Build first'],
      hire: ['Make the first hire', 'Stay founders-only'],
      compliance: ['Compliance early', 'Compliance later'],
      enterprise: ['Not yet', 'Chase the enterprise deal'],
      // Launch options (founder round 4, item 7): venue-flavored public launches + stealth.
      ph: ['Product Hunt', 'Stealth mode', 'Show HN', 'Waitlist launch'],
    }
    for (const [id, names] of Object.entries(optionNames)) {
      const trigger = within(band).getByTestId(`vs-decision-${id}`)
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
      if (id === 'entity') expect(trigger.textContent).toContain('C-Corp') // default-asserted
      else expect(trigger.textContent).toContain('Not set')
      fireEvent.click(trigger)
      for (const name of names) expect(screen.getByRole('option', { name })).toBeTruthy()
      expect(screen.getByTestId(`vs-decision-${id}-notset`).getAttribute('aria-selected')).toBe(
        id === 'entity' ? 'false' : 'true',
      )
      fireEvent.click(trigger) // close before the next one
    }
    // The band precedes the terminal in document order — the terminal sits right under it.
    const term = screen.getByTestId('vs-terminal')
    expect(band.compareDocumentPosition(term) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renamed visible group labels — Start with / Business model — while canonical accessible names stay put', () => {
    renderIt()
    const band = screen.getByTestId('vs-setup')
    // Visible micro-labels (non-interactive, colon-suffixed).
    expect(within(band).getByText('Start with:')).toBeTruthy()
    expect(within(band).getByText('Business model:')).toBeTruthy()
    expect(within(band).queryByText('Order:')).toBeNull()
    expect(within(band).queryByText('Model:')).toBeNull()
    // Canonical accessible names unchanged: the groups and full option labels.
    expect(within(band).getByRole('group', { name: 'What comes first' })).toBeTruthy()
    expect(within(band).getByRole('group', { name: 'Business model' })).toBeTruthy()
    fireEvent.click(within(band).getByTestId('vs-decision-ordering'))
    expect(screen.getByRole('option', { name: 'Name first' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Build first' })).toBeTruthy()
  })

  it("dropdown semantics: picking asserts (title shows the full label + mapping), 'Not set' clears back, asserting the default value still asserts", () => {
    renderIt()
    // Unasserted: the trigger says so and names the default it composes.
    expect(decisionTitle('enterprise')).toContain('not set')
    expect(decisionTitle('enterprise')).toContain('Not yet')
    pickDecision('enterprise', 'Chase the enterprise deal')
    expect(decisionTitle('enterprise')).toContain('Chase the enterprise deal')
    expect(decisionTitle('enterprise')).toContain('land-the-enterprise-deal')
    // Clear back to Not set via the explicit listbox row.
    fireEvent.click(screen.getByTestId('vs-decision-enterprise'))
    fireEvent.click(screen.getByTestId('vs-decision-enterprise-notset'))
    expect(decisionTitle('enterprise')).toContain('not set')
    // Explicitly asserting the DEFAULT'S value is an assertion, not a no-op.
    pickDecision('team', 'Cofounders')
    expect(decisionTitle('team')).toContain('Cofounders')
    expect(decisionTitle('team')).not.toContain('not set')
  })

  it("entity is DEFAULT-ASSERTED (founder round 4, item 5): starts asserted at 'Delaware C-Corp', never asked, and one click clears it back to Not set", () => {
    renderIt()
    // Asserted from the first render — not the 'not set' phrasing.
    expect(decisionTitle('entity')).toContain('Delaware C-Corp')
    expect(decisionTitle('entity')).not.toContain('not set')
    expect(screen.getByTestId('vs-decision-entity').textContent).toContain('C-Corp')
    // The assertion composes the C-Corp branch, exactly as if the reader had picked it.
    showAll()
    expect(termBody().getByText('Incorporate C-Corp')).toBeTruthy()
    // The reader can still unassert it (the mechanism, not a lock).
    fireEvent.click(screen.getByTestId('vs-decision-entity'))
    fireEvent.click(screen.getByTestId('vs-decision-entity-notset'))
    expect(decisionTitle('entity')).toContain('not set')
  })

  it("'Not set' composes exactly the default branch — the journey is identical to the default combo", () => {
    // Nothing asserted: the default journey renders (C-Corp, seed raise, subscriptions…).
    renderIt()
    showAll()
    const notSet = screen.getByTestId('vs-terminal-body').textContent
    expect(termBody().getByText('Incorporate C-Corp')).toBeTruthy()
    // Re-run with every decision explicitly asserted to its default value: same rows (each
    // assertion resets the terminal; the final showAll replays the full journey).
    for (const [id, name] of [
      ['entity', 'Delaware C-Corp'], ['team', 'Cofounders'], ['funding', 'Raise a seed'],
      ['product', 'SaaS subscriptions'], ['ordering', 'Name first'], ['hire', 'Make the first hire'],
      ['compliance', 'Compliance early'], ['enterprise', 'Not yet'], ['ph', 'Product Hunt'],
    ] as const) {
      pickDecision(id, name)
    }
    showAll()
    expect(screen.getByTestId('vs-terminal-body').textContent).toBe(notSet)
  })

  it("the 'full setup guide' expander is GONE (founder round 4, item 1) — the honesty copy lives on in tooltips", () => {
    const { container } = renderIt()
    expect(screen.queryByText(/full setup guide/i)).toBeNull()
    expect(container.querySelector('details')).toBeNull() // no disclosure widget in the band
    // The explanations survive as tooltips: the preset ⓘ carries the corpus disclosure…
    const disclosures = screen.getAllByTestId('vs-preset-disclosure')
    expect(disclosures.length).toBe(2)
    for (const d of disclosures) expect(d.getAttribute('title')).toContain('same real software-company process corpus')
    // …the axis pills carry their named simulation assumptions…
    expect(screen.getByTestId('vs-persona-non-technical').getAttribute('title')).toContain('simulation assumption')
    expect(screen.getByTestId('vs-persona-second-timer').getAttribute('title')).toContain('simulation assumption')
    // …and each decision option keeps its corpus mapping in its option tooltip.
    fireEvent.click(screen.getByTestId('vs-decision-funding'))
    expect(screen.getByTestId('vs-decision-funding-seed').getAttribute('title')).toContain('Raise a seed round')
  })
})

describe('VirtualStartup — preset example companies and the ?preset= contract', () => {
  it('renders the three preset pills; the honesty disclosure sits on hardware and biotech, NOT software', () => {
    renderIt()
    expect(screen.getByTestId('vs-preset-software')).toBeTruthy()
    expect(screen.getByTestId('vs-preset-hardware')).toBeTruthy()
    expect(screen.getByTestId('vs-preset-biotech')).toBeTruthy()
    const disclosures = screen.getAllByTestId('vs-preset-disclosure')
    expect(disclosures).toHaveLength(2)
    // Reachable BEFORE any run, on the pill itself: ⓘ tooltip + screen-reader text.
    for (const d of disclosures) {
      expect(d.textContent).toContain('same real software-company process corpus')
      expect(d.getAttribute('title')).toContain('same real software-company process corpus')
    }
    expect(within(screen.getByTestId('vs-preset-software')).queryByTestId('vs-preset-disclosure')).toBeNull()
    expect(within(screen.getByTestId('vs-preset-hardware')).getByTestId('vs-preset-disclosure')).toBeTruthy()
    expect(within(screen.getByTestId('vs-preset-biotech')).getByTestId('vs-preset-disclosure')).toBeTruthy()
    // Preset pills carry NO simulated chip (founder 2026-09-28) — the tags live in the terminal.
    for (const id of ['software', 'hardware', 'biotech']) {
      expect(within(screen.getByTestId(`vs-preset-${id}`)).queryByText(/^simulated$/i)).toBeNull()
    }
  })

  it('one tap applies the full combo + themed identity and writes ?preset= (the name only appears IN the run — no pre-run company line)', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-preset-hardware'))
    expect(window.location.search).toContain('preset=hardware')
    // No pre-run company line (founder addendum 2026-09-29) — the identity surfaces at the
    // run's naming step, as the Company-name artifact.
    expect(screen.queryByText(/your virtual company/i)).toBeNull()
    expect(screen.queryByText('Holofield, Inc.')).toBeNull()
    // The hardware combo: build-first, invoice-billed, no PH launch, enterprise on.
    showAll()
    // The naming step's artifact carries the identity (terminal body; the panel mirrors it).
    expect(within(screen.getByTestId('vs-terminal-body')).getAllByText(/Holofield, Inc\./).length).toBeGreaterThan(0)
    expect(termBody().getByText('Send an invoice')).toBeTruthy()
    expect(screen.queryByText('Set up subscription billing')).toBeNull()
    expect(screen.queryByText('Launch on Product Hunt & directories')).toBeNull()
    expect(screen.getAllByText('Complete SOC 2 Type II').length).toBeGreaterThan(0)
    const build = termBody().getByText('Build & ship v1')
    const name = termBody().getByText('Name & brand')
    expect(build.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('identity is deterministic across re-renders', () => {
    const { rerender } = renderIt()
    fireEvent.click(screen.getByTestId('vs-preset-biotech'))
    showAll()
    const body = () => within(screen.getByTestId('vs-terminal-body'))
    expect(body().getAllByText(/Demovax, Inc\./).length).toBeGreaterThan(0)
    rerender(
      <VirtualStartup chains={CHAINS} tasks={TASKS} roles={[]} yearCandidates={YEAR_CANDIDATES} eventExamples={EVENT_EXAMPLES} access={{}} pricing={{}} taskRisks={{}} />,
    )
    expect(body().getAllByText(/Demovax, Inc\./).length).toBeGreaterThan(0)
  })

  it('?preset= is read on mount only and asserts combo + identity', () => {
    window.history.replaceState(null, '', '/?preset=biotech')
    renderIt()
    expect(screen.getByTestId('vs-preset-biotech').getAttribute('aria-pressed')).toBe('true')
    // Biotech runs compliance EARLY — asserted in the dropdowns.
    expect(decisionTitle('compliance')).toContain('Compliance early')
    expect(decisionTitle('product')).toContain('Invoice-billed services')
    showAll()
    expect(within(screen.getByTestId('vs-terminal-body')).getAllByText(/Demovax, Inc\./).length).toBeGreaterThan(0)
  })

  it('a pristine view never writes ?preset; junk preset values are ignored', () => {
    window.history.replaceState(null, '', '/?preset=nonsense')
    renderIt()
    expect(screen.getByTestId('vs-preset-software').getAttribute('aria-pressed')).toBe('false')
    expect(screen.queryByText('Agentloop, Inc.')).toBeNull()
  })

  it('manually changing any decision clears ?preset (and the identity) but keeps the asserted combo', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-preset-hardware'))
    expect(window.location.search).toContain('preset=hardware')
    pickDecision('team', 'Solo founder')
    expect(window.location.search).not.toContain('preset')
    expect(screen.getByTestId('vs-preset-hardware').getAttribute('aria-pressed')).toBe('false')
    // …but the rest of the preset combo survives the manual change, asserted.
    expect(decisionTitle('product')).toContain('Invoice-billed services')
    expect(decisionTitle('ordering')).toContain('Build first')
    showAll()
    // Identity reverted to the combo-seeded name: no Holofield artifact in the run (the preset
    // PILL still shows its own name — scope to the terminal body).
    expect(within(screen.getByTestId('vs-terminal-body')).queryByText(/Holofield/)).toBeNull()
    expect(screen.queryByText('Founder agreement & equity split')).toBeNull()
    expect(termBody().getByText('Send an invoice')).toBeTruthy()
  })
})

// Funding scenarios (founder round 3, 2026-09-29, item 1): the setup row is 'Scenario', and two
// one-tap pills — VC backed / Bootstrapped — assert the funding decision plus the calibrations
// that sensibly follow it (a PARTIAL combo, tooltip-documented), sharing the ?preset= param
// namespace with the company presets.
describe('VirtualStartup — funding scenarios (VC backed vs Bootstrapped) on the Scenario row', () => {
  it("the row label reads 'Scenario' (not 'Example'), and both pills carry the mapping tooltip", () => {
    renderIt()
    const band = screen.getByTestId('vs-setup')
    expect(within(band).getByTitle('Scenario — one-tap setups: example companies and funding scenarios')).toBeTruthy()
    expect(within(band).queryByTitle('Example companies — one-tap preset setups')).toBeNull()
    expect(band.textContent).toContain('Scenario')
    const vc = within(band).getByTestId('vs-scenario-vc-backed')
    const boot = within(band).getByTestId('vs-scenario-bootstrapped')
    // The tooltip documents the exact key → DECISIONS-option mapping (founder ask).
    expect(vc.getAttribute('title')).toContain('Raise a seed')
    expect(vc.getAttribute('title')).toContain('Delaware C-Corp')
    expect(vc.getAttribute('title')).toContain('Make the first hire')
    expect(boot.getAttribute('title')).toContain('Bootstrap')
    expect(boot.getAttribute('title')).toContain('Invoice-billed services')
    expect(boot.getAttribute('title')).toContain('Stay founders-only')
    // The company preset pills are unchanged otherwise.
    expect(within(band).getByTestId('vs-preset-software')).toBeTruthy()
  })

  it('VC backed asserts funding + entity + hire, leaves everything else Not set, and writes ?preset=vc-backed', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-scenario-vc-backed'))
    expect(window.location.search).toContain('preset=vc-backed')
    expect(screen.getByTestId('vs-scenario-vc-backed').getAttribute('aria-pressed')).toBe('true')
    expect(decisionTitle('funding')).toContain('Raise a seed')
    expect(decisionTitle('entity')).toContain('Delaware C-Corp')
    expect(decisionTitle('hire')).toContain('Make the first hire')
    // Partial assert: decisions outside the scenario stay Not set (they compose defaults).
    expect(decisionTitle('product')).toContain('not set')
    expect(decisionTitle('team')).toContain('not set')
    showAll()
    expect(termBody().getByText('Raise pre-seed (SAFEs)')).toBeTruthy()
    expect(termBody().getByText('Hire first employee')).toBeTruthy()
  })

  it('Bootstrapped asserts bootstrap + invoice-billed + founders-only: the journey drops the raise and the hire, bills by invoice', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-scenario-bootstrapped'))
    expect(window.location.search).toContain('preset=bootstrapped')
    expect(decisionTitle('funding')).toContain('Bootstrap')
    expect(decisionTitle('product')).toContain('Invoice-billed services')
    expect(decisionTitle('hire')).toContain('Stay founders-only')
    showAll()
    expect(screen.queryByText('Raise pre-seed (SAFEs)')).toBeNull()
    expect(screen.queryByText('Hire first employee')).toBeNull()
    expect(termBody().getByText('Send an invoice')).toBeTruthy()
    expect(screen.queryByText('Set up subscription billing')).toBeNull()
  })

  it('?preset=vc-backed round-trips: read on mount, pill pressed, the partial combo asserted', () => {
    window.history.replaceState(null, '', '/?preset=vc-backed')
    renderIt()
    expect(screen.getByTestId('vs-scenario-vc-backed').getAttribute('aria-pressed')).toBe('true')
    expect(decisionTitle('funding')).toContain('Raise a seed')
    expect(decisionTitle('entity')).toContain('Delaware C-Corp')
    expect(decisionTitle('product')).toContain('not set')
    // The shared param namespace: no company preset lights up.
    for (const id of ['software', 'hardware', 'biotech']) {
      expect(screen.getByTestId(`vs-preset-${id}`).getAttribute('aria-pressed')).toBe('false')
    }
  })

  it('a scenario composes OVER a company preset (pill swaps, other assertions survive); a manual change clears the scenario', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-preset-hardware'))
    fireEvent.click(screen.getByTestId('vs-scenario-bootstrapped'))
    expect(window.location.search).toContain('preset=bootstrapped')
    expect(screen.getByTestId('vs-preset-hardware').getAttribute('aria-pressed')).toBe('false')
    // Scenario keys override; the hardware combo's other keys stay asserted.
    expect(decisionTitle('funding')).toContain('Bootstrap')
    expect(decisionTitle('ordering')).toContain('Build first')
    // A manual decision change deselects the scenario and clears ?preset (the pickChoice rule).
    pickDecision('team', 'Solo founder')
    expect(window.location.search).not.toContain('preset')
    expect(screen.getByTestId('vs-scenario-bootstrapped').getAttribute('aria-pressed')).toBe('false')
    expect(decisionTitle('funding')).toContain('Bootstrap')
  })

  it('YC interplay: Bootstrapped contradicts the calibration and turns YC off; VC backed keeps it; YC-on over Bootstrapped deselects the pill', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    expect(window.location.search).toContain('yc=1')
    fireEvent.click(screen.getByTestId('vs-scenario-vc-backed'))
    expect(screen.getByTestId('vs-yc-toggle').getAttribute('aria-pressed')).toBe('true')
    expect(window.location.search).toContain('yc=1')
    fireEvent.click(screen.getByTestId('vs-scenario-bootstrapped'))
    expect(screen.getByTestId('vs-yc-toggle').getAttribute('aria-pressed')).toBe('false')
    expect(window.location.search).not.toContain('yc=1')
    expect(decisionTitle('funding')).toContain('Bootstrap')
    // Turning YC back on over Bootstrapped: the calibration wins, the scenario pill deselects.
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    expect(screen.getByTestId('vs-scenario-bootstrapped').getAttribute('aria-pressed')).toBe('false')
    expect(window.location.search).not.toContain('preset')
    expect(decisionTitle('funding')).toContain('Raise a seed')
  })
})

// The controller tabs (founder round 3, item 3): Setup | Vendors on the setup band. WAI-ARIA
// tab semantics, default Setup, the chosen tab never persisted in the URL; the embedded dry-run
// transcript (the old 'Simulate this playbook' section) is gone from this page entirely.
describe('VirtualStartup — the controller tabs (Setup | Vendors)', () => {
  it('accessible tabs: role=tablist, two tabs, Setup selected by default, panels wired via aria-controls', () => {
    renderIt()
    const band = screen.getByTestId('vs-setup')
    const tablist = within(band).getByRole('tablist', { name: 'Virtual startup controller' })
    const tabs = within(tablist).getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    const [setup, vendors] = tabs
    expect(setup.textContent).toContain('Setup')
    expect(vendors.textContent).toContain('Vendors')
    expect(setup.getAttribute('aria-selected')).toBe('true')
    expect(vendors.getAttribute('aria-selected')).toBe('false')
    expect(setup.getAttribute('aria-controls')).toBe('vs-tabpanel-setup')
    expect(vendors.getAttribute('aria-controls')).toBe('vs-tabpanel-vendors')
    // Roving tabIndex: only the selected tab is in the Tab order.
    expect(setup.getAttribute('tabindex')).toBe('0')
    expect(vendors.getAttribute('tabindex')).toBe('-1')
    // Setup content shows; the vendors panel exists but is hidden.
    expect(within(band).getByTestId('vs-decision-entity')).toBeTruthy()
    expect((document.getElementById('vs-tabpanel-setup') as HTMLElement).hidden).toBe(false)
    expect((document.getElementById('vs-tabpanel-vendors') as HTMLElement).hidden).toBe(true)
  })

  it('switching to Vendors swaps the panels, arrow keys move between tabs, and the chosen tab never touches the URL', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-tab-vendors'))
    expect(screen.getByTestId('vs-tab-vendors').getAttribute('aria-selected')).toBe('true')
    expect((document.getElementById('vs-tabpanel-setup') as HTMLElement).hidden).toBe(true)
    expect((document.getElementById('vs-tabpanel-vendors') as HTMLElement).hidden).toBe(false)
    // This fixture passes roles=[] — the panel says so honestly instead of an empty grid.
    expect(screen.getByTestId('vs-vendors-empty')).toBeTruthy()
    expect(window.location.search).toBe('')
    // Arrow keys (roving tabIndex): ArrowLeft returns to Setup.
    fireEvent.keyDown(screen.getByTestId('vs-tab-vendors'), { key: 'ArrowLeft' })
    expect(screen.getByTestId('vs-tab-setup').getAttribute('aria-selected')).toBe('true')
    expect(screen.getByTestId('vs-tab-setup').getAttribute('tabindex')).toBe('0')
    expect(screen.getByTestId('vs-tab-vendors').getAttribute('tabindex')).toBe('-1')
    expect(window.location.search).toBe('')
  })

  it("the embedded dry-run transcript is gone: no 'Simulate this playbook' section, no second run surface", () => {
    renderIt()
    expect(screen.queryByText(/simulate this playbook/i)).toBeNull()
    expect(screen.queryByText(/synthetic dry run from the mapped process/i)).toBeNull()
    // Exactly one run control on the page: the band's Run CTA.
    expect(screen.getAllByRole('button', { name: /run this startup/i })).toHaveLength(1)
  })
})

// jsdom does no real layout or scrolling, so the follow logic is tested against a fake scroll
// box: fixed scrollHeight/clientHeight, and a scrollTop that stores assignments (jsdom's own
// scrollTop setter is a no-op, which would make every pin-to-bottom invisible).
function mockScrollBox(el: HTMLElement, { scrollHeight, clientHeight }: { scrollHeight: number; clientHeight: number }) {
  let top = 0
  Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => scrollHeight })
  Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => clientHeight })
  Object.defineProperty(el, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: (v: number) => { top = v },
  })
}

describe('VirtualStartup — the terminal viewport (founder 2026-09-28: the run prints up top, inside the terminal)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the terminal chrome bare before any run: no chip, no idle label, no placeholder copy', () => {
    // Founder 2026-09-29 declutter: pre-run the terminal shows only the prompt cursor; the
    // status strip speaks only while running or complete.
    renderIt()
    const term = screen.getByTestId('vs-terminal')
    expect(within(term).queryByText(/^simulated$/i)).toBeNull()
    expect(within(term).queryByText(/press ▶ Run this startup/)).toBeNull()
    expect(within(term).queryAllByTestId('vs-artifact')).toHaveLength(0)
    expect(screen.getByTestId('vs-terminal-status').textContent).toBe('')
  })

  it('the run prints INSIDE the terminal body; the page below it does not grow until completion', () => {
    vi.useFakeTimers()
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
    act(() => { vi.advanceTimersByTime(240 * 4) })
    const body = screen.getByTestId('vs-terminal-body')
    // Mid-run: revealed content lives inside the terminal…
    expect(within(body).getByText('Name & brand')).toBeTruthy()
    expect(screen.getByTestId('vs-terminal-status').textContent).toMatch(/running/)
    // …and NOTHING has appeared below it: no rhythm section, no completion summary.
    expect(screen.queryByText('The operating rhythm')).toBeNull()
    expect(screen.queryByText(/journey complete/)).toBeNull()
    // Run to completion: the summary prints as final terminal output, the rhythm opens below.
    act(() => { vi.advanceTimersByTime(240 * 500) })
    expect(within(body).getByText(/journey complete/)).toBeTruthy()
    // No completion label in the title bar (founder addendum 2026-09-29) — status goes quiet.
    expect(screen.getByTestId('vs-terminal-status').textContent).toBe('')
    expect(screen.getByText('The operating rhythm')).toBeTruthy()
    // EVERY revealed artifact node sits inside the terminal body — none printed down the page.
    const artifacts = screen.getAllByTestId('vs-artifact')
    expect(artifacts.length).toBeGreaterThan(0)
    for (const node of artifacts) expect(body.contains(node)).toBe(true)
  })

  it('terminal-follow: pins to the newest line, pauses when the reader scrolls up, resumes at the bottom', () => {
    vi.useFakeTimers()
    renderIt()
    const body = screen.getByTestId('vs-terminal-body')
    mockScrollBox(body, { scrollHeight: 1000, clientHeight: 400 })
    fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
    act(() => { vi.advanceTimersByTime(240) })
    expect(body.scrollTop).toBe(1000) // pinned to the bottom on each printed line
    // The reader scrolls up mid-run → follow pauses; new lines must not yank them back down.
    body.scrollTop = 100
    fireEvent.scroll(body)
    act(() => { vi.advanceTimersByTime(240) })
    expect(body.scrollTop).toBe(100)
    // Back within the slack of the bottom → follow re-engages on the next printed line.
    body.scrollTop = 590 // 590 + 400 ≥ 1000 − 24
    fireEvent.scroll(body)
    act(() => { vi.advanceTimersByTime(240) })
    expect(body.scrollTop).toBe(1000)
  })

  it('a full run fills the terminal (following the tail); restart clears it back to the prompt', () => {
    // The skip-animation link is gone (founder 2026-09-28) — the full timeline arrives by
    // letting the run's reveal interval play out under fake timers.
    vi.useFakeTimers()
    renderIt()
    const body = screen.getByTestId('vs-terminal-body')
    mockScrollBox(body, { scrollHeight: 1000, clientHeight: 400 })
    fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
    act(() => { vi.advanceTimersByTime(240 * 3) })
    expect(body.scrollTop).toBe(1000) // mid-run, following
    act(() => { vi.runAllTimers() })
    expect(within(body).getAllByTestId('vs-artifact').length).toBeGreaterThan(0)
    expect(within(body).getByText(/journey complete/)).toBeTruthy()
    expect(body.scrollTop).toBe(1000) // completed run stays followed to the tail
    // Restart: the terminal clears back to the placeholder prompt, scrolled to the top.
    fireEvent.click(screen.getByRole('button', { name: /run it again/i }))
    expect(within(body).queryAllByTestId('vs-artifact')).toHaveLength(0)
    expect(within(body).queryByText(/press ▶ Run this startup/)).toBeNull()
    expect(body.scrollTop).toBe(0)
  })
})

describe('VirtualStartup — YC batch mode', () => {
  it('toggling YC mode calibrates the combo, shows the non-affiliation disclosure, and writes ?yc=1', () => {
    renderIt()
    expect(screen.queryByTestId('vs-yc-disclosure')).toBeNull()
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    expect(window.location.search).toContain('yc=1')
    const disclosure = screen.getByTestId('vs-yc-disclosure')
    expect(disclosure.textContent).toContain('not affiliated with or endorsed by Y Combinator')
    // Launch-early calibration: PH on, build-first, seed raise — asserted in the dropdowns.
    expect(decisionTitle('ph')).toContain('Product Hunt')
    expect(decisionTitle('ordering')).toContain('Build first')
    expect(decisionTitle('funding')).toContain('Raise a seed')
  })

  it('the YC pill wears the house YC mark and keeps the accessible name', () => {
    renderIt()
    const toggle = screen.getByRole('button', { name: 'YC batch mode' })
    expect(toggle).toBe(screen.getByTestId('vs-yc-toggle'))
    const mark = within(toggle).getByTestId('vs-yc-mark')
    expect(mark.getAttribute('aria-hidden')).toBe('true')
    expect(mark.className).toContain('bg-[#f26522]') // the YC orange square
  })

  it('the synthetic SAFE artifact carries the standard published YC deal; the raise sits at Demo-Day timing', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    showAll()
    // Scoped to the terminal body — the state-graph panel (2026-09-29) mirrors the artifact
    // (with its own data-synthetic attribute, covered by its suite).
    const deal = within(screen.getByTestId('vs-terminal-body')).getByText(/\$125,000 for 7% \+ \$375,000/)
    const artifact = deal.closest('[data-testid="vs-artifact"]')!
    expect((artifact as HTMLElement).getAttribute('data-synthetic')).toBe('true')
    // Demo-Day timing: the raise phase renders after launch day in document order.
    const raise = termBody().getByText('Raise the seed')
    const launch = termBody().getByText('Launch day')
    expect(launch.compareDocumentPosition(raise) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Named once in the mode disclosure and once on the relocated phase itself.
    expect(screen.getAllByText(/compresses to Demo-Day timing/)).toHaveLength(2)
  })

  it('adds the synthetic weekly group-partner update to the rhythm views — data-synthetic, unlinked', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    showAll()
    // 30-day window: 4 weekly office-hours runs from day 7.
    const winRow = screen.getByTestId('vs-yc-oh-window-row')
    expect(winRow.getAttribute('data-synthetic')).toBe('true')
    expect(within(winRow).getByText('day 7')).toBeTruthy()
    expect(within(winRow).getByText('×4')).toBeTruthy()
    expect(within(winRow).queryByRole('link')).toBeNull()
    // Year view: 12 batch runs, months 1–3, still simulated and unlinked.
    showYearTab()
    const yearRow = screen.getByTestId('vs-yc-oh-row')
    expect(within(yearRow).getByText('Weekly update to your group partner')).toBeTruthy()
    expect(yearRow.getAttribute('data-synthetic')).toBe('true')
    expect(within(yearRow).getByText('×12')).toBeTruthy()
    expect(within(yearRow).queryByRole('link')).toBeNull()
    expect(within(yearRow).getByText(/not a corpus process/)).toBeTruthy()
  })

  it('YC mode applies on top of a preset and keeps ?preset', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-preset-hardware'))
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    expect(window.location.search).toContain('preset=hardware')
    expect(window.location.search).toContain('yc=1')
    // Calibration overrides the preset where they disagree (hardware has PH off).
    expect(decisionTitle('ph')).toContain('Product Hunt')
    // Turning YC off restores the preset's own combo.
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    expect(decisionTitle('ph')).toContain('Stealth mode')
    expect(window.location.search).not.toContain('yc=1')
  })

  it('?yc=1 is read on mount only; a manual pick contradicting the calibration exits YC mode', () => {
    window.history.replaceState(null, '', '/?yc=1')
    renderIt()
    expect(screen.getByTestId('vs-yc-disclosure')).toBeTruthy()
    expect(decisionTitle('ordering')).toContain('Build first')
    // Contradicting the calibration (quiet launch) turns the mode off and clears ?yc.
    pickDecision('ph', 'Stealth mode')
    expect(screen.queryByTestId('vs-yc-disclosure')).toBeNull()
    expect(window.location.search).not.toContain('yc=1')
    // A non-calibration pick keeps the mode on.
    window.history.replaceState(null, '', '/')
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    pickDecision('team', 'Solo founder')
    expect(screen.getByTestId('vs-yc-disclosure')).toBeTruthy()
    expect(window.location.search).toContain('yc=1')
  })
})
