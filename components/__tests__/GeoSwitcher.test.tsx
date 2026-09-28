// @vitest-environment jsdom
// GeoSwitcher — the global country pills (founder GEO ask 2026-09-28: "make GEO a top-level
// process driver"). Load-bearing assertions, in the site-wide personalization contract's order
// (the components/__tests__/JurisdictionToggle.test.tsx template):
//   1. SSR-equivalence: the static HTML always renders the 🇺🇸 US default — even when the URL
//      carries ?geo=uk — and hydrates with ZERO mismatches (mount-effect reads only);
//   2. the URL wins over the localStorage copy (pa-geo) on first load; the stored copy restores
//      the view when no param is present;
//   3. picking a country writes BOTH the ?geo= param and localStorage; the US default clears
//      both and never appears in the URL;
//   4. the shared store fans out: co-mounted useGeoSelection consumers follow the pills.
import { render, fireEvent, act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import GeoSwitcher from '@/components/GeoSwitcher'
import { useGeoSelection } from '@/components/useGeoSelection'
import { setGeoSelection } from '@/lib/geoPreference'

// Same in-memory localStorage stand-in as components/__tests__/JurisdictionToggle.test.tsx.
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

const PATH = '/processes/incorporate-c-corp'
const setUrl = (search: string) => window.history.replaceState(null, '', `${PATH}${search}`)
const url = () => `${window.location.pathname}${window.location.search}`
const pressed = (el: HTMLElement) => el.getAttribute('aria-pressed')

// A minimal co-mounted consumer — the banner/marker/annotation stand-in.
function Probe() {
  const geo = useGeoSelection()
  return <output data-testid="probe">{geo ?? 'US-default'}</output>
}

beforeEach(() => {
  stubLocalStorage()
  setUrl('')
})
afterEach(() => {
  window.localStorage.clear()
  // The module-level store outlives unmounts — reset so tests stay independent.
  setGeoSelection(null)
})

describe('static-HTML contract (SSR ↔ empty client state)', () => {
  it('SSR renders the US default even when the URL says ?geo=uk, and hydrates mismatch-free', async () => {
    ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
    setUrl('?geo=uk')
    window.localStorage.setItem('pa-geo', 'de')
    const tree = (
      <>
        <GeoSwitcher />
        <Probe />
      </>
    )
    const ssr = renderToString(tree)
    // The server never sees the query or the storage — byte-identical default HTML.
    expect(ssr).toBe(renderToString(tree))
    expect(ssr).toContain('US-default')
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
      // Post-hydration the mount effect applies the URL — and the URL WINS over localStorage —
      // and the shared store fans it out to the co-mounted consumer.
      expect(container.querySelector('[data-testid="probe"]')?.textContent).toBe('UK')
    } finally {
      await act(async () => root?.unmount())
      container.remove()
    }
  })
})

describe('URL ⇄ localStorage ⇄ pills', () => {
  it('mounts with the US default: US pressed, consumers see no selection', () => {
    const { getByRole, getByTestId } = render(
      <>
        <GeoSwitcher />
        <Probe />
      </>,
    )
    expect(pressed(getByRole('button', { name: /US$/ }))).toBe('true')
    expect(getByTestId('probe').textContent).toBe('US-default')
  })

  it('?geo=in mounts with India active; junk (?geo=narnia, ?geo=us) degrades to the default', () => {
    setUrl('?geo=in')
    const first = render(<GeoSwitcher />)
    expect(pressed(first.getByRole('button', { name: /IN$/ }))).toBe('true')
    expect(pressed(first.getByRole('button', { name: /US$/ }))).toBe('false')
    first.unmount()
    act(() => setGeoSelection(null))
    setUrl('?geo=narnia')
    const second = render(<GeoSwitcher />)
    expect(pressed(second.getByRole('button', { name: /US$/ }))).toBe('true')
  })

  it('restores the stored preference when no param is present', () => {
    window.localStorage.setItem('pa-geo', 'fr')
    const { getByRole, getByTestId } = render(
      <>
        <GeoSwitcher />
        <Probe />
      </>,
    )
    expect(pressed(getByRole('button', { name: /FR$/ }))).toBe('true')
    expect(getByTestId('probe').textContent).toBe('FR')
  })

  it('picking a country writes BOTH ?geo= and pa-geo; consumers follow live', () => {
    const { getByRole, getByTestId } = render(
      <>
        <GeoSwitcher />
        <Probe />
      </>,
    )
    fireEvent.click(getByRole('button', { name: /UK$/ }))
    expect(url()).toBe(`${PATH}?geo=uk`)
    expect(window.localStorage.getItem('pa-geo')).toBe('uk')
    expect(getByTestId('probe').textContent).toBe('UK')
    fireEvent.click(getByRole('button', { name: /DE$/ }))
    expect(url()).toBe(`${PATH}?geo=de`)
    expect(window.localStorage.getItem('pa-geo')).toBe('de')
    expect(getByTestId('probe').textContent).toBe('DE')
  })

  it('US clears the param AND the stored copy — the default never appears in the URL', () => {
    setUrl('?geo=uk')
    window.localStorage.setItem('pa-geo', 'uk')
    const { getByRole, getByTestId } = render(
      <>
        <GeoSwitcher />
        <Probe />
      </>,
    )
    fireEvent.click(getByRole('button', { name: /US$/ }))
    expect(url()).toBe(PATH)
    expect(window.localStorage.getItem('pa-geo')).toBeNull()
    expect(getByTestId('probe').textContent).toBe('US-default')
  })

  it('patches, never rebuilds: co-mounted params survive a switch', () => {
    setUrl('?juris=ca&via=payroll:gusto')
    const { getByRole } = render(<GeoSwitcher />)
    fireEvent.click(getByRole('button', { name: /IN$/ }))
    const p = new URLSearchParams(window.location.search)
    expect(p.get('geo')).toBe('in')
    expect(p.get('juris')).toBe('ca')
    expect(p.get('via')).toBe('payroll:gusto')
  })
})
