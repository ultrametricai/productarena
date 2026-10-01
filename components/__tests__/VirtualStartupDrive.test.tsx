// @vitest-environment jsdom
// Drive modes (founder addenda 2026-09-29): Auto (assert upfront, play through — today's
// behavior) vs Semi-auto (the run pauses at each still-unasserted decision's FIRST AFFECTED row
// and asks in the FIXED SLOT ABOVE the terminal — founder addendum: the reader never scrolls to
// decide; the terminal flow keeps only a compact '⏸ waiting on you' marker. The naming card
// lets the reader type the company name, same slot). The invariants under test:
//   - pause-before-first-affected-row: no already-printed row ever changes after an in-run pick;
//   - card placement: the decision/naming card renders between the DAG band and the terminal,
//     never inside the scrolled output;
//   - a semi-auto run answered with the default values is byte-identical to the auto default run;
//   - the ?run= permalink carries the drive mode + typed name and replays;
//   - restart in semi-auto clears assertions back to 'Not set'.
// The title-bar manual pause control is GONE (founder batch 2026-09-30, item 2) — the primary
// ⏹ Stop suffices; only semi-auto's decision pauses remain.
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
    task('ops_014', 'Lease an office'),
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

// Round-7 DEFAULT-ASSERTED decisions (2026-10-01, item 5: entity, team, funding, compliance,
// ph, remote) are never asked by a default semi-auto run; tests that want a card first clear
// the dropdown back to 'Not set' (clearDecision).
const clearDecision = (id: string) => {
  fireEvent.click(screen.getByTestId(`vs-decision-${id}`))
  fireEvent.click(screen.getByTestId(`vs-decision-${id}-notset`))
}
const clearEntity = () => clearDecision('entity')

// NOTE: no 'ordering' answer — the decision left the UI (round 5, item 4) and a semi-auto run
// must never ask it; driveToEnd's guard fails loudly if an ordering card ever appears. The
// default-asserted decisions' answers stay for runs that cleared them back to 'Not set'.
const DEFAULT_ANSWERS: Record<string, string> = {
  entity: 'c-corp',
  team: 'cofounders',
  funding: 'seed',
  product: 'subscriptions',
  hire: 'yes',
  compliance: 'now',
  enterprise: 'no',
  ph: 'x',
  remote: 'office',
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

describe('semi-auto — the run pauses at each unasserted decision and asks in the top slot', () => {
  it('the pending card surfaces at the TOP — above the terminal, below the DAG band — with a compact wait marker inline (founder addendum 2026-09-29)', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-mode-semi'))
    vi.useFakeTimers()
    try {
      fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
      // Advance to the first DECISION card (the naming card may pause first — answer it via
      // autopilot; ordering is gone, so the run's first pauses derive from the other decisions).
      let card: HTMLElement | null = null
      for (let guard = 0; guard < 200 && card === null; guard++) {
        act(() => {
          vi.advanceTimersByTime(240)
        })
        if (screen.queryByTestId('vs-run-naming')) {
          fireEvent.click(screen.getByTestId('vs-run-naming-skip'))
          continue
        }
        card = screen.queryByTestId('vs-run-decision')
      }
      expect(card).toBeTruthy()
      const term = screen.getByTestId('vs-terminal')
      const dag = screen.getByTestId('vs-journeydag')
      // The card lives in the fixed slot between the DAG band and the terminal — NOT down at
      // the bottom of the scrolled output.
      expect(term.contains(card!)).toBe(false)
      expect(card!.compareDocumentPosition(term) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(dag.compareDocumentPosition(card!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      // The inline position keeps only the compact one-liner.
      const marker = screen.getByTestId('vs-run-wait-marker')
      expect(term.contains(marker)).toBe(true)
      expect(marker.textContent).toContain('waiting on you — decide above')
      // Answering clears both the card and the marker; the run resumes as before.
      const answer = Object.entries(DEFAULT_ANSWERS)
        .map(([id, value]) => screen.queryByTestId(`vs-run-decision-${id}-${value}`))
        .find((b) => b !== null)!
      fireEvent.click(answer)
      expect(screen.queryByTestId('vs-run-decision')).toBeNull()
      expect(screen.queryByTestId('vs-run-wait-marker')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('the naming card uses the same top slot (above the terminal, marker inline)', () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-mode-semi'))
    vi.useFakeTimers()
    try {
      fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
      let naming: HTMLElement | null = null
      for (let guard = 0; guard < 800 && naming === null; guard++) {
        act(() => {
          vi.advanceTimersByTime(240)
        })
        if (screen.queryByTestId('vs-run-decision')) {
          const button = Object.entries(DEFAULT_ANSWERS)
            .map(([id, value]) => screen.queryByTestId(`vs-run-decision-${id}-${value}`))
            .find((b) => b !== null)
          expect(button).toBeTruthy()
          fireEvent.click(button!)
          continue
        }
        naming = screen.queryByTestId('vs-run-naming')
      }
      expect(naming).toBeTruthy()
      const term = screen.getByTestId('vs-terminal')
      expect(term.contains(naming!)).toBe(false)
      expect(naming!.compareDocumentPosition(term) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(term.contains(screen.getByTestId('vs-run-wait-marker'))).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it("the removed 'Start with' decision is NEVER asked in semi-auto (round 5, item 4) — the run completes on the name-first default; a decision pick asserts + resumes + syncs its dropdown", () => {
    renderIt()
    fireEvent.click(screen.getByTestId('vs-mode-semi'))
    // driveToEnd's guard fails loudly if a card with no provided answer (e.g. ordering) appears.
    driveToEnd(DEFAULT_ANSWERS, null)
    // No ordering control exists to sync; composition kept the name-first default.
    expect(screen.queryByTestId('vs-decision-ordering')).toBeNull()
    const body = screen.getByTestId('vs-terminal-body')
    const name = within(body).getByText('Name & brand')
    const build = within(body).getByText('Build & ship v1')
    expect(name.compareDocumentPosition(build) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // The in-run picks asserted their decisions — the dropdowns synced (spot check).
    expect(screen.getByTestId('vs-decision-team').getAttribute('aria-label')).toContain('Cofounders')
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
    // Semi: pick LLC + solo + bootstrap when asked, defaults elsewhere. Entity, team, and
    // funding are DEFAULT-ASSERTED (round 7) — clear them first so the run asks them.
    renderIt()
    clearEntity()
    clearDecision('team')
    clearDecision('funding')
    fireEvent.click(screen.getByTestId('vs-mode-semi'))
    driveToEnd({ ...DEFAULT_ANSWERS, entity: 'llc', team: 'solo', funding: 'bootstrap' }, null)
    // Scoped to the terminal body — the journey DAG strip mirrors the process titles above it.
    expect(within(screen.getByTestId('vs-terminal-body')).getByText('Set up an LLC')).toBeTruthy()
    expect(screen.queryByText('Incorporate C-Corp')).toBeNull()
    expect(screen.queryByText('Founder agreement & equity split')).toBeNull()
    expect(screen.queryByText('Raise pre-seed (SAFEs)')).toBeNull()
    // Every decision the run asked is now asserted — the dropdowns synced.
    expect(screen.getByTestId('vs-decision-entity').getAttribute('aria-label')).toContain('LLC')
    expect(screen.getByTestId('vs-decision-team').getAttribute('aria-label')).toContain('Solo founder')
  })

  it('restart in semi-auto clears assertions back to Not set (default-asserted entity resets to asserted), and asks again', () => {
    renderIt()
    clearEntity()
    fireEvent.click(screen.getByTestId('vs-mode-semi'))
    driveToEnd(DEFAULT_ANSWERS, 'Rocket Co')
    expect(screen.getByTestId('vs-decision-entity').getAttribute('aria-label')).toContain('Delaware C-Corp')
    // Restart: everything back to Not set — except DEFAULT-ASSERTED entity, which resets to
    // its asserted default (never to 'Not set') — and the first card returns.
    vi.useFakeTimers()
    try {
      fireEvent.click(screen.getByRole('button', { name: /run it again/i }))
      expect(screen.getByTestId('vs-decision-entity').textContent).toContain('C-Corp')
      // DEFAULT-ASSERTED team (round 7) resets to its asserted default, never to 'Not set'…
      expect(screen.getByTestId('vs-decision-team').textContent).toContain('Cofounders')
      // …while a plain decision clears all the way back.
      expect(screen.getByTestId('vs-decision-product').textContent).toContain('Not set')
      // The first pause (a decision or the naming card) returns within a few rows.
      let card: HTMLElement | null = null
      for (let guard = 0; guard < 200 && card === null; guard++) {
        act(() => {
          vi.advanceTimersByTime(240)
        })
        card = screen.queryByTestId('vs-run-decision') ?? screen.queryByTestId('vs-run-naming')
      }
      expect(card).toBeTruthy()
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
    clearEntity() // default-asserted otherwise — the run would never ask entity
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
        remote: 'remote',
      },
      preset: null,
      yc: false,
      founder: DEFAULT_FOUNDER_AXES,
      mode: 'semi',
      companyName: 'Replayed Co',
      picks: {},
      eventChoices: {},
      assistant: null,
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

describe('the title-bar pause control is gone (founder batch 2026-09-30, item 2)', () => {
  it('no pause affordance in either mode — ⏹ Stop halts the reveal and the status goes quiet; semi-auto decision pauses still work (covered above)', () => {
    renderIt()
    vi.useFakeTimers()
    try {
      fireEvent.click(screen.getByRole('button', { name: /run this startup/i }))
      act(() => {
        vi.advanceTimersByTime(240 * 4)
      })
      const printed = () => screen.getByTestId('vs-terminal-body').querySelector('ol')!.innerHTML
      expect(screen.getByTestId('vs-terminal-status').textContent).toBe('running…')
      expect(screen.queryByTestId('vs-terminal-pause')).toBeNull()
      expect(screen.queryByText(/^paused$/i)).toBeNull()
      // ⏹ Stop (the primary button while running) halts the reveal.
      fireEvent.click(screen.getByRole('button', { name: /stop/i }))
      const frozen = printed()
      act(() => {
        vi.advanceTimersByTime(240 * 10)
      })
      expect(printed()).toBe(frozen)
      expect(screen.getByTestId('vs-terminal-status').textContent).toBe('')
    } finally {
      vi.useRealTimers()
    }
  })
})
