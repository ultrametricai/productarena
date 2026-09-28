// @vitest-environment jsdom
// VirtualStartup — the synthetic-labeling invariant at the DOM level (every generated artifact
// node visibly carries the SIMULATED tag; the site's evidence-honesty brand depends on nothing
// synthetic being mistakable for a judged fact) plus the decision → rendered-journey wiring.
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
const showAll = () => fireEvent.click(screen.getByRole('button', { name: /show the whole timeline/i }))
const rhythmSection = () => screen.getByText('The operating rhythm').closest('section')!
const showYearTab = () => fireEvent.click(within(rhythmSection()).getByRole('button', { name: 'Year one' }))

// URL state is a real contract here (?preset / ?yc) — start every test from a clean URL.
beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('VirtualStartup — synthetic labeling invariant', () => {
  it('renders a visible simulated tag on EVERY generated artifact node', () => {
    renderIt()
    showAll()
    const artifacts = screen.getAllByTestId('vs-artifact')
    expect(artifacts.length).toBeGreaterThan(0)
    for (const node of artifacts) {
      expect(within(node).getByText(/^simulated$/i)).toBeTruthy()
    }
  })

  it('labels the virtual company itself as simulated before the timeline even runs', () => {
    renderIt()
    const banner = screen.getByText(/your virtual company/i).closest('div')!
    expect(within(banner).getByText(/^simulated$/i)).toBeTruthy()
  })
})

describe('VirtualStartup — decisions drive the rendered journey', () => {
  it('defaults to the C-Corp seed journey with judged top-vendor pills and day markers', () => {
    renderIt()
    showAll()
    expect(screen.getByText('Incorporate C-Corp')).toBeTruthy()
    expect(screen.queryByText('Set up an LLC')).toBeNull()
    expect(screen.getByText('Founder agreement & equity split')).toBeTruthy()
    expect(screen.getByText('Raise pre-seed (SAFEs)')).toBeTruthy()
    expect(screen.getByText('Set up subscription billing')).toBeTruthy()
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
    fireEvent.click(screen.getByRole('button', { name: 'LLC' }))
    // Choice change resets the timeline — nothing revealed until re-run.
    expect(screen.queryAllByTestId('vs-artifact')).toHaveLength(0)
    showAll()
    expect(screen.getByText('Set up an LLC')).toBeTruthy()
    expect(screen.queryByText('Incorporate C-Corp')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Bootstrap' }))
    fireEvent.click(screen.getByRole('button', { name: 'Solo founder' }))
    fireEvent.click(screen.getByRole('button', { name: 'Invoice-billed services' }))
    showAll()
    expect(screen.queryByText('Raise pre-seed (SAFEs)')).toBeNull()
    expect(screen.queryByText('Founder agreement & equity split')).toBeNull()
    expect(screen.getByText('Send an invoice')).toBeTruthy()
    expect(screen.queryByText('Set up subscription billing')).toBeNull()
  })

  it('the 2026-09-25 toggles: hire, enterprise, PH launch, build-first ordering all reshape the journey', () => {
    renderIt()
    showAll()
    // Defaults: hire yes (playbook in), enterprise no, PH yes, name-first.
    expect(screen.getByText('Hire first employee')).toBeTruthy()
    expect(screen.queryByText('Complete SOC 2 Type II')).toBeNull()
    expect(screen.getByText('Launch on Product Hunt & directories')).toBeTruthy()
    expect(screen.getByText('Set up a password manager')).toBeTruthy() // compliance chain always runs

    fireEvent.click(screen.getByRole('button', { name: 'Stay founders-only' }))
    fireEvent.click(screen.getByRole('button', { name: 'Chase the enterprise deal' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quiet launch' }))
    fireEvent.click(screen.getByRole('button', { name: 'Build first' }))
    showAll()
    expect(screen.queryByText('Hire first employee')).toBeNull()
    expect(screen.getAllByText('Complete SOC 2 Type II').length).toBeGreaterThan(0)
    expect(screen.queryByText('Launch on Product Hunt & directories')).toBeNull()
    // Build-first: the ship-v1 phase renders before name & brand in document order.
    const build = screen.getByText('Build & ship v1')
    const name = screen.getByText('Name & brand')
    expect(build.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
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
    fireEvent.click(screen.getByRole('button', { name: 'Bootstrap' }))
    showAll()
    showYearTab()
    expect(within(rhythmSection()).queryByText('Board meeting prep')).toBeNull()
  })

  it('labels seeded (non-corpus-dated) annual slots SIMULATED', () => {
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: 'Chase the enterprise deal' }))
    showAll()
    showYearTab()
    const seeded = screen.getAllByTestId('vs-year-row').filter((r) => r.getAttribute('data-month-source') === 'seeded')
    expect(seeded).toHaveLength(1)
    expect(within(seeded[0]).getByText('Complete SOC 2 Type II')).toBeTruthy()
    expect(within(seeded[0]).getByText(/^simulated$/i)).toBeTruthy()
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
    expect(section.getByText(/Annual processes carry no day here/)).toBeTruthy()
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
    fireEvent.click(screen.getByRole('button', { name: 'Chase the enterprise deal' }))
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
describe('VirtualStartup — the compact setup band', () => {
  it('one band holds presets, YC mode, persona, all nine decisions, and the run CTA — and renders before the terminal', () => {
    renderIt()
    const band = screen.getByTestId('vs-setup')
    expect(within(band).getByTestId('vs-preset-software')).toBeTruthy()
    expect(within(band).getByTestId('vs-yc-toggle')).toBeTruthy()
    expect(within(band).getByTestId('vs-persona-picker')).toBeTruthy()
    expect(within(band).getByRole('button', { name: /run this startup/i })).toBeTruthy()
    expect(within(band).getByRole('button', { name: /show the whole timeline/i })).toBeTruthy()
    // Every decision option keeps its canonical full label as the accessible name.
    for (const name of [
      'Delaware C-Corp', 'LLC', 'Cofounders', 'Solo founder', 'Raise a seed', 'Bootstrap',
      'SaaS subscriptions', 'Invoice-billed services', 'Name first', 'Build first',
      'Make the first hire', 'Stay founders-only', 'Compliance early', 'Compliance later',
      'Not yet', 'Chase the enterprise deal', 'Launch on Product Hunt', 'Quiet launch',
    ]) {
      expect(within(band).getByRole('button', { name })).toBeTruthy()
    }
    // The band precedes the terminal in document order — the terminal sits right under it.
    const term = screen.getByTestId('vs-terminal')
    expect(band.compareDocumentPosition(term) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('decision options show short labels but keep the full label + corpus mapping in the tooltip', () => {
    renderIt()
    const btn = screen.getByRole('button', { name: 'Chase the enterprise deal' })
    expect(btn.textContent).toBe('Yes')
    expect(btn.getAttribute('title')).toContain('Chase the enterprise deal')
    expect(btn.getAttribute('title')).toContain('land-the-enterprise-deal')
  })

  it('the full setup guide expand carries the verbose explanations, disclosures verbatim included', () => {
    renderIt()
    const details = screen.getByText(/full setup guide/i).closest('details')!
    const guide = within(details as HTMLElement)
    expect(guide.getByText(/hardware-specific steps \(regulatory, manufacturing\)/)).toBeTruthy()
    expect(guide.getByText(/biotech-specific steps \(regulatory, trials, manufacturing\)/)).toBeTruthy()
    expect(guide.getByText(/never changes a judged verdict/)).toBeTruthy()
    expect(guide.getByText(/nothing is invented/)).toBeTruthy()
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
    // Every preset identity is SIMULATED-chipped on the card itself.
    for (const id of ['software', 'hardware', 'biotech']) {
      expect(within(screen.getByTestId(`vs-preset-${id}`)).getByText(/^simulated$/i)).toBeTruthy()
    }
  })

  it('one tap applies the full combo + themed identity and writes ?preset=', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-preset-hardware'))
    expect(window.location.search).toContain('preset=hardware')
    // Identity overrides the seeded name; the banner stays SIMULATED-chipped.
    const banner = screen.getByText(/your virtual company/i).closest('div')!
    expect(within(banner).getByText('Holofield, Inc.')).toBeTruthy()
    expect(within(banner).getByText(/^simulated$/i)).toBeTruthy()
    // The hardware combo: build-first, invoice-billed, no PH launch, enterprise on.
    showAll()
    expect(screen.getByText('Send an invoice')).toBeTruthy()
    expect(screen.queryByText('Set up subscription billing')).toBeNull()
    expect(screen.queryByText('Launch on Product Hunt & directories')).toBeNull()
    expect(screen.getAllByText('Complete SOC 2 Type II').length).toBeGreaterThan(0)
    const build = screen.getByText('Build & ship v1')
    const name = screen.getByText('Name & brand')
    expect(build.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('identity is deterministic across re-renders', () => {
    const { rerender, container } = renderIt()
    fireEvent.click(screen.getByTestId('vs-preset-biotech'))
    expect(screen.getByText('Demovax, Inc.')).toBeTruthy()
    rerender(
      <VirtualStartup chains={CHAINS} tasks={TASKS} roles={[]} yearCandidates={YEAR_CANDIDATES} eventExamples={EVENT_EXAMPLES} access={{}} pricing={{}} taskRisks={{}} />,
    )
    expect(within(container).getByText('Demovax, Inc.')).toBeTruthy()
  })

  it('?preset= is read on mount only and applies combo + identity', () => {
    window.history.replaceState(null, '', '/?preset=biotech')
    renderIt()
    expect(screen.getByText('Demovax, Inc.')).toBeTruthy()
    expect(screen.getByTestId('vs-preset-biotech').getAttribute('aria-pressed')).toBe('true')
    // Biotech runs compliance EARLY.
    expect(screen.getByRole('button', { name: 'Compliance early' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Invoice-billed services' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('a pristine view never writes ?preset; junk preset values are ignored', () => {
    window.history.replaceState(null, '', '/?preset=nonsense')
    renderIt()
    expect(screen.getByTestId('vs-preset-software').getAttribute('aria-pressed')).toBe('false')
    expect(screen.queryByText('Agentloop, Inc.')).toBeNull()
  })

  it('manually changing any toggle clears ?preset (and the identity) but keeps the combo', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-preset-hardware'))
    expect(window.location.search).toContain('preset=hardware')
    fireEvent.click(screen.getByRole('button', { name: 'Solo founder' }))
    expect(window.location.search).not.toContain('preset')
    expect(screen.getByTestId('vs-preset-hardware').getAttribute('aria-pressed')).toBe('false')
    // Identity reverts to the combo-seeded name (the preset CARD still shows its own name)…
    const banner = screen.getByText(/your virtual company/i).closest('div')!
    expect(within(banner).queryByText(/Holofield/)).toBeNull()
    // …but the rest of the preset combo survives the manual change.
    expect(screen.getByRole('button', { name: 'Invoice-billed services' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Build first' }).getAttribute('aria-pressed')).toBe('true')
    showAll()
    expect(screen.queryByText('Founder agreement & equity split')).toBeNull()
    expect(screen.getByText('Send an invoice')).toBeTruthy()
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

  it('renders the terminal chrome idle before any run: SIMULATED title bar, placeholder prompt, no rows', () => {
    renderIt()
    const term = screen.getByTestId('vs-terminal')
    // The title bar carries the run identity, its own SIMULATED chip, and the idle status.
    expect(within(term).getByText(/^simulated$/i)).toBeTruthy()
    expect(within(term).getByText(/press ▶ Run this startup/)).toBeTruthy()
    expect(within(term).queryAllByTestId('vs-artifact')).toHaveLength(0)
    expect(screen.getByTestId('vs-terminal-status').textContent).toBe('idle')
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
    expect(screen.getByTestId('vs-terminal-status').textContent).toMatch(/complete/)
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

  it('"show the whole timeline" fills the terminal instantly scrolled to the TOP; restart clears it', () => {
    vi.useFakeTimers()
    renderIt()
    const body = screen.getByTestId('vs-terminal-body')
    mockScrollBox(body, { scrollHeight: 1000, clientHeight: 400 })
    fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
    act(() => { vi.advanceTimersByTime(240 * 3) })
    expect(body.scrollTop).toBe(1000) // mid-run, following
    showAll()
    expect(within(body).getAllByTestId('vs-artifact').length).toBeGreaterThan(0)
    expect(within(body).getByText(/journey complete/)).toBeTruthy()
    expect(body.scrollTop).toBe(0) // instant fill reads from the top, not the bottom
    // Restart: the terminal clears back to the placeholder prompt, scrolled to the top.
    fireEvent.click(screen.getByRole('button', { name: /run it again/i }))
    expect(within(body).queryAllByTestId('vs-artifact')).toHaveLength(0)
    expect(within(body).getByText(/press ▶ Run this startup/)).toBeTruthy()
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
    expect(within(disclosure).getByText(/^simulated$/i)).toBeTruthy()
    // Launch-early calibration: PH on, build-first, seed raise.
    expect(screen.getByRole('button', { name: 'Launch on Product Hunt' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Build first' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Raise a seed' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('the SIMULATED SAFE artifact carries the standard published YC deal; the raise sits at Demo-Day timing', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    showAll()
    const deal = screen.getByText(/\$125,000 for 7% \+ \$375,000/)
    const artifact = deal.closest('[data-testid="vs-artifact"]')!
    expect(within(artifact as HTMLElement).getByText(/^simulated$/i)).toBeTruthy()
    // Demo-Day timing: the raise phase renders after launch day in document order.
    const raise = screen.getByText('Raise the seed')
    const launch = screen.getByText('Launch day')
    expect(launch.compareDocumentPosition(raise) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Named once in the mode disclosure and once on the relocated phase itself.
    expect(screen.getAllByText(/compresses to Demo-Day timing/)).toHaveLength(2)
  })

  it('adds the synthetic weekly group-partner update to the rhythm views — SIMULATED, unlinked', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    showAll()
    // 30-day window: 4 weekly office-hours runs from day 7.
    const winRow = screen.getByTestId('vs-yc-oh-window-row')
    expect(within(winRow).getByText(/^simulated$/i)).toBeTruthy()
    expect(within(winRow).getByText('day 7')).toBeTruthy()
    expect(within(winRow).getByText('×4')).toBeTruthy()
    expect(within(winRow).queryByRole('link')).toBeNull()
    // Year view: 12 batch runs, months 1–3, still simulated and unlinked.
    showYearTab()
    const yearRow = screen.getByTestId('vs-yc-oh-row')
    expect(within(yearRow).getByText('Weekly update to your group partner')).toBeTruthy()
    expect(within(yearRow).getByText(/^simulated$/i)).toBeTruthy()
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
    expect(screen.getByText('Holofield, Inc.')).toBeTruthy()
    // Calibration overrides the preset where they disagree (hardware has PH off).
    expect(screen.getByRole('button', { name: 'Launch on Product Hunt' }).getAttribute('aria-pressed')).toBe('true')
    // Turning YC off restores the preset's own combo.
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    expect(screen.getByRole('button', { name: 'Quiet launch' }).getAttribute('aria-pressed')).toBe('true')
    expect(window.location.search).not.toContain('yc=1')
  })

  it('?yc=1 is read on mount only; a manual toggle contradicting the calibration exits YC mode', () => {
    window.history.replaceState(null, '', '/?yc=1')
    renderIt()
    expect(screen.getByTestId('vs-yc-disclosure')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Build first' }).getAttribute('aria-pressed')).toBe('true')
    // Contradicting the calibration (quiet launch) turns the mode off and clears ?yc.
    fireEvent.click(screen.getByRole('button', { name: 'Quiet launch' }))
    expect(screen.queryByTestId('vs-yc-disclosure')).toBeNull()
    expect(window.location.search).not.toContain('yc=1')
    // A non-calibration toggle keeps the mode on.
    window.history.replaceState(null, '', '/')
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    fireEvent.click(screen.getByRole('button', { name: 'Solo founder' }))
    expect(screen.getByTestId('vs-yc-disclosure')).toBeTruthy()
    expect(window.location.search).toContain('yc=1')
  })
})
