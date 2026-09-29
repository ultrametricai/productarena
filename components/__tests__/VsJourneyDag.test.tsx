// @vitest-environment jsdom
// VsJourneyDag — the journey DAG viewer (founder ask 2026-09-29; round-4 rework: taller, no
// horizontal scroll, reveal-on-reach + zoom-out fit). What must hold:
//   - the strip has NO timers of its own — everything derives from the shared rows/revealed state;
//   - REVEAL-ON-REACH: pre-run ONLY the first node renders (dim); upcoming nodes are NOT shown —
//     each appears when the reveal reaches its task row, so visible count == reached count;
//   - NO horizontal scroll: the row is w-full flex (no overflow-x, no w-max) — clusters/nodes
//     flex-shrink to fit, the zoom TIER steps chrome down as nodes accumulate (titles hide below
//     the md tier for non-active nodes; icons and aria-labels stay), and the ACTIVE node keeps
//     full size (data-dag-size="full") with its pulse;
//   - nodes light progressively as the terminal reveal passes them (pending → active → done),
//     with exactly the node whose rows are printing carrying the active state;
//   - seeded mid-run events and semi-auto pauses render as diamond markers attached under the
//     node whose terminal region carries them (the awaited pause pulses);
//   - clicking a node asks the parent to scroll the terminal to that process's first row (smoke);
//   - a semi-auto recomposition redraws only the unrevealed tail — every already-lit node keeps
//     its identity and order across each in-run decision pick.
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VirtualStartup from '@/components/VirtualStartup'
import VsJourneyDag, {
  activeDagTaskId,
  dagNodeReached,
  dagNodeState,
  dagTierShowsTitle,
  dagVisibleTaskIds,
  dagZoomTier,
  deriveJourneyDag,
  type VsDagSourceRow,
} from '@/components/VsJourneyDag'
import type { SimStep } from '@/lib/processSim'
import type { SyntheticArtifact, TopVendorPick, VirtualTaskPayload, VsChain } from '@/lib/virtualStartup'

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

// ---------------------------------------------------------------------------
// Unit level: the pure derivation over a hand-built row list.
// ---------------------------------------------------------------------------

const TOP: TopVendorPick = { productId: 'best-legal', name: 'Best Legal', score: 82.5, arenaId: 'legal-ops', arenaName: 'Legal ops' }
const ARTIFACT: SyntheticArtifact = { taskId: 'form_001', label: 'EIN', value: '00-0000000', simulated: true }

const taskA = task('form_001', 'Incorporate C-Corp', {
  steps: [step('form_001', 'file it', { route: 'form' }), step('form_001', 'wait for it', { route: 'person' })],
  tops: [TOP, null],
})
const taskB = task('site_001', 'Generate a website')

// 0 phase · 1 task A · 2 step (top) · 3 step · 4 artifact · 5 event · 6 phase · 7 task B · 8 step
const UNIT_ROWS: VsDagSourceRow[] = [
  { kind: 'phase', key: 'phase-form', title: 'Form the company', chainId: 'company-launch', chainName: 'Company launch', note: null },
  { kind: 'task', key: 'task-form_001', task: taskA },
  { kind: 'step', key: 'step-form_001-0', step: taskA.steps[0], top: TOP, outNote: null, outMinutes: 10 },
  { kind: 'step', key: 'step-form_001-1', step: taskA.steps[1], top: null, outNote: null, outMinutes: 10 },
  { kind: 'artifact', key: 'artifact-form_001-0', artifact: ARTIFACT },
  { kind: 'vsevent', key: 'vsevent-ev1', eventId: 'ev1', day: 2 },
  { kind: 'phase', key: 'phase-website', title: 'Launch the website', chainId: 'launch-website', chainName: 'Launch website', note: null },
  { kind: 'task', key: 'task-site_001', task: taskB },
  { kind: 'step', key: 'step-site_001-0', step: taskB.steps[0], top: null, outNote: null, outMinutes: 10 },
]

describe('deriveJourneyDag — pure derivation', () => {
  it('builds one node per process with its row span, phase cluster, and first top pick', () => {
    const { clusters, markers } = deriveJourneyDag(UNIT_ROWS)
    expect(clusters.map((c) => c.title)).toEqual(['Form the company', 'Launch the website'])
    expect(clusters[0].chainId).toBe('company-launch')
    const [a] = clusters[0].nodes
    const [b] = clusters[1].nodes
    expect(a).toMatchObject({ taskId: 'form_001', rowStart: 1, rowEnd: 5, stepCount: 2, agentSteps: 0 })
    expect(a.vendor).toEqual({ productId: 'best-legal', name: 'Best Legal', hasLogo: false })
    expect(a.vendorRow).toBe(2)
    expect(b).toMatchObject({ taskId: 'site_001', rowStart: 7, rowEnd: 8, agentSteps: 1 })
    // The event marker attaches under the node whose terminal region carries it.
    expect(markers).toEqual([{ kind: 'event', key: 'event-ev1', id: 'ev1', day: 2, taskId: 'form_001', at: 5 }])
  })

  it('attaches pause markers to the node containing the pause row; a Run-press pause (at 0) floats before the first node', () => {
    const { markers } = deriveJourneyDag(UNIT_ROWS, [
      { id: 'ordering', at: 0, label: 'What comes first' },
      { id: 'hire', at: 7, label: 'First hire' },
    ])
    const pauses = markers.filter((m) => m.kind === 'pause')
    expect(pauses).toEqual([
      { kind: 'pause', key: 'pause-ordering', id: 'ordering', day: null, taskId: null, at: 0 },
      { kind: 'pause', key: 'pause-hire', id: 'hire', day: null, taskId: 'site_001', at: 7 },
    ])
  })

  it('derives node state from the shared reveal counter (active = the node whose rows are printing)', () => {
    const { clusters } = deriveJourneyDag(UNIT_ROWS)
    const [a] = clusters[0].nodes
    const [b] = clusters[1].nodes
    expect(dagNodeState(a, 0)).toBe('pending')
    expect(dagNodeState(a, 2)).toBe('active') // its task row printed, steps still printing
    expect(dagNodeState(a, 6)).toBe('done') // every row under it printed
    expect(dagNodeState(b, 6)).toBe('pending')
    expect(activeDagTaskId(clusters, 2)).toBe('form_001')
    expect(activeDagTaskId(clusters, 8)).toBe('site_001')
    expect(activeDagTaskId(clusters, UNIT_ROWS.length)).toBe(null) // run complete — nothing active
  })

  it('reveal-on-reach (round 4): a node is visible once the reveal reaches its task row; pre-run only the FIRST node shows', () => {
    const { clusters } = deriveJourneyDag(UNIT_ROWS)
    const [a] = clusters[0].nodes
    const [b] = clusters[1].nodes
    expect(dagNodeReached(a, 0)).toBe(false)
    expect(dagNodeReached(a, 1)).toBe(true) // its task row is the next to print — the cluster started
    expect(dagNodeReached(b, 6)).toBe(false) // upcoming — never shown early
    expect(dagNodeReached(b, 7)).toBe(true)
    // Pre-run fallback: nothing reached → exactly the journey's first node, dim.
    expect(dagVisibleTaskIds(clusters, 0)).toEqual(new Set(['form_001']))
    expect(dagVisibleTaskIds(clusters, 2)).toEqual(new Set(['form_001']))
    expect(dagVisibleTaskIds(clusters, 7)).toEqual(new Set(['form_001', 'site_001']))
    expect(dagVisibleTaskIds(clusters, UNIT_ROWS.length)).toEqual(new Set(['form_001', 'site_001']))
  })

  it('zoom tiers step down with the visible count; titles hide below md (icons stay)', () => {
    expect(dagZoomTier(1)).toBe('xl')
    expect(dagZoomTier(5)).toBe('xl')
    expect(dagZoomTier(6)).toBe('md')
    expect(dagZoomTier(9)).toBe('md')
    expect(dagZoomTier(10)).toBe('sm')
    expect(dagZoomTier(14)).toBe('sm')
    expect(dagZoomTier(15)).toBe('xs')
    expect(dagTierShowsTitle('xl')).toBe(true)
    expect(dagTierShowsTitle('md')).toBe(true)
    expect(dagTierShowsTitle('sm')).toBe(false)
    expect(dagTierShowsTitle('xs')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Component level: rendering states, markers, vendor dot, click wiring, no own timers.
// ---------------------------------------------------------------------------

describe('VsJourneyDag — rendering', () => {
  it('pre-run renders ONLY the first node, dim, and never starts a reveal clock of its own', () => {
    // No interval, ever — the strip only derives from rows/revealed (React itself may schedule
    // setTimeout work, so the interval primitive is the attributable assertion; the integration
    // suite below additionally proves the strip stays frozen while the shared ticker is stopped).
    const spy = vi.spyOn(window, 'setInterval')
    try {
      render(<VsJourneyDag rows={UNIT_ROWS} revealed={0} running={false} />)
      expect(spy).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
    // Reveal-on-reach (round 4): upcoming nodes are NOT shown — only the journey's first node,
    // dim (pending); the upcoming cluster doesn't render either.
    const nodes = screen.getByTestId('vs-journeydag').querySelectorAll('[data-testid^="vs-dag-node-"]')
    expect(nodes.length).toBe(1)
    expect(screen.getByTestId('vs-dag-node-form_001').getAttribute('data-dag-state')).toBe('pending')
    expect(screen.queryByTestId('vs-dag-node-site_001')).toBeNull()
    expect(screen.getAllByTestId('vs-dag-cluster')).toHaveLength(1)
    // No vendor dots yet; the first node's event marker is present but dim.
    expect(screen.queryByTestId('vs-dag-vendor-best-legal')).toBeNull()
    expect(screen.getByTestId('vs-dag-marker-event').className).toContain('fuchsia-400/30')
  })

  it('lights nodes with the reveal: active pulses emerald at FULL size, done fills; upcoming stays hidden; the vendor logo dot attaches once its step printed', () => {
    const { rerender } = render(<VsJourneyDag rows={UNIT_ROWS} revealed={2} running />)
    const activeNode = screen.getByTestId('vs-dag-node-form_001')
    expect(activeNode.getAttribute('data-dag-state')).toBe('active')
    expect(activeNode.getAttribute('data-dag-size')).toBe('full') // the active node keeps full size
    expect(activeNode.className).toContain('emerald')
    expect(screen.queryByTestId('vs-dag-node-site_001')).toBeNull() // upcoming — not reached yet
    expect(screen.queryByTestId('vs-dag-vendor-best-legal')).toBeNull() // top-pick step not printed yet
    rerender(<VsJourneyDag rows={UNIT_ROWS} revealed={6} running />)
    expect(screen.getByTestId('vs-dag-node-form_001').getAttribute('data-dag-state')).toBe('done')
    expect(screen.queryByTestId('vs-dag-node-site_001')).toBeNull() // still one row short of reached
    expect(screen.getByTestId('vs-dag-vendor-best-legal')).toBeTruthy()
    expect(screen.getByTestId('vs-dag-marker-event').className).toContain('fuchsia-400/90') // event revealed
    rerender(<VsJourneyDag rows={UNIT_ROWS} revealed={8} running />)
    expect(screen.getByTestId('vs-dag-node-site_001').getAttribute('data-dag-state')).toBe('active')
  })

  it('zoom-fit invariants: no horizontal scroll (w-full row, no overflow-x), non-active nodes flex-shrink, visible == reached', () => {
    for (const revealed of [0, 2, 6, 8, UNIT_ROWS.length]) {
      const view = render(<VsJourneyDag rows={UNIT_ROWS} revealed={revealed} running={false} />)
      const strip = screen.getByTestId('vs-journeydag-strip')
      expect(strip.className).not.toContain('overflow-x') // the viewer never scrolls sideways
      const row = strip.querySelector('ol')!
      expect(row.className).toContain('w-full') // …because the row always fits the container
      expect(row.className).not.toContain('w-max')
      const nodes = Array.from(strip.querySelectorAll<HTMLElement>('[data-testid^="vs-dag-node-"]'))
      // Visible node count == reached count (pre-run: the single dim first node).
      const { clusters } = deriveJourneyDag(UNIT_ROWS)
      const reached = dagVisibleTaskIds(clusters, revealed)
      expect(nodes.length).toBe(reached.size)
      for (const n of nodes) {
        if (n.getAttribute('data-dag-size') === 'full') continue // the active node is flex-none
        // Every non-active node sits in a shrinkable flex cell — the fit mechanism.
        expect(n.parentElement!.parentElement!.className).toContain('flex-1')
        expect(n.parentElement!.parentElement!.className).toContain('min-w-0')
      }
      view.unmount()
    }
  })

  it('at compressed tiers the non-active titles hide (icons + aria-labels stay); the active node keeps its title', () => {
    // A 12-node journey (one cluster per node) pushes the tier to 'sm' once traversed.
    const many: VsDagSourceRow[] = []
    for (let i = 0; i < 12; i++) {
      const t = task(`task_${i}`, `Process ${i}`)
      many.push({ kind: 'phase', key: `phase-${i}`, title: `Phase ${i}`, chainId: 'ship-v1', chainName: 'Ship v1', note: null })
      many.push({ kind: 'task', key: `task-task_${i}`, task: t })
      many.push({ kind: 'step', key: `step-task_${i}-0`, step: t.steps[0], top: null, outNote: null, outMinutes: 10 })
    }
    // Reveal into the LAST node's span: 11 done + 1 active = 12 visible → tier 'sm'.
    render(<VsJourneyDag rows={many} revealed={many.length - 1} running />)
    expect(screen.getByTestId('vs-journeydag').getAttribute('data-dag-tier')).toBe('sm')
    const active = screen.getByTestId('vs-dag-node-task_11')
    expect(active.getAttribute('data-dag-state')).toBe('active')
    expect(active.getAttribute('data-dag-size')).toBe('full')
    expect(active.textContent).toContain('Process 11') // the active node stays legible
    const done = screen.getByTestId('vs-dag-node-task_3')
    expect(done.textContent).not.toContain('Process 3') // compressed: title hidden…
    expect(done.getAttribute('aria-label')).toBe('Process 3') // …accessible name stays
    expect(done.querySelector('[aria-hidden]')).toBeTruthy() // …and the icon stays
  })

  it('renders pause diamonds and pulses the one the run is waiting on', () => {
    render(
      <VsJourneyDag
        rows={UNIT_ROWS}
        revealed={7}
        running={false}
        waitingOn="hire"
        pauses={[{ id: 'hire', at: 7, label: 'First hire' }]}
      />,
    )
    const marker = screen.getByTestId('vs-dag-marker-pause')
    expect(marker.getAttribute('data-marker-id')).toBe('hire')
    expect(marker.getAttribute('data-marker-active')).toBe('true')
    expect(marker.className).toContain('animate-pulse')
  })

  it('node click calls onNodeClick with the process id (the parent scrolls the terminal)', () => {
    const onNodeClick = vi.fn()
    render(<VsJourneyDag rows={UNIT_ROWS} revealed={UNIT_ROWS.length} running={false} onNodeClick={onNodeClick} />)
    fireEvent.click(screen.getByTestId('vs-dag-node-site_001'))
    expect(onNodeClick).toHaveBeenCalledWith('site_001')
    // The secondary ↗ links the real process page.
    expect(screen.getByTestId('vs-dag-open-site_001').getAttribute('href')).toContain('/processes/generate-a-website')
  })
})

// ---------------------------------------------------------------------------
// Integration level: the strip inside VirtualStartup, driven by the REAL reveal ticker.
// ---------------------------------------------------------------------------

// journeyPhases resolves every VS_CHAIN_IDS chain, so the fixture must cover all ten (the same
// convention as components/__tests__/VirtualStartup.test.tsx).
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
      steps: [step('form_001', 'Submit incorporation filing', { route: 'form' }), step('form_001', 'Receive certificate', { route: 'person' })],
      tops: [TOP, null],
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
    />,
  )

const dagNodes = () => Array.from(screen.getByTestId('vs-journeydag').querySelectorAll('[data-testid^="vs-dag-node-"]'))
const dagStates = () => dagNodes().map((n) => n.getAttribute('data-dag-state'))
const litIds = () =>
  dagNodes()
    .filter((n) => n.getAttribute('data-dag-state') !== 'pending')
    .map((n) => n.getAttribute('data-testid'))
const isDone = () => (screen.getByTestId('vs-terminal-body').textContent ?? '').includes('journey complete')

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('VsJourneyDag inside VirtualStartup — the live viewer above the terminal', () => {
  it('pre-run: ONLY the first node renders, dim, above the terminal (upcoming nodes hidden — reveal-on-reach)', () => {
    renderIt()
    // The strip precedes the terminal in document order — it sits on top of the output.
    const strip = screen.getByTestId('vs-journeydag')
    const term = screen.getByTestId('vs-terminal')
    expect(strip.compareDocumentPosition(term) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(dagNodes().length).toBe(1) // the journey's first node only — nothing upcoming shows
    expect(new Set(dagStates())).toEqual(new Set(['pending']))
    // The taller, never-scrolling viewer (round 4): fixed height classes, no overflow-x.
    const body = screen.getByTestId('vs-journeydag-strip')
    expect(body.className).toContain('h-[140px]')
    expect(body.className).toContain('sm:h-[200px]')
    expect(body.className).not.toContain('overflow-x')
  })

  it('reveals + lights progressively with the terminal reveal (never its own timers): visible == traversed, at most one active, whole journey fitted at completion', () => {
    renderIt()
    vi.useFakeTimers()
    try {
      fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
      act(() => {
        vi.advanceTimersByTime(240 * 8)
      })
      const mid = dagStates()
      expect(mid.filter((s) => s === 'done').length).toBeGreaterThan(0)
      expect(mid.filter((s) => s === 'active').length).toBeLessThanOrEqual(1)
      // Reveal-on-reach mid-run: every visible node has been reached (at most the one just
      // reached is still pending), and the upcoming tail is NOT rendered yet.
      expect(mid.filter((s) => s === 'pending').length).toBeLessThanOrEqual(1)
      expect(mid.length).toBeLessThan(13)
      // With the ticker stopped, nothing advances (nothing new appears) — no clock of its own.
      const frozen = dagStates()
      fireEvent.click(screen.getByRole('button', { name: /stop/i }))
      act(() => {
        vi.advanceTimersByTime(240 * 20)
      })
      expect(dagStates()).toEqual(frozen)
      fireEvent.click(screen.getByRole('button', { name: /run this startup|run it again/i }))
      act(() => {
        vi.runAllTimers()
      })
      // Completed run: the WHOLE traversed journey is visible and fitted — all 13 nodes done.
      expect(dagStates()).toHaveLength(13)
      expect(new Set(dagStates())).toEqual(new Set(['done']))
    } finally {
      vi.useRealTimers()
    }
  })

  it('click-to-scroll smoke: a lit node click targets the terminal row and unpins the follow (no crash, no navigation)', () => {
    renderIt()
    vi.useFakeTimers()
    try {
      fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
      act(() => {
        vi.runAllTimers()
      })
    } finally {
      vi.useRealTimers()
    }
    // The terminal row the click scrolls to exists and is addressable.
    expect(screen.getByTestId('vs-terminal-body').querySelector('[data-vs-row="task-brand_001"]')).toBeTruthy()
    fireEvent.click(screen.getByTestId('vs-dag-node-brand_001'))
    expect(screen.getByTestId('vs-terminal')).toBeTruthy() // still here — no navigation, no crash
  })

  it('semi-auto: pause markers render for unasserted decisions, and each in-run pick redraws ONLY the unrevealed tail (lit nodes keep identity and order)', () => {
    renderIt()
    // Entity is DEFAULT-ASSERTED (founder round 4, item 5) — clear it back to Not set so the
    // run asks it in-run like the other decisions this test answers.
    fireEvent.click(screen.getByTestId('vs-decision-entity'))
    fireEvent.click(screen.getByTestId('vs-decision-entity-notset'))
    fireEvent.click(screen.getByTestId('vs-mode-semi'))
    // Every unasserted decision (plus the naming card) is a diamond on the strip before the run.
    expect(screen.getAllByTestId('vs-dag-marker-pause').length).toBeGreaterThan(0)
    const answers: Record<string, string> = {
      entity: 'llc',
      team: 'solo',
      funding: 'seed',
      product: 'invoices',
      ordering: 'build-first',
      hire: 'yes',
      compliance: 'later',
      enterprise: 'yes',
      ph: 'no',
    }
    vi.useFakeTimers()
    try {
      fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
      for (let guard = 0; guard < 800 && !isDone(); guard++) {
        act(() => {
          vi.advanceTimersByTime(240)
        })
        const decisionCard = screen.queryByTestId('vs-run-decision')
        if (decisionCard) {
          const button = Object.entries(answers)
            .map(([id, value]) => screen.queryByTestId(`vs-run-decision-${id}-${value}`))
            .find((b) => b !== null)
          expect(button, `no answer for the paused card: ${decisionCard.textContent}`).toBeTruthy()
          const litBefore = litIds()
          fireEvent.click(button!)
          // Only the unrevealed tail recomposed — every already-lit node kept its place.
          expect(litIds()).toEqual(litBefore)
          continue
        }
        if (screen.queryByTestId('vs-run-naming')) {
          const litBefore = litIds()
          fireEvent.click(screen.getByTestId('vs-run-naming-skip'))
          expect(litIds()).toEqual(litBefore)
        }
      }
      expect(isDone()).toBe(true)
    } finally {
      vi.useRealTimers()
    }
    // The picked branches redrew the tail: LLC swapped in, the enterprise phase appended, the
    // subscriptions/PH branches dropped — and everything ended done.
    expect(screen.getByTestId('vs-dag-node-form_011')).toBeTruthy()
    expect(screen.getByTestId('vs-dag-node-comp_002')).toBeTruthy()
    expect(screen.queryByTestId('vs-dag-node-growth_001')).toBeNull()
    expect(screen.queryByTestId('vs-dag-node-growth_010')).toBeNull()
    expect(new Set(dagStates())).toEqual(new Set(['done']))
    // Answered decisions' pause markers are gone — nothing left to wait on.
    expect(screen.queryByTestId('vs-dag-marker-pause')).toBeNull()
  })
})
