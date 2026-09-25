// @vitest-environment jsdom
// VirtualStartup — the synthetic-labeling invariant at the DOM level (every generated artifact
// node visibly carries the SIMULATED tag; the site's evidence-honesty brand depends on nothing
// synthetic being mistakable for a judged fact) plus the decision → rendered-journey wiring.
// Fixture chains/tasks keep the journey small; the decision→journey mapping itself is tested
// against the live corpus in lib/__tests__/virtualStartup.test.ts.
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import VirtualStartup from '@/components/VirtualStartup'
import type { SimStep } from '@/lib/processSim'
import type { VirtualTaskPayload, VsChain, YearCandidate } from '@/lib/virtualStartup'

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
    ceilingPct: 75, runsPerYear: 12, always: true,
  },
  {
    taskId: 'hr_002', title: 'Run payroll', slug: 'run-payroll', cadence: 'monthly',
    cadenceLabel: 'Monthly', totalSteps: 5, routes: { agent: 4, form: 0, person: 1, legalSignature: 0 },
    ceilingPct: 80, runsPerYear: 12, always: false,
  },
  {
    taskId: 'tax_001', title: 'File DE franchise tax', slug: 'file-de-franchise-tax', cadence: 'annual',
    cadenceLabel: 'Annual', totalSteps: 3, routes: { agent: 1, form: 1, person: 1, legalSignature: 0 },
    ceilingPct: 33, runsPerYear: 1, always: true,
  },
  {
    taskId: 'comp_002', title: 'Complete SOC 2 Type II', slug: 'complete-soc-2-type-ii', cadence: 'annual',
    cadenceLabel: 'Annual', totalSteps: 6, routes: { agent: 2, form: 2, person: 2, legalSignature: 0 },
    ceilingPct: 33, runsPerYear: 1, always: false,
  },
]

const renderIt = () =>
  render(<VirtualStartup chains={CHAINS} tasks={TASKS} roles={[]} yearCandidates={YEAR_CANDIDATES} />)
const showAll = () => fireEvent.click(screen.getByRole('button', { name: /show the whole timeline/i }))
const yearSection = () => screen.getByText('Year one — the operating rhythm').closest('section')!

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
    expect(screen.getByText(/day 3/i)).toBeTruthy()
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

describe('VirtualStartup — run CTA and the year-one operating rhythm', () => {
  it('shows the primary run CTA before any timeline content', () => {
    renderIt()
    expect(screen.getByRole('button', { name: /run this startup/i })).toBeTruthy()
    expect(screen.queryByText('Timeline')).toBeNull()
  })

  it('renders the year view when the journey completes, gated by the decisions', () => {
    renderIt()
    showAll()
    const year = within(yearSection())
    // Always-on spine + the hire-gated payroll; no enterprise motion by default.
    expect(year.getByText('Bookkeeping close')).toBeTruthy()
    expect(year.getByText('Run payroll')).toBeTruthy()
    expect(year.queryByText('Complete SOC 2 Type II')).toBeNull()
    expect(screen.getAllByTestId('vs-year-row')).toHaveLength(3)
    // The corpus-dated tax deadline renders its corpus note (real data, no simulated chip).
    const taxRow = screen.getAllByTestId('vs-year-row').find((r) => r.getAttribute('data-month-source') === 'corpus')!
    expect(within(taxRow).getByText(/by March 1/)).toBeTruthy()
    expect(within(taxRow).queryByText(/^simulated$/i)).toBeNull()
    // The summary totals: 12 + 12 + 1 = 25 recurring runs.
    const summary = screen.getByTestId('vs-year-summary')
    expect(summary.textContent).toContain('25')
    expect(summary.textContent).toContain('recurring runs')
  })

  it('labels seeded (non-corpus-dated) annual slots SIMULATED', () => {
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: 'Chase the enterprise deal' }))
    showAll()
    const seeded = screen.getAllByTestId('vs-year-row').filter((r) => r.getAttribute('data-month-source') === 'seeded')
    expect(seeded).toHaveLength(1)
    expect(within(seeded[0]).getByText('Complete SOC 2 Type II')).toBeTruthy()
    expect(within(seeded[0]).getByText(/^simulated$/i)).toBeTruthy()
  })
})
