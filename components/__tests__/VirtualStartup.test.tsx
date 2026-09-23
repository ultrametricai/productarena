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
import type { VirtualTaskPayload, VsChain } from '@/lib/virtualStartup'

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

// journeyPhases resolves every VS_CHAIN_IDS chain, so the fixture must cover all seven.
const CHAINS: VsChain[] = [
  { id: 'name-the-company', name: 'Name the company', taskIds: ['brand_001'] },
  { id: 'company-launch', name: 'Company launch', taskIds: ['form_001', 'startup_002', 'qs_023'] },
  { id: 'raise-a-seed-round', name: 'Raise a seed round', taskIds: ['fund_001'] },
  { id: 'ship-v1', name: 'Ship v1', taskIds: ['prod_006'] },
  { id: 'launch-website', name: 'Launch the website', taskIds: ['site_001'] },
  { id: 'get-paid', name: 'Get paid', taskIds: ['qs_021', 'growth_001', 'sales_002'] },
  { id: 'launch-on-product-hunt', name: 'Launch on Product Hunt', taskIds: ['growth_010'] },
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
    task('prod_006', 'Set up a code hosting org'),
    task('site_001', 'Generate a website'),
    task('qs_021', 'Connect a payment processor'),
    task('growth_001', 'Set up subscription billing'),
    task('sales_002', 'Send an invoice'),
    task('growth_010', 'Launch on Product Hunt & directories'),
  ].map((t) => [t.id, t]),
)

const renderIt = () => render(<VirtualStartup chains={CHAINS} tasks={TASKS} roles={[]} />)
const showAll = () => fireEvent.click(screen.getByRole('button', { name: /show the whole timeline/i }))

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
})
