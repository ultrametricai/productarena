// @vitest-environment jsdom
// WhereItWorksStrip — the promoted header-level "Where it works" strip on product pages
// (founder GEO ask 2026-09-28). Chips keep their per-country ✓/◐/✕ status and source link;
// under a selection the selected country's chip highlights and its committed note shows inline.
// The US default renders chips only — no highlight, no note — and the static HTML never carries
// a selection (mount-only reads, the client-personalization contract).
import { act, fireEvent, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import WhereItWorksStrip from '@/components/WhereItWorksStrip'
import { setGeoSelection, type VendorGeoStripRow } from '@/lib/geoPreference'

// A Mercury-shaped fixture: available at home, unavailable in the UK (the pinned negative).
const ROWS: VendorGeoStripRow[] = [
  {
    country: 'US',
    status: 'available',
    sourceUrl: 'https://mercury.example/us',
    note: 'Dedicated US product.',
    checkedAt: '2026-09-28',
  },
  {
    country: 'UK',
    status: 'unavailable',
    sourceUrl: 'https://mercury.example/uk',
    note: 'US entities only — international founders need a US entity.',
    checkedAt: '2026-09-28',
  },
]

const tree = <WhereItWorksStrip rows={ROWS} />

beforeEach(() => window.history.replaceState(null, '', '/arena/startup-banking/product/mercury'))
afterEach(() => {
  window.localStorage.clear()
  setGeoSelection(null)
})

describe('default view (US, and the static HTML)', () => {
  it('SSR equals the default client render: chips + statuses + source links, no highlight, no inline note', () => {
    expect(renderToString(tree)).toBe(renderToString(tree))
    const { container } = render(tree)
    expect(container.textContent).toContain('Where it works')
    const chips = [...container.querySelectorAll('a[target="_blank"]')]
    expect(chips.map((c) => c.getAttribute('href'))).toEqual([
      'https://mercury.example/us',
      'https://mercury.example/uk',
    ])
    expect(chips[0].textContent).toContain('✓')
    expect(chips[1].textContent).toContain('✕')
    for (const chip of chips) expect(chip.className).not.toContain('ring-1')
    // No selection → no inline note.
    expect(container.textContent).not.toContain('US entities only')
  })
})

describe('under a selection', () => {
  it('highlights the selected country chip and shows its committed note inline, with the source', () => {
    const { container } = render(tree)
    act(() => setGeoSelection('UK'))
    const chips = [...container.querySelectorAll('a[target="_blank"]')]
    const uk = chips.find((c) => c.getAttribute('href') === 'https://mercury.example/uk')
    expect(uk?.className).toContain('ring-1')
    expect(container.textContent).toContain('United Kingdom — not available:')
    expect(container.textContent).toContain('US entities only — international founders need a US entity.')
    // The inline note carries its own source link too — the chip plus the note's "source ↗".
    const ukLinks = chips.filter((c) => c.getAttribute('href') === 'https://mercury.example/uk')
    expect(ukLinks.length).toBe(2)
  })

  it('a selected country the spike has no row for shows no note and highlights nothing (no guess)', () => {
    const { container } = render(tree)
    act(() => setGeoSelection('DE'))
    expect(container.textContent).not.toContain('not available:')
    for (const chip of container.querySelectorAll('a[target="_blank"]')) {
      expect(chip.className).not.toContain('ring-1')
    }
  })

  it('the embedded GeoSwitcher drives the strip: clicking UK highlights, clicking US restores the default', () => {
    const { container, getByRole } = render(tree)
    fireEvent.click(getByRole('button', { name: /UK$/ }))
    expect(container.textContent).toContain('United Kingdom — not available:')
    expect(new URLSearchParams(window.location.search).get('geo')).toBe('uk')
    fireEvent.click(getByRole('button', { name: /US$/ }))
    expect(container.textContent).not.toContain('not available:')
    expect(new URLSearchParams(window.location.search).get('geo')).toBeNull()
  })
})
