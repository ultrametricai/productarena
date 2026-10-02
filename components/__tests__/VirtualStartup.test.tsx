// @vitest-environment jsdom
// VirtualStartup — the synthetic-labeling invariant at the DOM level, plus the decision →
// rendered-journey wiring. The invariant is STRUCTURAL since 2026-09-29: the founder removed the
// visible 'simulated' labels from the whole interface, so every generated artifact node carries
// data-synthetic="true" (asserted per node here) and keeps the distinct fuchsia styling — the
// honesty contract moved from a visible chip to a machine-checkable attribute, and NO visible
// 'simulated' string may render anywhere on /startup-sim (also asserted here).
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
    task('brand_001', 'Generate a company name', {
      // The naming step is an AI-conversation step: its judged top ranks in ai-assistants —
      // the 'I'm using' pin surface (item 7, 2026-09-30).
      tops: [{ productId: 'chatgpt', name: 'ChatGPT', score: 77, arenaId: 'ai-assistants', arenaName: 'AI assistants' }],
    }),
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
    task('ops_014', 'Lease an office'),
    // The Apply-to-YC checkbox's composed process (item 6, 2026-10-01).
    task('fund_007', 'Apply to Y Combinator'),
  ].map((t) => [t.id, t]),
)

const ASSISTANTS = [
  { id: 'chatgpt', name: 'ChatGPT', hasLogo: false },
  { id: 'claude', name: 'Claude', hasLogo: false },
  { id: 'gemini', name: 'Gemini', hasLogo: false },
  { id: 'grok', name: 'Grok', hasLogo: false },
  { id: 'muse', name: 'Muse', hasLogo: false },
]

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
      assistants={ASSISTANTS}
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
// The trigger's tooltip is GONE (founder batch 2026-09-30, item 3) — the asserted option's full
// label (or 'not set') now rides the trigger's aria-label.
const decisionTitle = (id: string) => screen.getByTestId(`vs-decision-${id}`).getAttribute('aria-label') ?? ''
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

  it('the 2026-09-25 toggles: hire, enterprise, PH launch all reshape the journey (build-first now rides presets/permalinks only — round 5, item 4)', () => {
    renderIt()
    showAll()
    // Defaults (round 7, 2026-10-01): hire yes (playbook in), Developers ICP (no enterprise
    // chain), X launch (the same launch chain, venue-noted), name-first — and compliance
    // default-asserted at SOC 2 early, so the compliance chain RUNS.
    expect(termBody().getByText('Hire first employee')).toBeTruthy()
    expect(screen.queryByText('Complete SOC 2 Type II')).toBeNull()
    expect(termBody().getByText('Launch on Product Hunt & directories')).toBeTruthy()
    expect(termBody().getByText('Set up a password manager')).toBeTruthy() // SOC 2 early — the default-asserted posture

    pickDecision('hire', 'Stay founders-only')
    pickDecision('enterprise', 'Enterprises')
    pickDecision('ph', 'Stealth mode')
    showAll()
    expect(screen.queryByText('Hire first employee')).toBeNull()
    expect(screen.getAllByText('Complete SOC 2 Type II').length).toBeGreaterThan(0)
    expect(screen.queryByText('Launch on Product Hunt & directories')).toBeNull()
    // Ordering keeps its default composition: name & brand leads, ship-v1 follows.
    const build = termBody().getByText('Build & ship v1')
    const name = termBody().getByText('Name & brand')
    expect(name.compareDocumentPosition(build) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('round 5 business models: Usage-based runs the SAME growth_001 steps (venue-noted); Marketplace/E-commerce run the spine with neither billing fork', () => {
    renderIt()
    pickDecision('product', 'Usage-based')
    showAll()
    expect(termBody().getByText('Set up subscription billing')).toBeTruthy()
    expect(screen.queryByText('Send an invoice')).toBeNull()
    expect(termBody().getByText(/usage-based — the same subscription-billing playbook/)).toBeTruthy()
    const sub = screen.getAllByTestId('vs-artifact').find((a) => /First subscription/.test(a.textContent ?? ''))!
    expect(sub.textContent).toContain('metered usage')

    pickDecision('product', 'Marketplace (take-rate)')
    showAll()
    expect(screen.queryByText('Set up subscription billing')).toBeNull()
    expect(screen.queryByText('Send an invoice')).toBeNull()
    expect(termBody().getByText('Connect a payment processor')).toBeTruthy()
    expect(termBody().getByText(/marketplace \(take-rate\)/)).toBeTruthy()
    expect(termBody().getByText(/no take-rate billing steps/)).toBeTruthy()

    pickDecision('product', 'E-commerce (DTC)')
    showAll()
    expect(screen.queryByText('Set up subscription billing')).toBeNull()
    expect(termBody().getByText(/no storefront step yet/)).toBeTruthy()
  })

  it("compliance options: the round-7 default-asserted 'SOC 2 (early)' runs the chain; 'Basic minimums' honestly skips it and 'None' stays display-hidden", () => {
    renderIt()
    // The round-7 default (2026-10-01, item 5): compliance default-asserted at SOC 2 early.
    expect(decisionTitle('compliance')).toContain('SOC 2 (early)')
    showAll()
    expect(termBody().getByText('Set up a password manager')).toBeTruthy()
    expect(termBody().getByText('Stand up compliance')).toBeTruthy()
    // 'Basic minimums' (round 6) keeps its roster row and still skips the chain honestly.
    pickDecision('compliance', 'Basic minimums')
    showAll()
    expect(screen.queryByText('Set up a password manager')).toBeNull()
    expect(termBody().queryByText('Stand up compliance')).toBeNull()
    // 'None' left the display roster — redundant with the honestly-named Basic minimums.
    fireEvent.click(screen.getByTestId('vs-decision-compliance'))
    expect(screen.queryByRole('option', { name: 'None' })).toBeNull()
    expect(screen.getByRole('option', { name: 'Basic minimums' })).toBeTruthy()
    fireEvent.click(screen.getByTestId('vs-decision-compliance')) // close

    pickDecision('compliance', 'HIPAA')
    showAll()
    expect(termBody().getByText('Set up a password manager')).toBeTruthy()
    expect(termBody().getByText(/HIPAA — the same set-up-compliance corpus playbook/)).toBeTruthy()
    // Early placement: compliance renders before the website launch phase.
    const compliance = termBody().getByText('Stand up compliance')
    const website = termBody().getByText('Launch the website')
    expect(compliance.compareDocumentPosition(website) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
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
    pickDecision('enterprise', 'Enterprises')
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
    pickDecision('enterprise', 'Enterprises')
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
  it('one band holds presets, YC mode, founder axes, the nine visible decision dropdowns, drive mode, and the run CTA — and renders before the terminal', () => {
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
    // Every VISIBLE decision renders as a listbox dropdown starting at 'Not set' — EXCEPT the
    // DEFAULT-ASSERTED entity (founder round 4, item 5), which starts asserted at
    // 'Delaware C-Corp'; opening a dropdown exposes the canonical full labels as option
    // accessible names, plus the explicit Not-set row. The Entity roster shows the geo-selected
    // country's options only (US default here — round 5, item 1); 'Start with' is gone from the
    // panel entirely (round 5, item 4).
    const optionNames: Record<string, string[]> = {
      entity: ['Delaware C-Corp', 'LLC'],
      team: ['Cofounders', 'Solo founder'],
      // The single Funding selector (addendum 2026-09-30): decision options + scenario combos.
      funding: ['Raise a seed', 'Bootstrap', 'VC backed', 'Bootstrapped'],
      // Business models (round 5, item 2): the three new models appended after the originals.
      product: ['SaaS subscriptions', 'Invoice-billed services', 'Marketplace (take-rate)', 'Usage-based', 'E-commerce (DTC)'],
      hire: ['Make the first hire', 'Stay founders-only'],
      // Compliance gets specific (round 5, item 3); 'Basic minimums' appended (item 8,
      // 2026-09-30) and 'None' display-hidden — redundant with the honest name.
      compliance: ['SOC 2 (early)', 'SOC 2 (deferred)', 'HIPAA', 'ISO 27001', 'Basic minimums'],
      // The ICP selector (item 4, 2026-09-30) replaced the enterprise yes/no.
      enterprise: ['Developers', 'Enterprises', 'SMBs', 'Consumers'],
      // Launch options (founder round 4, item 7): venue-flavored public launches + stealth;
      // 'X launch' appended 2026-10-01 (item 5) as the new default-asserted venue.
      ph: ['Product Hunt', 'Stealth mode', 'Show HN', 'Waitlist launch', 'X launch'],
      // Remote vs In-office (item 5, 2026-09-30).
      remote: ['Remote-first', 'Office'],
    }
    // 'Start with' left the control panel — no dropdown, no micro-label (round 5, item 4).
    expect(within(band).queryByTestId('vs-decision-ordering')).toBeNull()
    // …and the non-US entity options stay OFF the US roster (they follow the geo pick).
    fireEvent.click(within(band).getByTestId('vs-decision-entity'))
    expect(screen.queryByRole('option', { name: 'Ltd (Companies House)' })).toBeNull()
    expect(screen.queryByRole('option', { name: 'GmbH' })).toBeNull()
    fireEvent.click(within(band).getByTestId('vs-decision-entity')) // close
    // The round-7 DEFAULT-ASSERTED set (2026-10-01, item 5): the founder's demo composition —
    // these dropdowns show their value from the first render; everything else starts 'Not set'.
    const defaultAsserted: Record<string, string> = {
      entity: 'C-Corp',
      team: 'Cofounders',
      funding: 'Seed',
      compliance: 'SOC 2',
      ph: 'X',
      remote: 'Office',
    }
    for (const [id, names] of Object.entries(optionNames)) {
      const trigger = within(band).getByTestId(`vs-decision-${id}`)
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
      const asserted = defaultAsserted[id]
      if (asserted !== undefined) expect(trigger.textContent).toContain(asserted)
      else expect(trigger.textContent).toContain('Not set')
      fireEvent.click(trigger)
      for (const name of names) expect(screen.getByRole('option', { name })).toBeTruthy()
      // The hidden 'None' never renders as an option (HIDDEN_OPTION_VALUES).
      if (id === 'compliance') expect(screen.queryByRole('option', { name: 'None' })).toBeNull()
      expect(screen.getByTestId(`vs-decision-${id}-notset`).getAttribute('aria-selected')).toBe(
        asserted !== undefined ? 'false' : 'true',
      )
      fireEvent.click(trigger) // close before the next one
    }
    // The band precedes the terminal in document order — the terminal sits right under it.
    const term = screen.getByTestId('vs-terminal')
    expect(band.compareDocumentPosition(term) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("visible group labels: Business model stays; 'Start with' is GONE from the panel (round 5, item 4) while composition keeps the default", () => {
    renderIt()
    const band = screen.getByTestId('vs-setup')
    // Visible micro-labels (non-interactive, colon-suffixed).
    expect(within(band).getByText('Business model:')).toBeTruthy()
    expect(within(band).queryByText('Start with:')).toBeNull()
    expect(within(band).queryByText('Order:')).toBeNull()
    expect(within(band).queryByText('Model:')).toBeNull()
    // The removed decision leaves no group behind; Business model keeps its canonical name.
    expect(within(band).queryByRole('group', { name: 'What comes first' })).toBeNull()
    expect(within(band).getByRole('group', { name: 'Business model' })).toBeTruthy()
    // Composition keeps the default branch: name & brand leads the run.
    showAll()
    const build = termBody().getByText('Build & ship v1')
    const name = termBody().getByText('Name & brand')
    expect(name.compareDocumentPosition(build) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("dropdown semantics: picking asserts (the aria-label carries the full label; options render NAMES ONLY), 'Not set' clears back, asserting the default value still asserts", () => {
    renderIt()
    // Unasserted: the trigger says so and names the default it composes.
    expect(decisionTitle('enterprise')).toContain('not set')
    expect(decisionTitle('enterprise')).toContain('Developers')
    // Names only (founder 2026-10-01, item 4): no sublabel, no tooltip — the corpus-mapping
    // receipt lives on non-blocking surfaces (semi-auto card tooltips, the run's phase notes;
    // the standing info line under the band is GONE since round 8).
    fireEvent.click(screen.getByTestId('vs-decision-enterprise'))
    const entOption = screen.getByTestId('vs-decision-enterprise-yes')
    expect(entOption.textContent).not.toContain('land-the-enterprise-deal')
    expect(entOption.textContent?.trim().replace(/✓$/, '').trim()).toBe('Enterprises')
    expect(entOption.getAttribute('title')).toBeNull()
    expect(entOption.getAttribute('aria-label')).toBe('Enterprises')
    expect(screen.queryByTestId('vs-decisions-info')).toBeNull()
    fireEvent.click(screen.getByTestId('vs-decision-enterprise')) // close
    pickDecision('enterprise', 'Enterprises')
    expect(decisionTitle('enterprise')).toContain('Enterprises')
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
    // 'Start with' has no control (round 5, item 4) — unasserted, it composes the default, so
    // the byte-identity still holds over the eight visible decisions.
    for (const [id, name] of [
      ['entity', 'Delaware C-Corp'], ['team', 'Cofounders'], ['funding', 'Raise a seed'],
      ['product', 'SaaS subscriptions'], ['hire', 'Make the first hire'],
      // The round-7 default-asserted values (2026-10-01): the byte-identity baseline composes
      // SOC 2 early + X launch + Office, so the explicit assertions repeat those values.
      ['compliance', 'SOC 2 (early)'], ['enterprise', 'Developers'], ['ph', 'X launch'],
      ['remote', 'Office'],
    ] as const) {
      pickDecision(id, name)
    }
    showAll()
    expect(screen.getByTestId('vs-terminal-body').textContent).toBe(notSet)
  })

  it("the 'full setup guide' expander is GONE (round 4, item 1) — and since the 2026-09-30 tooltip removal (item 3) the honesty copy lives in pill titles and option SUBLABELS", () => {
    renderIt()
    expect(screen.queryByText(/full setup guide/i)).toBeNull()
    // The only disclosure in the band is round 8's 'Set vendors' row — no explainer expander.
    expect(screen.queryByText(/full setup/i)).toBeNull()
    // The corpus disclosure folds into the preset PILL (tooltip + sr-only) — the ⓘ is gone
    // (item 11); pills are not dropdowns, so their titles never overlap an open listbox.
    const disclosures = screen.getAllByTestId('vs-preset-disclosure')
    expect(disclosures.length).toBe(2)
    for (const d of disclosures) expect(d.textContent).toContain('same real software-company process corpus')
    expect(screen.getByTestId('vs-preset-hardware').getAttribute('title')).toContain('same real software-company process corpus')
    // The founder selector's combo options carry their named simulation assumptions as
    // SUBLABELS inside the open list (item 3: no title= on dropdown options)…
    fireEvent.click(screen.getByTestId('vs-persona-trigger'))
    expect(screen.getByTestId('vs-persona-non-technical-first-timer').getAttribute('title')).toBeNull()
    expect(screen.getByTestId('vs-persona-non-technical-first-timer').textContent).toContain('simulation assumption')
    expect(screen.getByTestId('vs-persona-technical-second-timer').textContent).toContain('simulation assumption')
    fireEvent.click(screen.getByTestId('vs-persona-trigger')) // close
    // …while the decision options are NAMES ONLY (item 4, 2026-10-01): no tooltip, no sublabel.
    fireEvent.click(screen.getByTestId('vs-decision-funding'))
    expect(screen.getByTestId('vs-decision-funding-seed').getAttribute('title')).toBeNull()
    expect(screen.getByTestId('vs-decision-funding-seed').textContent).not.toContain('playbook')
  })
})

describe('VirtualStartup — preset example companies and the ?preset= contract', () => {
  it('renders the three example pills with FUNCTIONAL-TYPE labels (item 11) — fake startup names and the ⓘ icon are gone; the honesty disclosure folds into the pill title + sr-only', () => {
    renderIt()
    // Functional types, not fictional companies (item 11, 2026-09-30).
    expect(screen.getByTestId('vs-preset-software').textContent).toContain('Typical software')
    expect(screen.getByTestId('vs-preset-hardware').textContent).toContain('Frontier hardware')
    expect(screen.getByTestId('vs-preset-biotech').textContent).toContain('Biotech')
    for (const [id, name] of [['software', 'Agentloop'], ['hardware', 'Holofield'], ['biotech', 'Demovax']] as const) {
      const pill = screen.getByTestId(`vs-preset-${id}`)
      expect(pill.textContent).not.toContain(name) // the fake name left the label
      expect(pill.textContent).not.toContain('ⓘ') // the info icon is gone
    }
    // The hardware/biotech corpus disclosure stays reachable BEFORE any run: pill tooltip +
    // screen-reader text (sr-only), software honestly carries none.
    const disclosures = screen.getAllByTestId('vs-preset-disclosure')
    expect(disclosures).toHaveLength(2)
    for (const d of disclosures) expect(d.textContent).toContain('same real software-company process corpus')
    expect(screen.getByTestId('vs-preset-hardware').getAttribute('title')).toContain('aren’t modeled yet')
    expect(screen.getByTestId('vs-preset-biotech').getAttribute('title')).toContain('aren’t modeled yet')
    expect(screen.getByTestId('vs-preset-software').getAttribute('title')).not.toContain('aren’t modeled yet')
    expect(within(screen.getByTestId('vs-preset-software')).queryByTestId('vs-preset-disclosure')).toBeNull()
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
    // Biotech asserts the HIPAA framing (round 5, item 3: combos updated) — same chain, early.
    expect(decisionTitle('compliance')).toContain('HIPAA')
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
    // …but the rest of the preset combo survives the manual change, asserted (the hidden
    // ordering assertion survives too — observable as the build-first composition below).
    expect(decisionTitle('product')).toContain('Invoice-billed services')
    expect(decisionTitle('ph')).toContain('Stealth mode')
    showAll()
    const build = termBody().getByText('Build & ship v1')
    const name = termBody().getByText('Name & brand')
    expect(build.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Identity reverted to the combo-seeded name: no Holofield artifact in the run (the preset
    // PILL still shows its own name — scope to the terminal body).
    expect(within(screen.getByTestId('vs-terminal-body')).queryByText(/Holofield/)).toBeNull()
    expect(screen.queryByText('Founder agreement & equity split')).toBeNull()
    expect(termBody().getByText('Send an invoice')).toBeTruthy()
  })
})

// Funding scenarios, now INSIDE the single Funding selector (founder addendum 2026-09-30): the
// plain funding options (Raise a seed / Bootstrap) and the scenario combos (VC backed /
// Bootstrapped) share one house-listbox dropdown. Asserting semantics/codec unchanged: a plain
// option asserts only the funding decision; a scenario option asserts its partial combo and
// writes the shared ?preset= namespace, exactly as the old Scenario-row pills did.
describe('VirtualStartup — the single Funding selector (decision options + scenario combos)', () => {
  const openFunding = () => fireEvent.click(screen.getByTestId('vs-decision-funding'))

  it("ONE dropdown carries all four options as NAMES ONLY (item 4); the pills are gone and the Scenario row keeps presets + YC", () => {
    renderIt()
    const band = screen.getByTestId('vs-setup')
    expect(within(band).getByTitle('Scenario — one-tap setups: example companies and YC batch mode')).toBeTruthy()
    expect(within(band).queryByTestId('vs-scenario-vc-backed')).toBeNull()
    expect(within(band).queryByTestId('vs-scenario-bootstrapped')).toBeNull()
    openFunding()
    for (const name of ['Raise a seed', 'Bootstrap', 'VC backed', 'Bootstrapped']) {
      expect(screen.getByRole('option', { name })).toBeTruthy()
    }
    // Names only (founder 2026-10-01, item 4): no tooltip AND no sublabel — a scenario's exact
    // key → DECISIONS-option mapping stays visible through the asserted dropdowns themselves the
    // moment it is picked (funding/entity/hire triggers show the asserted values), and the
    // tooltip copy lives on in VS_SCENARIOS for the semi-auto/report surfaces.
    const vc = screen.getByRole('option', { name: 'VC backed' })
    expect(vc.getAttribute('title')).toBeNull()
    expect(vc.textContent).not.toContain('Delaware C-Corp')
    expect(vc.textContent).not.toContain('Make the first hire')
    const boot = screen.getByRole('option', { name: 'Bootstrapped' })
    expect(boot.textContent).not.toContain('Invoice-billed services')
    openFunding() // close
    // The company preset pills are unchanged otherwise.
    expect(within(band).getByTestId('vs-preset-software')).toBeTruthy()
  })

  it('VC backed asserts funding + entity + hire, leaves everything else Not set, shows on the trigger, and writes ?preset=vc-backed', () => {
    renderIt()
    pickDecision('funding', 'VC backed')
    expect(window.location.search).toContain('preset=vc-backed')
    expect(screen.getByTestId('vs-decision-funding').textContent).toContain('VC backed')
    expect(decisionTitle('funding')).toContain('VC backed')
    expect(decisionTitle('entity')).toContain('Delaware C-Corp')
    expect(decisionTitle('hire')).toContain('Make the first hire')
    // Partial assert: decisions outside the scenario keep their state — product stays Not set;
    // team keeps its round-7 default-asserted 'Cofounders' (2026-10-01, item 5).
    expect(decisionTitle('product')).toContain('not set')
    expect(decisionTitle('team')).toContain('Cofounders')
    expect(decisionTitle('team')).not.toContain('not set')
    showAll()
    expect(termBody().getByText('Raise pre-seed (SAFEs)')).toBeTruthy()
    expect(termBody().getByText('Hire first employee')).toBeTruthy()
  })

  it('Bootstrapped asserts bootstrap + invoice-billed + founders-only; picking the PLAIN option afterwards asserts only funding and drops the scenario', () => {
    renderIt()
    pickDecision('funding', 'Bootstrapped')
    expect(window.location.search).toContain('preset=bootstrapped')
    expect(decisionTitle('funding')).toContain('Bootstrapped')
    expect(decisionTitle('product')).toContain('Invoice-billed services')
    expect(decisionTitle('hire')).toContain('Stay founders-only')
    showAll()
    expect(screen.queryByText('Raise pre-seed (SAFEs)')).toBeNull()
    expect(screen.queryByText('Hire first employee')).toBeNull()
    expect(termBody().getByText('Send an invoice')).toBeTruthy()
    expect(screen.queryByText('Set up subscription billing')).toBeNull()
    // The plain decision option: asserts funding alone, deselects the scenario (?preset clears),
    // and the other scenario-asserted keys keep their values (the pickChoice rule).
    pickDecision('funding', 'Raise a seed')
    expect(window.location.search).not.toContain('preset')
    expect(decisionTitle('funding')).toContain('Raise a seed')
    expect(decisionTitle('funding')).not.toContain('Bootstrapped')
    expect(decisionTitle('product')).toContain('Invoice-billed services')
  })

  it('?preset=vc-backed round-trips: read on mount, shown on the trigger, the partial combo asserted', () => {
    window.history.replaceState(null, '', '/?preset=vc-backed')
    renderIt()
    expect(screen.getByTestId('vs-decision-funding').textContent).toContain('VC backed')
    fireEvent.click(screen.getByTestId('vs-decision-funding'))
    expect(screen.getByRole('option', { name: 'VC backed' }).getAttribute('aria-selected')).toBe('true')
    fireEvent.click(screen.getByTestId('vs-decision-funding')) // close
    expect(decisionTitle('entity')).toContain('Delaware C-Corp')
    expect(decisionTitle('product')).toContain('not set')
    // The shared param namespace: no company preset lights up.
    for (const id of ['software', 'hardware', 'biotech']) {
      expect(screen.getByTestId(`vs-preset-${id}`).getAttribute('aria-pressed')).toBe('false')
    }
  })

  it('a scenario composes OVER a company preset (preset pill deselects, other assertions survive); a manual change clears the scenario', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-preset-hardware'))
    pickDecision('funding', 'Bootstrapped')
    expect(window.location.search).toContain('preset=bootstrapped')
    expect(screen.getByTestId('vs-preset-hardware').getAttribute('aria-pressed')).toBe('false')
    // Scenario keys override; the hardware combo's other keys stay asserted.
    expect(decisionTitle('funding')).toContain('Bootstrapped')
    expect(decisionTitle('ph')).toContain('Stealth mode')
    // A manual decision change deselects the scenario and clears ?preset (the pickChoice rule).
    pickDecision('team', 'Solo founder')
    expect(window.location.search).not.toContain('preset')
    expect(decisionTitle('funding')).not.toContain('Bootstrapped')
    expect(decisionTitle('funding')).toContain('Bootstrap') // the asserted decision value stays
  })

  it('YC interplay: Bootstrapped contradicts the calibration and turns YC off; VC backed keeps it; YC-on over Bootstrapped deselects the scenario', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    expect(window.location.search).toContain('yc=1')
    pickDecision('funding', 'VC backed')
    expect(screen.getByTestId('vs-yc-toggle').getAttribute('aria-pressed')).toBe('true')
    expect(window.location.search).toContain('yc=1')
    pickDecision('funding', 'Bootstrapped')
    expect(screen.getByTestId('vs-yc-toggle').getAttribute('aria-pressed')).toBe('false')
    expect(window.location.search).not.toContain('yc=1')
    expect(decisionTitle('funding')).toContain('Bootstrapped')
    // Turning YC back on over Bootstrapped: the calibration wins, the scenario deselects.
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    expect(screen.getByTestId('vs-decision-funding').textContent).not.toContain('Bootstrapped')
    expect(window.location.search).not.toContain('preset')
    expect(decisionTitle('funding')).toContain('Raise a seed')
  })
})

// The setup band flows top-to-bottom (founder batch 2026-10-02, item 2): the Setup/Vendors tab
// pills are GONE — Scenario row → Founder row → "I'm using" row → Choices (the decisions grid)
// → the collapsible 'Set vendors' disclosure (house <details> idiom, default collapsed). The
// embedded dry-run transcript (the old 'Simulate this playbook' section) stays gone entirely.
describe("VirtualStartup — the setup band flows top-to-bottom (round 8: no tabs, 'Set vendors' disclosure)", () => {
  it('the Setup/Vendors tab pills are gone: no tablist, no vs-tab-* buttons, the rows render directly', () => {
    renderIt()
    const band = screen.getByTestId('vs-setup')
    expect(within(band).queryByRole('tablist')).toBeNull()
    expect(screen.queryByTestId('vs-tab-setup')).toBeNull()
    expect(screen.queryByTestId('vs-tab-vendors')).toBeNull()
    expect(within(band).queryByText('Setup')).toBeNull()
    // The setup rows render directly — no tabpanel wrapper, nothing hidden.
    expect(within(band).getByTestId('vs-decision-entity')).toBeTruthy()
    expect(document.getElementById('vs-tabpanel-setup')).toBeNull()
    expect(document.getElementById('vs-tabpanel-vendors')).toBeNull()
  })

  it("band order: Scenario → Founder → I'm using → Choices (the decisions grid) → the 'Set vendors' disclosure", () => {
    renderIt()
    const rows = screen.getByTestId('vs-setup-rows')
    const text = rows.textContent ?? ''
    // The four label-column anchors appear, in flow order ('Choices' is the round-8 visual
    // anchor for the decisions grid — the retired 'Decisions' label does not return).
    const idx = ['Scenario', 'Founder', "I'm using", 'Choices'].map((l) => text.indexOf(l))
    expect(idx.every((v) => v >= 0)).toBe(true)
    expect([...idx].sort((a, b) => a - b)).toEqual(idx)
    // The decisions grid sits under the 'Choices' label; the disclosure follows the whole grid.
    const choices = screen.getByTestId('vs-decision-entity')
    const vendors = screen.getByTestId('vs-set-vendors')
    expect(choices.compareDocumentPosition(vendors) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("the 'Set vendors' disclosure: default COLLAPSED, muted summary row (not a tab, not a pill), opens on click, never touches the URL", () => {
    renderIt()
    const details = screen.getByTestId('vs-set-vendors')
    expect(details.tagName).toBe('DETAILS')
    expect(details.hasAttribute('open')).toBe(false)
    const summary = screen.getByTestId('vs-set-vendors-summary')
    expect(summary.tagName).toBe('SUMMARY')
    expect(summary.textContent).toContain('Set vendors')
    expect(summary.className).toContain('text-zinc-500') // visually 'unset' until opened
    fireEvent.click(summary)
    expect(details.hasAttribute('open')).toBe(true)
    // This fixture passes roles=[] — the panel says so honestly instead of an empty grid.
    expect(screen.getByTestId('vs-vendors-empty')).toBeTruthy()
    expect(window.location.search).toBe('')
    fireEvent.click(summary) // collapses back
    expect(details.hasAttribute('open')).toBe(false)
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
  it('toggling YC mode calibrates the combo, shows the minimal non-affiliation note, and writes ?yc=1', () => {
    renderIt()
    expect(screen.queryByTestId('vs-yc-nonaffiliation')).toBeNull()
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    expect(window.location.search).toContain('yc=1')
    // Round 8 (item 3): the explainer paragraph is GONE; the load-bearing synthetic/affiliation
    // honesty survives as this muted suffix (full YC_BATCH.disclosure sentence in its tooltip).
    expect(screen.queryByTestId('vs-yc-disclosure')).toBeNull()
    expect(screen.queryByText(/Calibrated to the publicly known YC batch shape/)).toBeNull()
    expect(screen.queryByText(/Batch calendar:/)).toBeNull()
    const note = screen.getByTestId('vs-yc-nonaffiliation')
    expect(note.textContent).toBe('synthetic \u00b7 not affiliated with YC')
    expect(note.getAttribute('title')).toContain('not affiliated with or endorsed by Y Combinator')
    // Launch-early calibration: PH on, seed raise — asserted in the dropdowns; build-first has
    // no control (round 5, item 4) but the calibration still asserts it internally, observable
    // as the composition below.
    expect(decisionTitle('ph')).toContain('Product Hunt')
    expect(decisionTitle('funding')).toContain('Raise a seed')
    showAll()
    const build = termBody().getByText('Build & ship v1')
    const name = termBody().getByText('Name & brand')
    expect(build.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
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
    // Named on the relocated phase's note alone — the band's explainer paragraph is gone (round 8).
    expect(screen.getAllByText(/compresses to Demo-Day timing/)).toHaveLength(1)
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
    expect(screen.getByTestId('vs-yc-nonaffiliation')).toBeTruthy()
    expect(decisionTitle('funding')).toContain('Raise a seed')
    // Contradicting the calibration (quiet launch) turns the mode off and clears ?yc.
    pickDecision('ph', 'Stealth mode')
    expect(screen.queryByTestId('vs-yc-nonaffiliation')).toBeNull()
    expect(window.location.search).not.toContain('yc=1')
    // A non-calibration pick keeps the mode on.
    window.history.replaceState(null, '', '/')
    fireEvent.click(screen.getByTestId('vs-yc-toggle'))
    pickDecision('team', 'Solo founder')
    expect(screen.getByTestId('vs-yc-nonaffiliation')).toBeTruthy()
    expect(window.location.search).toContain('yc=1')
  })
})


describe('VirtualStartup — founder batch 2026-09-30', () => {
  it('the title-bar pause button and the paused status are GONE (item 2): only ⏹ Stop while running, status running…/quiet', () => {
    vi.useFakeTimers()
    try {
      renderIt()
      expect(screen.queryByTestId('vs-terminal-pause')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
      act(() => { vi.advanceTimersByTime(240 * 3) })
      // Mid-run: no pause affordance anywhere, the primary button reads Stop.
      expect(screen.queryByTestId('vs-terminal-pause')).toBeNull()
      expect(screen.getByRole('button', { name: /stop/i })).toBeTruthy()
      expect(screen.getByTestId('vs-terminal-status').textContent).toMatch(/running/)
      fireEvent.click(screen.getByRole('button', { name: /stop/i }))
      // Stopped: the status goes quiet — 'paused' no longer exists in the vocabulary.
      expect(screen.getByTestId('vs-terminal-status').textContent).toBe('')
      expect(screen.queryByText(/^paused$/i)).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it("the 'Decisions' row label stays gone (item 6) — round 8's anchor is 'Choices', never 'Decisions'", () => {
    renderIt()
    const setupRows = screen.getByTestId('vs-setup-rows')
    expect(setupRows.textContent).not.toContain('Decisions')
    expect(setupRows.textContent).toContain('Choices')
    expect(within(screen.getByTestId('vs-setup')).queryByTitle(/Starting decisions/)).toBeNull()
    // The other row labels stay.
    expect(setupRows.textContent).toContain('Scenario')
    expect(setupRows.textContent).toContain('Founder')
  })

  it('tooltip removal (item 3): NO title= on the decision/entity/funding/founder/geo/assistant triggers or their options; aria-labels stay', () => {
    renderIt()
    for (const id of ['entity', 'team', 'funding', 'product', 'hire', 'compliance', 'enterprise', 'ph', 'remote']) {
      const trigger = screen.getByTestId(`vs-decision-${id}`)
      expect(trigger.getAttribute('title'), `trigger ${id}`).toBeNull()
      expect(trigger.getAttribute('aria-label'), `aria ${id}`).toBeTruthy()
      fireEvent.click(trigger)
      for (const o of screen.getAllByRole('option')) expect(o.getAttribute('title')).toBeNull()
      fireEvent.click(trigger) // close
    }
    for (const testid of ['vs-persona-trigger', 'vs-geo-trigger', 'vs-assistant-trigger']) {
      const trigger = screen.getByTestId(testid)
      expect(trigger.getAttribute('title'), testid).toBeNull()
      fireEvent.click(trigger)
      for (const o of screen.getAllByRole('option')) expect(o.getAttribute('title')).toBeNull()
      fireEvent.click(trigger) // close
    }
  })

  it("the Workplace decision (item 5): Office composes the real lease-an-office process as a chainless phase (no playbook link); Remote-first composes nothing extra", () => {
    renderIt()
    // Office is the round-7 DEFAULT-ASSERTED workplace (2026-10-01, item 5) — the lease phase
    // composes on a fresh visit; Remote-first honestly removes it.
    showAll()
    expect(termBody().getByText('Lease an office')).toBeTruthy()
    pickDecision('remote', 'Remote-first')
    showAll()
    expect(screen.queryByText('Lease an office')).toBeNull()
    pickDecision('remote', 'Office')
    showAll()
    expect(termBody().getByText('Lease an office')).toBeTruthy()
    const phase = termBody().getByText('Move into an office')
    // Honesty: a single corpus process, NOT a curated chain — no playbook link on this phase.
    expect(within(phase.closest('li')!).queryByText(/playbook →/)).toBeNull()
    expect(termBody().getByText(/not a curated chain/)).toBeTruthy()
    // Other phases keep their chain links.
    expect(termBody().getAllByText(/playbook →/).length).toBeGreaterThan(0)
    // The office artifact prints, simulated and impossible-real.
    const lease = screen.getAllByTestId('vs-artifact').find((a) => /Office lease/.test(a.textContent ?? ''))!
    expect(lease.getAttribute('data-synthetic')).toBe('true')
    expect(lease.textContent).toContain('$0.00')
  })

  it("the 'I'm using' selector (item 7): picking an assistant pins it on the AI-conversation steps as 'your assistant' while the judged top keeps '(recommended · judged)'", () => {
    renderIt()
    // Fresh-visit default (2026-10-01, item 5): ChatGPT is simply pre-selected — and NO
    // 'judged pick' wording labels the selector anywhere.
    expect(screen.getByTestId('vs-assistant-trigger').textContent).toContain('ChatGPT')
    expect(screen.getByTestId('vs-assistant-row').textContent).not.toMatch(/judged pick/i)
    showAll()
    // The judged top on the naming step IS ChatGPT — one chip, both labels, no separate pin.
    expect(screen.queryByTestId('vs-step-assistant')).toBeNull()
    expect(screen.getByTestId('vs-step-assistant-label').textContent).toContain('your assistant')
    // Clearing back to 'Not set' (the legacy-link state) removes the pin entirely.
    fireEvent.click(screen.getByTestId('vs-assistant-trigger'))
    fireEvent.click(screen.getByTestId('vs-assistant-judged'))
    expect(screen.getByTestId('vs-assistant-trigger').textContent).toContain('Not set')
    expect(screen.queryByTestId('vs-step-assistant')).toBeNull()
    expect(screen.queryByTestId('vs-step-assistant-label')).toBeNull()
    // Pick Claude (≠ the judged top ChatGPT on the naming step) — annotation only: the revealed
    // terminal keeps its rows and the pin appears on the ai-assistants-mapped step.
    fireEvent.click(screen.getByTestId('vs-assistant-trigger'))
    fireEvent.click(screen.getByTestId('vs-assistant-claude'))
    const pin = screen.getByTestId('vs-step-assistant')
    expect(pin.textContent).toContain('Claude')
    expect(pin.getAttribute('href')).toBe('/arena/ai-assistants/product/claude')
    expect(screen.getByTestId('vs-step-assistant-label').textContent).toContain('your assistant')
    // The judged pick stays visible, labeled, and unmoved — no judged number moves.
    expect(termBody().getAllByText(/\(recommended · judged\)/).length).toBeGreaterThan(0)
    expect(termBody().getByRole('link', { name: /chatgpt · 77/i })).toBeTruthy()
    // The state panel reflects it.
    fireEvent.click(screen.getByTestId('vs-sg-tab-decisions'))
    const decisions = screen.getAllByTestId('vs-sg-decision').map((d) => d.textContent).join(' | ')
    expect(decisions).toContain("I'm using")
    expect(decisions).toContain('Claude · your assistant')
    // Picking the judged top itself collapses to one chip with both labels.
    fireEvent.click(screen.getByTestId('vs-assistant-trigger'))
    fireEvent.click(screen.getByTestId('vs-assistant-chatgpt'))
    expect(screen.queryByTestId('vs-step-assistant')).toBeNull()
    expect(screen.getByTestId('vs-step-assistant-label').textContent).toContain('your assistant')
  })

  it('contrast pins (item 9): the lifted secondary-text classes hold on cheap-to-pin nodes', () => {
    renderIt()
    showAll()
    // Day markers lifted off zinc-600; phase notes and the corpus-time line read at zinc-400.
    const day = screen.getByText(/— day 3 —/)
    expect(day.className).toContain('text-zinc-500')
    expect(day.className).not.toContain('text-zinc-600')
    const corpusLine = screen.getByText(/Corpus time estimate/)
    expect(corpusLine.className).toContain('text-zinc-400')
    // The terminal status strip sits at zinc-400 (was zinc-500).
    expect(screen.getByTestId('vs-terminal-status').className).toContain('text-zinc-400')
  })
})

describe("the 'Apply to YC' checkbox (founder 2026-10-01, item 6)", () => {
  it('unchecked by default — no application phase; checking composes the real fund_007 process as a chainless phase with its simulated artifact; unchecking removes it', () => {
    renderIt()
    const box = screen.getByTestId('vs-yc-apply-input') as HTMLInputElement
    expect(box.checked).toBe(false)
    showAll()
    expect(screen.queryByText('Apply to Y Combinator')).toBeNull()
    // Check it — a composition change, so the run clears like a decision change.
    fireEvent.click(box)
    expect(box.checked).toBe(true)
    expect(screen.queryAllByTestId('vs-artifact')).toHaveLength(0)
    showAll()
    expect(termBody().getByText('Apply to Y Combinator')).toBeTruthy()
    const phase = termBody().getByText('Apply to YC')
    // The office/lease pattern: a single committed corpus process, NOT a curated chain — no
    // playbook link on this phase, and the note says so plus the non-affiliation line.
    expect(within(phase.closest('li')!).queryByText(/playbook →/)).toBeNull()
    // Two chainless phases print the honesty line now (the default-asserted Office + this one).
    expect(termBody().getAllByText(/not a curated chain/).length).toBeGreaterThanOrEqual(2)
    expect(termBody().getByText(/not affiliated with or endorsed by Y Combinator/)).toBeTruthy()
    // The phase lands right after formation (the application asks for company + founders).
    const form = termBody().getByText('Form the company')
    const raise = termBody().getByText('Raise the seed')
    expect(form.compareDocumentPosition(phase) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(phase.compareDocumentPosition(raise) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // The application artifact prints simulated, never claiming acceptance.
    const art = screen.getAllByTestId('vs-artifact').find((a) => /YC application/.test(a.textContent ?? ''))!
    expect(art.getAttribute('data-synthetic')).toBe('true')
    expect(art.textContent).toContain('submitted')
    expect(art.textContent).not.toMatch(/accepted/i)
    // Uncheck: the phase honestly leaves the composition.
    fireEvent.click(box)
    showAll()
    expect(screen.queryByText('Apply to Y Combinator')).toBeNull()
  })
})

describe('setup band wraps at small widths (founder 2026-10-01, item 3b)', () => {
  // The old mobile pattern (per-row overflow-x-auto scroll strips) overflowed off the right edge
  // instead of scrolling: the decisions row lacked min-w-0, so the grid item's automatic minimum
  // width pushed the whole band past the viewport. The rows now WRAP at every width.
  it('every control row is flex-wrap + min-w-0 and nothing in the band scrolls sideways', () => {
    renderIt()
    const setup = screen.getByTestId('vs-setup')
    expect(setup.querySelectorAll('[class*="overflow-x-auto"]').length).toBe(0)
    const rows = [
      screen.getByTestId('vs-yc-toggle').parentElement!, // scenario pills + YC mode
      screen.getByTestId('vs-assistant-row').parentElement!, // the "I'm using" row
      // The decisions row: the VsDecisionSelect groups' shared parent.
      screen.getByTestId('vs-decision-entity').closest('div[role="group"]')!.parentElement!,
    ]
    for (const row of rows) {
      expect(row.className).toContain('flex-wrap')
      expect(row.className).toContain('min-w-0')
      expect(row.className).not.toContain('overflow-x-auto')
    }
  })
})
