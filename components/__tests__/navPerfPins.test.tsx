// @vitest-environment jsdom
// Regression pins for the mobile navigation hang (founder ask 2026-10-01: "the site is slow to
// move around eg on mobile — if I'm on the sim and click the top bar logo it just hangs").
//
// Root cause: VirtualStartup's 240ms reveal ticker issued DEFAULT-priority setState from
// setInterval; each tick re-renders the whole sim (terminal rows + DAG + state panel) and the
// post-commit terminal pin forces layout — near the full tick budget on a phone — so the router's
// navigation TRANSITION was preempted and restarted every 240ms until the run ended. The fix set:
//   1. reveal ticks are transitions (navigation renders ahead of them),
//   2. the ticker pauses while the document is hidden and resumes on return,
//   3. the ticker is cleared on unmount (pre-existing — pinned here so it stays),
//   4. LogoWordmark arms its per-frame Julia hover loop on hover-capable devices only (on touch
//      the navigating tap fired pointerenter/focusin and the loop could run forever — the header
//      never unmounts),
//   5. HeroFractalCanvas defers its synchronous WebGL compile/first-draw behind an idle callback
//      so arriving at the homepage doesn't block its own first paint.
import fs from 'node:fs'
import path from 'node:path'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import VirtualStartup from '@/components/VirtualStartup'
import type { SimStep } from '@/lib/processSim'
import type { VirtualTaskPayload, VsChain } from '@/lib/virtualStartup'

const CADENCE_MS = 240

// Minimal fixture (same shape as VirtualStartupDrive.test.tsx): every VS chain resolved.
const step = (taskId: string, label: string): SimStep => ({
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
})

const task = (id: string, title: string): VirtualTaskPayload => ({
  id,
  title,
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  phase: 'formation',
  description: `${title} description`,
  steps: [step(id, `${title} — step 1`)],
  tops: [null],
})

const CHAINS: VsChain[] = [
  { id: 'name-the-company', name: 'Name the company', taskIds: ['brand_001'] },
  { id: 'company-launch', name: 'Company launch', taskIds: ['form_001', 'startup_002'] },
  { id: 'raise-a-seed-round', name: 'Raise a seed round', taskIds: ['fund_001'] },
  { id: 'set-up-compliance', name: 'Set up compliance (SOC 2-lite)', taskIds: ['ops_005'] },
  { id: 'ship-v1', name: 'Ship v1', taskIds: ['prod_006'] },
  { id: 'launch-website', name: 'Launch the website', taskIds: ['site_001'] },
  { id: 'get-paid', name: 'Get paid', taskIds: ['qs_021', 'growth_001', 'sales_002'] },
  { id: 'first-hire', name: 'First hire', taskIds: ['hr_001'] },
  { id: 'launch-on-product-hunt', name: 'Launch on Product Hunt', taskIds: ['growth_010'] },
  { id: 'land-the-enterprise-deal', name: 'Land the enterprise deal', taskIds: ['comp_002'] },
]

const TASKS: Record<string, VirtualTaskPayload> = Object.fromEntries(
  [
    task('brand_001', 'Generate a company name'),
    task('form_001', 'Incorporate C-Corp'),
    task('startup_002', 'Founder agreement & equity split'),
    task('fund_001', 'Raise pre-seed (SAFEs)'),
    task('ops_005', 'Set up a password manager'),
    task('prod_006', 'Set up a code hosting org'),
    task('site_001', 'Generate a website'),
    task('qs_021', 'Connect a payment processor'),
    task('growth_001', 'Set up subscription billing'),
    task('sales_002', 'Send an invoice'),
    task('hr_001', 'Hire first employee'),
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

// The terminal's printed content, minus the ▋ caret (the caret rides on `running`, so pausing
// legitimately drops it without anything having printed).
const terminalLines = () => (screen.getByTestId('vs-terminal-body').textContent ?? '').replace(/▋$/, '')

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

afterEach(() => {
  vi.useRealTimers()
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
})

describe('sim reveal ticker vs navigation (the hang fix)', () => {
  it('pauses while the document is hidden (no timers burn in the background) and resumes on return', () => {
    vi.useFakeTimers()
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
    act(() => {
      vi.advanceTimersByTime(CADENCE_MS * 4)
    })
    const printedWhileVisible = terminalLines()
    expect(printedWhileVisible.length).toBeGreaterThan(0)
    const timersWhileRunning = vi.getTimerCount()

    setVisibility('hidden')
    // The ticker is STOPPED, not merely skipped: its interval is gone (other components may
    // keep unrelated timers, so compare against the running count rather than asserting zero).
    expect(vi.getTimerCount()).toBeLessThan(timersWhileRunning)
    act(() => {
      vi.advanceTimersByTime(CADENCE_MS * 20)
    })
    expect(terminalLines()).toBe(printedWhileVisible) // nothing printed in the background

    setVisibility('visible')
    act(() => {
      vi.advanceTimersByTime(CADENCE_MS * 4)
    })
    expect(terminalLines().length).toBeGreaterThan(printedWhileVisible.length) // resumed
  })

  it('a manual ⏹ Stop stays stopped across hide/show (visibility never restarts a halted run)', () => {
    vi.useFakeTimers()
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
    act(() => {
      vi.advanceTimersByTime(CADENCE_MS * 3)
    })
    fireEvent.click(screen.getByRole('button', { name: /stop/i }))
    const stoppedAt = terminalLines()
    setVisibility('hidden')
    setVisibility('visible')
    act(() => {
      vi.advanceTimersByTime(CADENCE_MS * 10)
    })
    expect(terminalLines()).toBe(stoppedAt)
  })

  it('clears its interval on unmount — a navigation away leaves zero sim timers behind', () => {
    vi.useFakeTimers()
    const { unmount } = renderIt()
    fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
    act(() => {
      vi.advanceTimersByTime(CADENCE_MS * 3)
    })
    expect(vi.getTimerCount()).toBeGreaterThan(0) // the ticker is live mid-run
    unmount()
    expect(vi.getTimerCount()).toBe(0) // and gone with the page
  })
})

// Source pins: cheap greps over the fixed files so a refactor that silently drops one of the
// perf measures fails here with a named reason (same posture as the VsJourneyDag footprint pin).
describe('source pins for the perf measures', () => {
  const src = (p: string) => fs.readFileSync(path.resolve(__dirname, '..', '..', p), 'utf8')

  it('the reveal tick is scheduled at transition priority', () => {
    const virtualStartup = src('components/VirtualStartup.tsx')
    expect(virtualStartup).toContain('startTransition(() => setRevealed(next))')
  })

  it('LogoWordmark arms its hover fractal on hover-capable devices only', () => {
    const logo = src('components/fx/LogoWordmark.tsx')
    expect(logo).toContain("matchMedia('(hover: hover)')")
    // The gate must sit before the listeners are attached.
    expect(logo.indexOf("matchMedia('(hover: hover)')")).toBeLessThan(logo.indexOf("addEventListener('pointerenter'"))
  })

  it('HeroFractalCanvas defers its WebGL bring-up behind an idle callback', () => {
    const hero = src('components/fx/HeroFractalCanvas.tsx')
    expect(hero).toContain('requestIdleCallback')
    expect(hero).toContain('cancelIdleCallback')
  })
})
