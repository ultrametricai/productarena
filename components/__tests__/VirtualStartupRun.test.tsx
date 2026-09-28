// @vitest-environment jsdom
// Virtual Startup v3 surfaces at the DOM level — the labeling invariants the founder contract
// hangs on: every mid-run event card is visibly SIMULATED and grounded in a linked real process;
// every simulation constant surfaces with the words "simulation assumption"; the burn block is
// labeled "published pricing" with per-vendor cites and honest gaps; and the ?run= permalink
// replays the exact run (picks included) after a reload. The pure math behind these surfaces is
// tested against the live corpus in lib/__tests__/virtualStartupRun.test.ts.
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VirtualStartup from '@/components/VirtualStartup'
import type { SimStep, VendorRole } from '@/lib/processSim'
import type { VirtualTaskPayload, VsChain } from '@/lib/virtualStartup'
import {
  decodeRunState,
  encodeRunState,
  FOUNDER_HOURS_MULTIPLIER,
  type VsAccessMap,
  type VsPricingMap,
} from '@/lib/virtualStartupRun'

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
  { id: 'company-launch', name: 'Company launch', taskIds: ['form_001', 'startup_002'] },
  { id: 'raise-a-seed-round', name: 'Raise a seed round', taskIds: ['fund_001'] },
  { id: 'set-up-compliance', name: 'Set up compliance (SOC 2-lite)', taskIds: ['ops_005'] },
  { id: 'ship-v1', name: 'Ship v1', taskIds: ['prod_006'] },
  { id: 'launch-website', name: 'Launch the website', taskIds: ['site_001'] },
  { id: 'get-paid', name: 'Get paid', taskIds: ['qs_021'] },
  { id: 'first-hire', name: 'First hire', taskIds: ['hr_001'] },
  { id: 'launch-on-product-hunt', name: 'Launch on Product Hunt', taskIds: ['growth_010'] },
  { id: 'land-the-enterprise-deal', name: 'Land the enterprise deal', taskIds: ['comp_002'] },
]

const TASKS: Record<string, VirtualTaskPayload> = Object.fromEntries(
  [
    task('brand_001', 'Generate a company name'),
    task('form_001', 'Incorporate C-Corp'),
    task('startup_002', 'Sign the founder agreement'),
    task('fund_001', 'Raise pre-seed (SAFEs)'),
    task('ops_005', 'Set up a password manager'),
    task('prod_006', 'Set up a code hosting org'),
    task('site_001', 'Generate a website'),
    // The payments-served agent step — the outcome model reroutes it by pick surface.
    task('qs_021', 'Connect a payment processor', {
      steps: [step('qs_021', 'Activate the processor account', { arenaId: 'payments', vendor: 'stripe', vendorLabel: 'Stripe' })],
      tops: [null],
    }),
    task('hr_001', 'Hire first employee'),
    task('growth_010', 'Launch on the directories'),
    task('comp_002', 'Complete SOC 2 Type II'),
  ].map((t) => [t.id, t]),
)

const ROLES: VendorRole[] = [
  {
    arenaId: 'payments',
    arenaName: 'Payments',
    canonicalVendor: 'stripe',
    defaultProductId: 'stripe',
    defaultProductName: 'Stripe',
    stepCount: 1,
    alternatives: [
      { id: 'stripe', name: 'Stripe', agentReady: 90 },
      { id: 'square', name: 'Square', agentReady: 70 },
    ],
  },
]

// Default pick (stripe) has NO judged agent surface; square has one — so the default stack
// carries a founder-hours step and the optimal stack (square) runs faster.
const ACCESS: VsAccessMap = {
  payments: {
    stripe: { mcp: 'none', cli: 'none' },
    square: { mcp: 'full', cli: 'na' },
  },
}

const PRICING: VsPricingMap = {
  payments: {
    stripe: {
      kind: 'fact',
      label: '2.9% + $0.3',
      unit: 'per transaction',
      tier: 'usage',
      amountUsd: 0.3,
      percent: 2.9,
      monthly: false,
      sourceUrl: 'https://stripe.example/pricing',
      asOf: '2026-09-01',
    },
    // square deliberately absent — a picked vendor with no extracted pricing is an honest gap.
  },
}

// Both drawable events' grounded processes are in the fixture journey (qs_021 always,
// startup_002 with cofounders) and clear their risk floors — exactly two eligible, so every
// seeded draw contains both.
const RISKS: Record<string, number> = { qs_021: 2, startup_002: 5 }

const renderIt = () =>
  render(
    <VirtualStartup
      chains={CHAINS}
      tasks={TASKS}
      roles={ROLES}
      yearCandidates={[]}
      eventExamples={[]}
      access={ACCESS}
      pricing={PRICING}
      taskRisks={RISKS}
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

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('mid-run events — simulated, grounded, decidable', () => {
  it('prints every drawn event inside the terminal with a visible SIMULATED chip and a grounded-in process link', () => {
    renderIt()
    showAll()
    const cards = screen.getAllByTestId('vs-run-event')
    expect(cards).toHaveLength(2) // both eligible fixture events
    for (const card of cards) {
      expect(within(card).getByText(/^simulated$/i)).toBeTruthy()
      expect(within(card).getByText(/grounded in:/i)).toBeTruthy()
      // The grounded process links its real process page and shows the corpus risk gate.
      const link = within(card).getByRole('link')
      expect(link.getAttribute('href')).toMatch(/\/processes\//)
      expect(within(card).getByText(/corpus risk [1-5]\/5/)).toBeTruthy()
    }
  })

  it('a wait branch discloses its named constant as a simulation assumption and advances the clock', () => {
    renderIt()
    showAll()
    fireEvent.click(screen.getByTestId('vs-event-choice-processor-review-wait'))
    const card = screen.getByTestId('vs-event-choice-processor-review-wait').closest('[data-testid="vs-run-event"]')!
    expect(within(card as HTMLElement).getByTestId('vs-event-assumption').textContent).toContain('simulation assumption')
    expect(within(card as HTMLElement).getByText(/clock \+/)).toBeTruthy()
    // The scorecard counts the decided event and its time.
    const score = screen.getByTestId('vs-scorecard')
    expect(within(score).getByText(/incl\. \+.* from event decisions/)).toBeTruthy()
    expect(within(score).getByTestId('vs-score-events').textContent).toContain('1/2 decided')
  })

  it('undecided events add no time and say so', () => {
    renderIt()
    showAll()
    const cards = screen.getAllByTestId('vs-run-event')
    for (const card of cards) expect(within(card).getByText(/undecided/)).toBeTruthy()
    expect(within(screen.getByTestId('vs-scorecard')).getByTestId('vs-score-events').textContent).toContain('0/2 decided')
  })

  it('decision changes reset decided branches (a new combo is a new run)', () => {
    renderIt()
    showAll()
    fireEvent.click(screen.getByTestId('vs-event-choice-processor-review-wait'))
    fireEvent.click(screen.getByRole('button', { name: 'Solo founder' }))
    showAll()
    // Solo drops the cofounder event; the processor event is back to undecided.
    const cards = screen.getAllByTestId('vs-run-event')
    expect(cards).toHaveLength(1)
    expect(within(cards[0]).getByText(/undecided/)).toBeTruthy()
  })
})

describe('outcome model surfaces — picks change the simulated clock, disclosed', () => {
  it('the default pick without an agent surface marks the step founder-hours (sim badge names the assumption)', () => {
    renderIt()
    showAll()
    const badge = screen.getByTestId('vs-step-outnote')
    expect(badge.getAttribute('title')).toContain('simulation assumption')
    expect(badge.textContent).toContain(`${10 * FOUNDER_HOURS_MULTIPLIER} min`)
  })

  it('the scorecard prints the stack-vs-optimal comparison line', () => {
    renderIt()
    showAll()
    const line = screen.getByTestId('vs-outcome-line')
    expect(line.textContent).toMatch(/Your stack: \d+% agent-run → launch day \d+ · agents-first optimal\s+stack: day \d+/)
  })

  it('every scorecard assumption carries the phrase "simulation assumption"', () => {
    renderIt()
    showAll()
    const list = screen.getByTestId('vs-assumptions')
    const items = within(list).getAllByRole('listitem')
    expect(items.length).toBeGreaterThan(0)
    for (const li of items) expect(li.textContent).toContain('simulation assumption')
  })

  it('persona modifiers are picked with the setup controls and disclosed as simulation assumptions', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-persona-non-technical'))
    expect(screen.getByTestId('vs-persona-assumption').textContent).toContain('simulation assumption')
  })
})

describe('simulated burn — published pricing only, cited; gaps stay gaps', () => {
  it('labels the burn as published pricing, cites the vendor pricing page per fact, and shows honest gaps', () => {
    renderIt()
    showAll()
    const burn = screen.getByTestId('vs-score-burn')
    expect(burn.textContent).toContain('published pricing')
    const cite = within(burn).getByTestId('vs-burn-cite')
    expect(cite.getAttribute('href')).toBe('https://stripe.example/pricing')
    expect(burn.textContent).toContain('as of 2026-09-01')
    // A usage rate is never blended into a monthly figure.
    expect(burn.textContent).toContain('never blended into an invented monthly figure')
  })

  it('a picked vendor with no extracted pricing renders as "no published pricing"', () => {
    // Restore a run whose payments pick is square (no pricing entry in the fixture).
    const encoded = encodeRunState({
      choices: {
        entity: 'c-corp', funding: 'seed', product: 'subscriptions', team: 'cofounders',
        ordering: 'name-first', hire: 'yes', compliance: 'now', enterprise: 'no', ph: 'yes',
      },
      preset: null,
      yc: false,
      persona: 'solo-technical',
      picks: { payments: 'square' },
      eventChoices: {},
      seed: 0,
    })
    window.history.replaceState(null, '', `/?run=${encoded}`)
    renderIt()
    showAll()
    expect(within(screen.getByTestId('vs-score-burn')).getByTestId('vs-burn-gap').textContent).toContain('no published pricing')
  })
})

describe('shareable permalink — the exact run replays from ?run=', () => {
  it('restores combo, persona, and picks from the URL (the surface-bearing pick removes the founder-hours badge)', () => {
    const encoded = encodeRunState({
      choices: {
        entity: 'llc', funding: 'bootstrap', product: 'invoices', team: 'solo',
        ordering: 'build-first', hire: 'no', compliance: 'later', enterprise: 'no', ph: 'no',
      },
      preset: null,
      yc: false,
      persona: 'second-timer',
      picks: { payments: 'square' },
      eventChoices: {},
      seed: 3,
    })
    window.history.replaceState(null, '', `/?run=${encoded}`)
    renderIt()
    expect(screen.getByRole('button', { name: 'LLC' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Bootstrap' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByTestId('vs-persona-second-timer').getAttribute('aria-pressed')).toBe('true')
    showAll()
    // square has a judged MCP surface — the payments step runs at agent speed, no sim badge.
    expect(screen.queryByTestId('vs-step-outnote')).toBeNull()
  })

  it('copy run link writes the whole state to the clipboard and the URL, and it decodes back', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderIt()
    showAll()
    fireEvent.click(screen.getByTestId('vs-event-choice-processor-review-wait'))
    fireEvent.click(screen.getByTestId('vs-copy-run-link'))
    expect(await screen.findByText('Copied ✓')).toBeTruthy()
    const url = new URL(writeText.mock.calls[0][0] as string)
    const param = url.searchParams.get('run')!
    expect(new URLSearchParams(window.location.search).get('run')).toBe(param)
    const decoded = decodeRunState(param)!
    expect(decoded.eventChoices['processor-review']).toBe('wait')
    expect(decoded.persona).toBe('solo-technical')
    expect(decoded.choices.entity).toBe('c-corp')
  })

  it('a malformed ?run= is ignored (default view, no crash)', () => {
    window.history.replaceState(null, '', '/?run=!!!garbage!!!')
    renderIt()
    expect(screen.getByRole('button', { name: 'Delaware C-Corp' }).getAttribute('aria-pressed')).toBe('true')
  })
})
