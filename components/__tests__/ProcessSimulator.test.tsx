// @vitest-environment jsdom
// ProcessSimulator role pickers — the founder 2026-09-25 UX pass replaced the native <select>s
// with logo-bearing card + popover listbox pickers (components/SimRolePicker.tsx). Load-bearing
// contracts covered here:
//   - picking an option mutates the SAME selections state the old <select> onChange did — the
//     dry-run transcript (buildSimRun) must see the swap ("equivalent operation on …", the
//     products line);
//   - listbox semantics: trigger aria-expanded/haspopup, options are real <button role="option">
//     rows in the arena's RANKED order with aria-selected on the pick, Escape closes and
//     refocuses the trigger, outside clicks close;
//   - the honesty string stays verbatim and the static SSR HTML hydrates mismatch-free
//     (client component with server-rendered defaults).
// hasLogo false everywhere: the fallback initial-chip renders without next/image.
import { act, fireEvent, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ProcessSimulator from '@/components/ProcessSimulator'
import type { SimStep, VendorRole } from '@/lib/processSim'

const BANK_ROLE: VendorRole = {
  arenaId: 'startup-banking',
  arenaName: 'Startup banking',
  canonicalVendor: 'mercury',
  defaultProductId: 'mercury',
  defaultProductName: 'Mercury',
  stepCount: 1,
  // Already ranked by agent-readiness desc (nulls last) — the picker must preserve this order.
  alternatives: [
    { id: 'mercury', name: 'Mercury', agentReady: 82 },
    { id: 'brex', name: 'Brex', agentReady: 74 },
    { id: 'ramp', name: 'Ramp', agentReady: null },
  ],
}

const PAYROLL_ROLE: VendorRole = {
  arenaId: 'payroll',
  arenaName: 'Payroll',
  canonicalVendor: 'gusto',
  defaultProductId: 'gusto',
  defaultProductName: 'Gusto',
  stepCount: 1,
  alternatives: [
    { id: 'gusto', name: 'Gusto', agentReady: 60 },
    { id: 'rippling', name: 'Rippling', agentReady: 50 },
  ],
}

const STEP: SimStep = {
  taskId: 'inc_001',
  taskTitle: 'Open a bank account',
  label: 'Open the account',
  route: 'agent',
  vendor: 'mercury',
  vendorLabel: 'Mercury',
  arenaId: 'startup-banking',
  choiceArenaId: null,
  calls: ['POST /api/accounts'],
  toolCall: null,
  approvalRequired: false,
  legalSignature: false,
  riskLevel: null,
  estimatedMinutes: 5,
  async: false,
  gap: null,
}

const tree = <ProcessSimulator steps={[STEP]} roles={[BANK_ROLE, PAYROLL_ROLE]} />

function trigger(container: HTMLElement, name: string): HTMLButtonElement {
  const hit = [...container.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="listbox"]')].find((b) =>
    (b.textContent ?? '').includes(name),
  )
  if (!hit) throw new Error(`no listbox trigger showing "${name}"`)
  return hit
}

afterEach(() => vi.useRealTimers())

describe('role cards (closed state)', () => {
  it('renders one labeled card per role with the default pick, its rank, and no open listbox', () => {
    const { container, getByText, queryByRole } = render(tree)
    const triggers = container.querySelectorAll('button[aria-haspopup="listbox"]')
    expect(triggers).toHaveLength(2)
    expect(trigger(container, 'Mercury').getAttribute('aria-expanded')).toBe('false')
    // The card names WHAT the role is (the arena) and the pick's ladder rank.
    expect(getByText('Startup banking')).toBeTruthy()
    expect(getByText('Payroll')).toBeTruthy()
    expect(trigger(container, 'Mercury').textContent).toContain('#1')
    expect(queryByRole('listbox')).toBeNull()
    // Defaults are canonical — nothing wears the swapped marker, no reset affordance.
    expect(container.textContent).not.toContain('(swapped)')
  })

  it('keeps the honesty string verbatim', () => {
    const { getByText } = render(tree)
    expect(getByText('simulated dry run from the mapped process — no real calls are made')).toBeTruthy()
  })
})

describe('popover listbox', () => {
  it('opens on trigger click: options in ranked order, aria-selected + canonical marker on the pick', () => {
    const { container, getByRole, getAllByRole } = render(tree)
    fireEvent.click(trigger(container, 'Mercury'))
    expect(trigger(container, 'Mercury').getAttribute('aria-expanded')).toBe('true')
    expect(getByRole('listbox')).toBeTruthy()
    const options = getAllByRole('option')
    expect(options.map((o) => o.textContent?.includes('Mercury') || false)).toEqual([true, false, false])
    expect(options.map((o) => o.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false'])
    // Ranked order preserved, scores shown where judged, canonical named.
    expect(options[0].textContent).toContain('(canonical)')
    expect(options[1].textContent).toContain('Brex')
    expect(options[1].textContent).toContain('74/100 agent-ready')
    expect(options[2].textContent).toContain('Ramp')
    // Options are REAL buttons — Enter/Space activation is native, no synthetic key handling.
    for (const o of options) expect(o.tagName).toBe('BUTTON')
  })

  it('picking an option applies the same state change as the old <select>: swapped marker, reset restores the default', () => {
    const { container, getAllByRole, getByLabelText, queryByRole } = render(tree)
    fireEvent.click(trigger(container, 'Mercury'))
    fireEvent.click(getAllByRole('option')[1]) // Brex
    expect(queryByRole('listbox')).toBeNull()
    expect(trigger(container, 'Brex').textContent).toContain('#2')
    expect(container.textContent).toContain('(swapped)')
    // Focus returns to the trigger after a pick.
    expect(document.activeElement).toBe(trigger(container, 'Brex'))
    // Compact reset affordance appears only once swapped, and restores the default pick.
    fireEvent.click(getByLabelText('Reset Startup banking to Mercury'))
    expect(trigger(container, 'Mercury')).toBeTruthy()
    expect(container.textContent).not.toContain('(swapped)')
  })

  it('the picked product drives the dry run exactly as the old select did (transcript + products line)', () => {
    vi.useFakeTimers()
    const { container, getAllByRole, getByText } = render(tree)
    fireEvent.click(trigger(container, 'Mercury'))
    fireEvent.click(getAllByRole('option')[1]) // Brex
    fireEvent.click(getByText('Run'))
    act(() => {
      vi.advanceTimersByTime(600 * 3)
    })
    // Swapped-step honesty: the recorded call is annotated, never claimed as Brex's own API.
    expect(container.textContent).toContain('POST /api/accounts  (equivalent operation on Brex)')
    expect(container.textContent).toContain('products: Brex, Gusto')
  })
})

describe('keyboard', () => {
  it('opening moves focus to the current pick (an option button — native Enter activation)', () => {
    const { container, getAllByRole } = render(tree)
    fireEvent.click(trigger(container, 'Gusto'))
    const options = getAllByRole('option')
    expect(document.activeElement).toBe(options[0])
    expect((document.activeElement as HTMLElement).getAttribute('role')).toBe('option')
    // Enter on a focused native <button> activates it (native UA behavior jsdom doesn't emulate
    // — activation itself is exercised via click above); activating picks and closes.
    fireEvent.click(options[1])
    expect(container.querySelector('[role="listbox"]')).toBeNull()
    expect(trigger(container, 'Rippling')).toBeTruthy()
  })

  it('Escape closes without changing the pick and refocuses the trigger', () => {
    const { container, getAllByRole, queryByRole } = render(tree)
    fireEvent.click(trigger(container, 'Mercury'))
    fireEvent.keyDown(getAllByRole('option')[1], { key: 'Escape' })
    expect(queryByRole('listbox')).toBeNull()
    expect(trigger(container, 'Mercury').getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger(container, 'Mercury'))
    expect(container.textContent).not.toContain('(swapped)')
  })

  it('a click outside the card closes the open listbox', () => {
    const { container, queryByRole } = render(tree)
    fireEvent.click(trigger(container, 'Mercury'))
    fireEvent.pointerDown(document.body)
    expect(queryByRole('listbox')).toBeNull()
  })
})

describe('static-HTML contract (SSR ↔ client defaults)', () => {
  it('SSR renders the default picks with the listboxes closed, and hydrates mismatch-free', async () => {
    ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
    const ssr = renderToString(tree)
    expect(ssr).toContain('Mercury')
    expect(ssr).toContain('Gusto')
    expect(ssr).toContain('simulated dry run from the mapped process — no real calls are made')
    expect(ssr).not.toContain('role="listbox"')
    const container = document.createElement('div')
    container.innerHTML = ssr
    document.body.appendChild(container)
    let root: Root | undefined
    try {
      const hydrationErrors: unknown[] = []
      await act(async () => {
        root = hydrateRoot(container, tree, { onRecoverableError: (e) => hydrationErrors.push(e) })
      })
      expect(hydrationErrors).toEqual([])
      // Hydrated pickers are live: the popover opens.
      fireEvent.click(trigger(container, 'Mercury'))
      expect(container.querySelector('[role="listbox"]')).toBeTruthy()
    } finally {
      await act(async () => root?.unmount())
      container.remove()
    }
  })
})
