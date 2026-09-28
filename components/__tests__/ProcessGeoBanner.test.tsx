// @vitest-environment jsdom
// ProcessGeoBanner — the top-of-process-page geo banner (founder GEO ask 2026-09-28). The
// honesty matrix is the point: every (geoScope × notes-present/absent) cell says exactly what
// the committed data supports — an analog is promoted only when a curated geoNote exists for
// the selected country, and NEVER fabricated (the unsupported-never-guessed doctrine). The US
// default (and the static HTML) renders nothing, keeping the default page byte-identical.
import { act, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import GeoStepMark from '@/components/GeoStepMark'
import ProcessGeoBanner from '@/components/ProcessGeoBanner'
import { setGeoSelection, type GeoAnalogNote } from '@/lib/geoPreference'

const NOTES: GeoAnalogNote[] = [
  {
    country: 'UK',
    summary: 'Register a private limited company with Companies House.',
    actionUrl: 'https://www.gov.uk/limited-company-formation',
    actionLabel: 'Companies House — set up a limited company',
  },
]

afterEach(() => setGeoSelection(null))

const select = (c: 'UK' | 'IN' | 'DE' | 'FR' | null) => act(() => setGeoSelection(c))

describe('default view (US, and the static HTML)', () => {
  it('renders NOTHING without a selection — the default page is byte-identical', () => {
    const tree = <ProcessGeoBanner geoScope="us" notes={NOTES} />
    expect(renderToString(tree)).toBe('')
    const { container } = render(tree)
    expect(container.innerHTML).toBe('')
  })
})

describe('the honesty matrix (geoScope × notes)', () => {
  it("global: 'Global process — the same steps apply in {country}.'", () => {
    const { container } = render(<ProcessGeoBanner geoScope="global" notes={[]} />)
    select('DE')
    expect(container.textContent).toContain('Global process')
    expect(container.textContent).toContain('the same steps apply in Germany.')
  })

  it('us + note for the country: US-centric + the promoted analog with its verified link', () => {
    const { container } = render(<ProcessGeoBanner geoScope="us" notes={NOTES} />)
    select('UK')
    expect(container.textContent).toContain('US-centric process.')
    expect(container.textContent).toContain('In the United Kingdom:')
    expect(container.textContent).toContain('Register a private limited company with Companies House.')
    const analog = container.querySelector('a[href="https://www.gov.uk/limited-company-formation"]')
    expect(analog?.textContent).toContain('Companies House — set up a limited company')
    // The banner links DOWN to the full multi-country block, which stays on the page.
    expect(container.querySelector('a[href="#outside-the-us"]')).not.toBeNull()
  })

  it('us + NO note for the country: the honest no-mapping line — an analog is never invented', () => {
    const { container } = render(<ProcessGeoBanner geoScope="us" notes={NOTES} />)
    select('IN')
    expect(container.textContent).toContain('US-centric process.')
    expect(container.textContent).toContain('No India mapping yet — this workflow is US-specific.')
    // Nothing borrowed from the UK note.
    expect(container.textContent).not.toContain('Companies House')
    expect(container.querySelector('a[href^="https://"]')).toBeNull()
  })

  it('us-state behaves as US-centric, and with zero notes there is no dangling anchor link', () => {
    const { container } = render(<ProcessGeoBanner geoScope="us-state" notes={[]} />)
    select('FR')
    expect(container.textContent).toContain('US-centric process.')
    expect(container.textContent).toContain('No France mapping yet — this workflow is US-specific.')
    // No "Outside the US" block exists for a notes-less process — no link down to one.
    expect(container.querySelector('a[href="#outside-the-us"]')).toBeNull()
  })

  it('switching back to the US default removes the banner again', () => {
    const { container } = render(<ProcessGeoBanner geoScope="global" notes={[]} />)
    select('UK')
    expect(container.textContent).toContain('Global process')
    select(null)
    expect(container.innerHTML).toBe('')
  })
})

describe('GeoStepMark (the subtle per-step 🇺🇸 marker)', () => {
  it('renders nothing by default and in the static HTML; flags US-specific steps under a selection', () => {
    expect(renderToString(<GeoStepMark />)).toBe('')
    const { container } = render(<GeoStepMark />)
    expect(container.innerHTML).toBe('')
    select('DE')
    expect(container.textContent).toBe('🇺🇸')
    expect(container.querySelector('span')?.getAttribute('title')).toContain('Germany')
    select(null)
    expect(container.innerHTML).toBe('')
  })
})
