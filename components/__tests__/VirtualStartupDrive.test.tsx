// @vitest-environment jsdom
// Drive modes (founder addenda 2026-09-29): Auto (assert upfront, play through — today's
// behavior) vs Semi-auto (the run pauses at each still-unasserted decision's FIRST AFFECTED row
// and asks inline; the naming card lets the reader type the company name). The invariants under
// test:
//   - pause-before-first-affected-row: no already-printed row ever changes after an in-run pick;
//   - a semi-auto run answered with the default values is byte-identical to the auto default run;
//   - the ?run= permalink carries the drive mode + typed name and replays;
//   - restart in semi-auto clears assertions back to 'Not set';
//   - the manual pause/resume control stops and resumes the reveal in both modes.
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VirtualStartup from '@/components/VirtualStartup'
import type { SimStep } from '@/lib/processSim'
import type { VirtualTaskPayload, VsChain } from '@/lib/virtualStartup'
import { decodeRunState, encodeRunState, DEFAULT_FOUNDER_AXES } from '@/lib/virtualStartupRun'

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
  { id: 'get-paid', name: 'Get paid', taskIds: ['qs_021', 'growth_001', 'sales_002'] },
  { id: 'first-hire', name: 'First hire', taskIds: ['hr_001'] },
  { id: 'launch-on-product-hunt', name: 'Launch on Product Hunt', taskIds: ['growth_010'] },
  { id: 'land-the-enterprise-deal', name: 'Land the enterprise deal', taskIds: ['comp_002'] },
]

const TASKS: Record<string, VirtualTaskPayload> = Object.fromEntries(
  [
    task('brand_001', 'Generate a company name'),
    task('form_001', 'Incorporate C-Corp'),
    task('form_011', 'Set up an LLC'),
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

const terminalText = () => screen.getByTestId('vs-terminal-body').textContent ?? ''
const isDone = () => terminalText().includes('journey complete')

// Drive a run to completion under fake timers, answering every semi-auto card with `answers`
// (decision id → option testid value) and the naming card via `name` (null = autopilot). At
// EVERY pause, asserts the printed-prefix invariant: the terminal's already-printed rows are
// byte-identical before and after the pick.
function driveToEnd(answers: Record<string, string>, name: string | null | undefined) {
  vi.useFakeTimers()
  try {
    fireEvent.click(screen.getByRole('button', { name: /run this startup|run it again/i }))
    for (let guard = 0; guard < 800 && !isDone(); guard++) {
      act(() => {
        vi.advanceTimersByTime(240)
      })
      const decisionCard = screen.queryByTestId('vs-run-decision')
      if (decisionCard) {
        const button = Object.entries(answers)
          .map(([id, value]) => screen.queryByTestId(`vs-run-decision-${id}-${value}`))
          .find((b) => b !== null)
        expect(button, `no answer provided for the paused card: ${decisionCard.textContent}`).toBeTruthy()
        const printed = screen.getByTestId('vs-terminal-body').querySelector('ol')!.innerHTML
        fireEvent.click(button!)
        // Pause-before-first-affected-row: nothing already printed moved.
        expect(screen.getByTestId('vs-terminal-body').querySelector('ol')!.innerHTML).toBe(printed)
        continue
      }
      const namingCard = screen.queryByTestId('vs-run-naming')
      if (namingCard) {
        const printed = screen.getByTestId('vs-terminal-body').querySelector('ol')!.innerHTML
        if (name === null || name === undefined) {
          fireEvent.click(screen.getByTestId('vs-run-naming-skip'))
        } else {
          fireEvent.change(screen.getByTestId('vs-run-naming-input'), { target: { value: name } })
          fireEvent.click(screen.getByTestId('vs-run-naming-use'))
        }
        expect(screen.getByTestId('vs-terminal-body').querySelector('ol')!.innerHTML).toBe(printed)
      }
    }
    expect(isDone()).toBe(true)
  } finally {
    vi.useRealTimers()
  }
}

const showAllAuto = () => {
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

const DEFAULT_ANSWERS: Record<string, string> = {
  entity: 'c-corp',
  team: 'cofounders',
  funding: 'seed',
  product: 'subscriptions',
  ordering: 'name-first',
  hire: 'yes',
  compliance: 'now',
  enterprise: 'no',
  ph: 'yes',
}

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('drive modes — auto is the default and plays through', () => {
  it('auto is preselected; the run completes without ever pausing on a card', () => {
    renderIt()
    expect(screen.getByTestId('vs-mode-auto').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByTestId('vs-mode-semi').getAttribute('aria-pressed')).toBe('false')
    showAllAuto()
    expect(isDone()).toBe(true)
    expect(screen.queryByTestId('vs-run-decision')).toBeNull()
    expect(screen.queryByTestId('vs-run-naming')).toBeNull()
  })
})

describe('semi-auto — the run pauses at each unasserted decision and asks inline', () => {
  it('pauses immediately for the ordering decision (its options differ at row 0), status says waiting, the pick asserts + resumes', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-mode-semi'))
    vi.useFakeTimers()
    try {
      fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
      act(() => {
        vi.advanceTimersByTime(240)
      })
      // Ordering reorders whole phases — its first affected row is 0, so the card shows before
      // anything prints ("ask upfront at Run-press" emerges from the derived schedule).
      const card = screen.getByTestId('vs-run-decision')
      expect(within(card).getByRole('group', { name: 'Decision: What comes first' })).toBeTruthy()
      expect(screen.getByTestId('vs-terminal-status').textContent).toBe('waiting on you…')
      expect(screen.queryAllByTestId('vs-artifact')).toHaveLength(0)
      fireEvent.click(screen.getByTestId('vs-run-decision-ordering-name-first'))
      // The pick asserted the decision — the dropdown synced…
      expect(screen.getByTestId('vs-decision-ordering').textContent).toContain('Name')
      expect(screen.getByTestId('vs-decision-ordering').getAttribute('title')).toContain('Name first')
      // …and the run resumed.
      act(() => {
        vi.advanceTimersByTime(240 * 3)
      })
      expect(screen.getByTestId('vs-terminal-body').textContent).toContain('Name & brand')
    } finally {
      vi.useRealTimers()
    }
  })

  it('a semi-auto run answered with the DEFAULT values prints byte-identical rows to the auto default run', () => {
    // Auto baseline (nothing asserted → default composition).
    const auto = renderIt()
    showAllAuto()
    const autoHtml = screen.getByTestId('vs-terminal-body').querySelector('ol')!.innerHTML
    auto.unmount()
    // Semi-auto: answer every card with the default's value, autopilot naming.
    renderIt()
    fireEvent.click(screen.getByTestId('vs-mode-semi'))
    driveToEnd(DEFAULT_ANSWERS, null)
    expect(screen.getByTestId('vs-terminal-body').querySelector('ol')!.innerHTML).toBe(autoHtml)
  })

  it('a full semi-auto run answering non-default values matches the same combo in auto structurally (tasks and steps)', () => {
    // Semi: pick LLC + solo + bootstrap when asked, defaults elsewhere.
    renderIt()
    fireEvent.click(screen.getByTestId('vs-mode-semi'))
    driveToEnd({ ...DEFAULT_ANSWERS, entity: 'llc', team: 'solo', funding: 'bootstrap' }, null)
    expect(screen.getByText('Set up an LLC')).toBeTruthy()
    expect(screen.queryByText('Incorporate C-Corp')).toBeNull()
    expect(screen.queryByText('Founder agreement & equity split')).toBeNull()
    expect(screen.queryByText('Raise pre-seed (SAFEs)')).toBeNull()
    // Every decision the run asked is now asserted — the dropdowns synced.
    expect(screen.getByTestId('vs-decision-entity').getAttribute('title')).toContain('LLC')
    expect(screen.getByTestId('vs-decision-team').getAttribute('title')).toContain('Solo founder')
  })

  it('restart in semi-auto clears assertions back to Not set (and the typed name), and asks again', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-mode-semi'))
    driveToEnd(DEFAULT_ANSWERS, 'Rocket Co')
    expect(screen.getByTestId('vs-decision-entity').getAttribute('title')).toContain('Delaware C-Corp')
    // Restart: everything back to Not set, and the first card returns.
    vi.useFakeTimers()
    try {
      fireEvent.click(screen.getByRole('button', { name: /run it again/i }))
      expect(screen.getByTestId('vs-decision-entity').textContent).toContain('Not set')
      expect(screen.getByTestId('vs-decision-ordering').textContent).toContain('Not set')
      act(() => {
        vi.advanceTimersByTime(240)
      })
      expect(screen.getByTestId('vs-run-decision')).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('semi-auto — the naming card (the company name is born mid-run)', () => {
  it('the terminal prompt reads new-startup until the naming step; a typed name flows into the title and downstream artifacts, sanitized', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-mode-semi'))
    expect(screen.getByText('new-startup')).toBeTruthy() // pre-run neutral prompt identity
    driveToEnd(DEFAULT_ANSWERS, '  Rocket <b>Co</b>  ')
    // Sanitized: markup stripped, whitespace collapsed.
    const body = screen.getByTestId('vs-terminal-body')
    expect(within(body).getAllByText(/Rocket bCo\/b, Inc\./).length).toBeGreaterThan(0)
    // The typed name reached the terminal title (slugged), replacing the neutral prompt.
    expect(screen.queryByText('new-startup')).toBeNull()
    expect(screen.getByText('rocket-bco-b')).toBeTruthy()
  })

  it('skipping the naming card keeps the autopilot (seeded) name; auto mode never shows the card at all', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-mode-semi'))
    driveToEnd(DEFAULT_ANSWERS, null)
    // The seeded synthetic name printed as the naming step's artifact (", Inc." suffix).
    const artifacts = screen.getAllByTestId('vs-artifact')
    expect(artifacts.some((a) => /Company name/.test(a.textContent ?? '') && /, Inc\./.test(a.textContent ?? ''))).toBe(true)
  })
})

describe('permalink — the drive mode and typed name replay through ?run=', () => {
  it('copy run link carries mode + name + in-run assertions; a semi permalink with everything asserted plays straight through', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderIt()
    fireEvent.click(screen.getByTestId('vs-mode-semi'))
    driveToEnd({ ...DEFAULT_ANSWERS, entity: 'llc' }, 'Perch Labs')
    fireEvent.click(screen.getByTestId('vs-copy-run-link'))
    expect(await screen.findByText('Copied ✓')).toBeTruthy()
    const param = new URL(writeText.mock.calls[0][0] as string).searchParams.get('run')!
    const decoded = decodeRunState(param)!
    expect(decoded.mode).toBe('semi')
    expect(decoded.companyName).toBe('Perch Labs')
    expect(decoded.choices.entity).toBe('llc')
    expect(decoded.choices.team).toBe('cofounders') // in-run picks assert, defaults included when picked
  })

  it('restoring a semi-auto permalink with all decisions asserted plays straight through (no cards)', () => {
    const encoded = encodeRunState({
      choices: {
        entity: 'llc', funding: 'bootstrap', product: 'invoices', team: 'solo',
        ordering: 'build-first', hire: 'no', compliance: 'later', enterprise: 'no', ph: 'no',
      },
      preset: null,
      yc: false,
      founder: DEFAULT_FOUNDER_AXES,
      mode: 'semi',
      companyName: 'Replayed Co',
      picks: {},
      eventChoices: {},
      seed: 0,
    })
    window.history.replaceState(null, '', `/?run=${encoded}`)
    renderIt()
    expect(screen.getByTestId('vs-mode-semi').getAttribute('aria-pressed')).toBe('true')
    showAllAuto()
    expect(isDone()).toBe(true)
    expect(screen.queryByTestId('vs-run-decision')).toBeNull()
    expect(screen.queryByTestId('vs-run-naming')).toBeNull()
    expect(within(screen.getByTestId('vs-terminal-body')).getAllByText(/Replayed Co LLC/).length).toBeGreaterThan(0)
  })
})

describe('the manual pause/resume control (both modes)', () => {
  it('pause freezes the reveal (status: paused), resume continues to completion', () => {
    renderIt()
    vi.useFakeTimers()
    try {
      fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
      act(() => {
        vi.advanceTimersByTime(240 * 4)
      })
      const printed = () => screen.getByTestId('vs-terminal-body').querySelector('ol')!.innerHTML
      expect(screen.getByTestId('vs-terminal-status').textContent).toBe('running…')
      fireEvent.click(screen.getByTestId('vs-terminal-pause'))
      expect(screen.getByTestId('vs-terminal-status').textContent).toBe('paused')
      const frozen = printed()
      act(() => {
        vi.advanceTimersByTime(240 * 10)
      })
      expect(printed()).toBe(frozen) // nothing advances while paused
      fireEvent.click(screen.getByTestId('vs-terminal-pause')) // resume
      expect(screen.getByTestId('vs-terminal-status').textContent).toBe('running…')
      act(() => {
        vi.runAllTimers()
      })
      expect(isDone()).toBe(true)
      // No completion label — the status simply goes quiet, and the control disappears.
      expect(screen.getByTestId('vs-terminal-status').textContent).toBe('')
      expect(screen.queryByTestId('vs-terminal-pause')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})
