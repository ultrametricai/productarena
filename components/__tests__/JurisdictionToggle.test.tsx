// @vitest-environment jsdom
// JurisdictionToggle — the /processes/[slug] jurisdiction control (founder 2026-09-25: "allow
// more options for the processes — ie multi-state situations or California included").
// Load-bearing assertions, in the site-wide personalization contract's order (the
// components/__tests__/HomeModes.test.tsx template):
//   1. SSR-equivalence: the static HTML always renders the Delaware-only default — even when
//      the URL carries ?juris=ca — and hydrates with ZERO mismatches (the param is applied in a
//      mount effect, never during render);
//   2. the URL wins over the localStorage copy (pa-jurisdiction) on first load; the stored copy
//      restores the view when no param is present;
//   3. toggling writes BOTH the ?juris= param and localStorage, canonical and default-eliding;
//   4. toggled-on steps carry their jurisdiction badge and the recomputed ceiling is honestly
//      labelled with the default alongside.
import { render, fireEvent, act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import JurisdictionToggle from '@/components/JurisdictionToggle'
import type { JurisdictionStepView } from '@/lib/jurisdictions'

// Same in-memory localStorage stand-in as components/__tests__/HomeModes.test.tsx.
function stubLocalStorage() {
  const store = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  })
}

const PATH = '/productarena/processes/incorporate-c-corp'
const setUrl = (search: string) => window.history.replaceState(null, '', `${PATH}${search}`)
const url = () => `${window.location.pathname}${window.location.search}`

const steps: JurisdictionStepView[] = [
  {
    label: 'File the CA foreign qualification',
    route: 'form',
    jurisdictions: ['CA'],
    actionUrl: 'https://bizfileonline.sos.ca.gov/',
    actionLabel: 'CA SOS bizfile',
    estimatedMinutes: 30,
    async: false,
    processHref: null,
    processTitle: null,
  },
  {
    label: 'Register where you have sales-tax nexus',
    route: 'person',
    jurisdictions: ['MULTI'],
    actionUrl: null,
    actionLabel: null,
    estimatedMinutes: 10,
    async: false,
    processHref: '/processes/sales-tax-nexus-registration',
    processTitle: 'Sales tax nexus & registration',
  },
]
// Base = 5 of 10 agent-runnable (50%). Both fixture steps are non-agent: CA on → 5/11 = 45%.
const tree = <JurisdictionToggle steps={steps} base={{ agentSteps: 5, totalSteps: 10, pct: 50 }} />

const pressed = (el: HTMLElement) => el.getAttribute('aria-pressed')

beforeEach(() => {
  stubLocalStorage()
  setUrl('')
})
afterEach(() => window.localStorage.clear())

describe('static-HTML contract (SSR ↔ empty client state)', () => {
  it('SSR renders Delaware-only even when the URL says ?juris=ca, and hydrates mismatch-free', async () => {
    ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
    setUrl('?juris=ca')
    window.localStorage.setItem('pa-jurisdiction', 'multi')
    const ssr = renderToString(tree)
    // The server never sees the query or the storage — byte-identical default HTML.
    expect(ssr).toBe(renderToString(tree))
    expect(ssr).not.toContain('File the CA foreign qualification')
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
      // Post-hydration the mount effect applies the URL — and the URL WINS over localStorage.
      expect(container.textContent).toContain('File the CA foreign qualification')
      expect(container.textContent).not.toContain('sales-tax nexus')
    } finally {
      await act(async () => root?.unmount())
      container.remove()
    }
  })
})

describe('URL ⇄ localStorage ⇄ pills', () => {
  it('mounts Delaware-only by default: pills only, honest availability hint, judged default untouched', () => {
    const { container, getByRole } = render(tree)
    expect(pressed(getByRole('button', { name: 'Delaware-only' }))).toBe('true')
    expect(container.textContent).toContain('Delaware-only view')
    expect(container.textContent).not.toContain('Ceiling with')
  })

  it('?juris=ca mounts with California on: badge, step, and the recomputed ceiling labelled against the default', () => {
    setUrl('?juris=ca')
    const { container, getByRole } = render(tree)
    expect(pressed(getByRole('button', { name: '+ California' }))).toBe('true')
    expect(pressed(getByRole('button', { name: 'Delaware-only' }))).toBe('false')
    expect(container.textContent).toContain('File the CA foreign qualification')
    expect(container.textContent).toContain('CA')
    // 5 of 11 → 45%, with the Delaware-only default named alongside.
    expect(container.textContent).toContain('Ceiling with CA steps')
    expect(container.textContent).toContain('45%')
    expect(container.textContent).toContain('5 of 11')
    expect(container.textContent).toContain('default: 50%')
  })

  it('restores the stored preference when no param is present; an invalid stored value degrades to the default', () => {
    window.localStorage.setItem('pa-jurisdiction', 'multi')
    const { container, getByRole, unmount } = render(tree)
    expect(pressed(getByRole('button', { name: '+ Multi-state' }))).toBe('true')
    expect(container.textContent).toContain('sales-tax nexus')
    // The internal process link renders for a processRef step.
    expect(container.querySelector('a[href*="sales-tax-nexus-registration"]')).not.toBeNull()
    unmount()
    window.localStorage.setItem('pa-jurisdiction', 'garbage')
    const second = render(tree)
    expect(pressed(second.getByRole('button', { name: 'Delaware-only' }))).toBe('true')
  })

  it('toggling writes BOTH the param and localStorage; both jurisdictions serialize canonically', () => {
    const { getByRole } = render(tree)
    fireEvent.click(getByRole('button', { name: '+ California' }))
    expect(url()).toBe(`${PATH}?juris=ca`)
    expect(window.localStorage.getItem('pa-jurisdiction')).toBe('ca')
    fireEvent.click(getByRole('button', { name: '+ Multi-state' }))
    expect(url()).toBe(`${PATH}?juris=ca%2Cmulti`)
    expect(window.localStorage.getItem('pa-jurisdiction')).toBe('ca,multi')
  })

  it('Delaware-only clears the param AND the stored copy — the default never appears in the URL', () => {
    setUrl('?juris=ca,multi')
    window.localStorage.setItem('pa-jurisdiction', 'ca,multi')
    const { getByRole } = render(tree)
    fireEvent.click(getByRole('button', { name: 'Delaware-only' }))
    expect(url()).toBe(PATH)
    expect(window.localStorage.getItem('pa-jurisdiction')).toBeNull()
  })

  it('patches, never rebuilds: co-mounted params survive a toggle', () => {
    setUrl('?via=payroll:gusto')
    const { getByRole } = render(tree)
    fireEvent.click(getByRole('button', { name: '+ Multi-state' }))
    const p = new URLSearchParams(window.location.search)
    expect(p.get('juris')).toBe('multi')
    expect(p.get('via')).toBe('payroll:gusto')
  })
})
