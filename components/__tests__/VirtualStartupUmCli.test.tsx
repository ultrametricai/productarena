// @vitest-environment jsdom
// Ultrametric CLI/MCP surface in the Startup Simulator (founder ask 2026-09-30) — OWNER PRODUCT,
// honesty-first, pinned at the DOM level:
//   1. a mapped process row prints the first-party line with the REAL shipped command from the
//      curated lib/ultrametricCli.ts map — and ONLY mapped rows print it;
//   2. the visible affiliation disclosure ("our own product", /get-started link, full-sentence
//      tooltip) renders verbatim;
//   3. the judged vendor picks are untouched: the step pill still renders, the Vendors tab still
//      lists only judged picks in its count, and the CLI block sits BELOW them under an explicit
//      "not a judged pick" label.
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VirtualStartup from '@/components/VirtualStartup'
import { setGeoSelection } from '@/lib/geoPreference'
import type { SimStep } from '@/lib/processSim'
import { ULTRAMETRIC_CLI_DISCLOSURE, ULTRAMETRIC_CLI_STEPS, ultrametricCliFor } from '@/lib/ultrametricCli'
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

// journeyPhases resolves every VS_CHAIN_IDS chain, so the fixture must cover all ten.
// company-launch carries three MAPPED tasks (form_001, form_002, startup_002) and one
// unmapped control with a judged top pick (qs_023 → Mercury).
const CHAINS: VsChain[] = [
  { id: 'name-the-company', name: 'Name the company', taskIds: ['brand_001'] },
  { id: 'company-launch', name: 'Company launch', taskIds: ['form_001', 'form_002', 'startup_002', 'qs_023'] },
  { id: 'raise-a-seed-round', name: 'Raise a seed round', taskIds: ['fund_001'] },
  { id: 'set-up-compliance', name: 'Set up compliance (SOC 2-lite)', taskIds: ['ops_005'] },
  { id: 'ship-v1', name: 'Ship v1', taskIds: ['prod_006'] },
  { id: 'launch-website', name: 'Launch the website', taskIds: ['site_001'] },
  { id: 'get-paid', name: 'Get paid', taskIds: ['qs_021'] },
  { id: 'first-hire', name: 'First hire', taskIds: ['hr_001', 'hr_002'] },
  { id: 'launch-on-product-hunt', name: 'Launch on Product Hunt', taskIds: ['growth_010'] },
  { id: 'land-the-enterprise-deal', name: 'Land the enterprise deal', taskIds: ['comp_002'] },
]

const TASKS: Record<string, VirtualTaskPayload> = Object.fromEntries(
  [
    task('brand_001', 'Generate a company name'),
    task('form_001', 'Incorporate C-Corp'),
    task('form_002', 'Get EIN'),
    task('startup_002', 'Sign the founder agreement & split equity'),
    task('qs_023', 'Open a business bank account', {
      steps: [step('qs_023', 'Open the account', { arenaId: 'startup-banking' })],
      // A judged top pick on an UNMAPPED task — the control proving the CLI surface never
      // touches, displaces, or joins the judged picks.
      tops: [
        { productId: 'mercury', name: 'Mercury', score: 88, arenaId: 'startup-banking', arenaName: 'Startup banking' },
      ],
    }),
    task('fund_001', 'Raise pre-seed (SAFEs)'),
    task('ops_005', 'Set up a password manager'),
    task('prod_006', 'Set up a code hosting org'),
    task('site_001', 'Generate a website'),
    task('qs_021', 'Connect a payment processor'),
    task('hr_001', 'Hire first employee'),
    task('hr_002', 'Run payroll'),
    task('growth_010', 'Launch on Product Hunt & directories'),
    task('comp_002', 'Complete SOC 2 Type II'),
  ].map((t) => [t.id, t]),
)

const renderIt = () =>
  render(
    <VirtualStartup
      chains={CHAINS}
      tasks={TASKS}
      roles={[]}
      yearCandidates={[]}
      eventExamples={[]}
      access={{}}
      pricing={{}}
      taskRisks={{}}
      vendorGeo={{}}
    />,
  )

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

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  window.localStorage.clear()
  setGeoSelection(null)
})

describe('VirtualStartup — the Ultrametric CLI/MCP line on mapped process rows', () => {
  it('prints exactly one line per revealed MAPPED task, with the real shipped command and nothing on unmapped rows', () => {
    renderIt()
    showAll()
    const term = screen.getByTestId('vs-terminal')
    // Every revealed task row, resolved through the same curated map the component uses.
    const revealedTaskIds = Array.from(term.querySelectorAll('[data-vs-row]'))
      .map((el) => el.getAttribute('data-vs-row') ?? '')
      .filter((key) => key.startsWith('task-'))
      .map((key) => key.slice('task-'.length))
    expect(revealedTaskIds.length).toBeGreaterThan(0)
    const mappedRevealed = revealedTaskIds.filter((id) => ultrametricCliFor(id) !== null)
    expect(mappedRevealed.length).toBeGreaterThan(0)
    const lines = within(term).getAllByTestId('vs-um-cli')
    expect(lines.length).toBe(mappedRevealed.length)
    // The default journey includes company-launch: the incorporate row must carry the exact
    // shipped invocation from the map (pinned to the committed data, not a re-typed literal).
    expect(mappedRevealed).toContain('form_001')
    const texts = lines.map((l) => l.textContent ?? '')
    expect(texts.some((t) => t.includes(ULTRAMETRIC_CLI_STEPS.form_001.command))).toBe(true)
    for (const t of texts) {
      expect(t).toContain('our own product')
      expect(t).toContain('ultrametric process open ')
      expect(t).toContain('MCP open_process')
      expect(t).toContain('your agent does the work')
    }
  })

  it('carries the visible affiliation: /get-started link + the full disclosure sentence as the tooltip', () => {
    renderIt()
    showAll()
    const line = screen.getAllByTestId('vs-um-cli')[0]
    expect(line.getAttribute('title')).toBe(ULTRAMETRIC_CLI_DISCLOSURE)
    const link = within(line).getByRole('link', { name: 'Ultrametric CLI/MCP' })
    expect(link.getAttribute('href')).toBe('/get-started')
  })

  it('never displaces the judged pick: the step pill still renders and the Vendors tab counts only judged picks', () => {
    renderIt()
    showAll()
    // The judged top pick on the unmapped control task still renders its terminal pill.
    const term = screen.getByTestId('vs-terminal')
    expect(within(term).getByRole('link', { name: /Mercury · 88/ })).toBeTruthy()
    // Vendors tab badge counts JUDGED vendors only (1 — Mercury), not the CLI lines.
    const vendorsTab = screen.getByTestId('vs-sg-tab-vendors')
    expect((vendorsTab.textContent ?? '').replace(/\s/g, '')).toBe('Vendors1')
    fireEvent.click(vendorsTab)
    const body = screen.getByTestId('vs-stategraph-body')
    const judged = within(body).getAllByTestId('vs-sg-vendor')
    expect(judged.length).toBe(1)
    expect(judged[0].textContent).toContain('Mercury')
    // The first-party block renders BELOW the judged list, explicitly labeled.
    const block = within(body).getByTestId('vs-sg-umcli')
    expect(block.textContent).toContain('first-party · Ultrametric CLI/MCP (ours) — not a judged pick')
    expect(judged[0].compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // One line per revealed mapped process, each carrying its command.
    const blockLines = within(block).getAllByTestId('vs-sg-umcli-line')
    expect(blockLines.length).toBeGreaterThan(0)
    for (const l of blockLines) expect(l.textContent).toContain('ultrametric process open ')
    // No Mercury inside the first-party block; no Ultrametric inside the judged list.
    expect(block.textContent).not.toContain('Mercury')
    for (const j of judged) expect(j.textContent).not.toContain('Ultrametric')
  })
})
