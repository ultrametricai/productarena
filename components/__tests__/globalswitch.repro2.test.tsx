// @vitest-environment jsdom
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import VsGeoSelector from '@/components/VsGeoSelector'
import { GEO_GLOBAL, getGeoChoice, setGeoChoice, type GeoChoice } from '@/lib/geoPreference'

function Harness() {
  const [value, setValue] = useState<GeoChoice | null>(null)
  return <VsGeoSelector value={value} onChange={setValue} />
}

describe('founder repro: selecting Global in the sim geo selector', () => {
  beforeEach(() => { window.history.replaceState(null, '', '/startup-sim'); window.localStorage.clear(); setGeoChoice(null) })
  afterEach(cleanup)
  it('pick Global: trigger shows Global, URL+storage written, and the pick SURVIVES a remount (reload simulation)', () => {
    const { unmount } = render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /Geo|Country|Global|USA/i }))
    fireEvent.click(screen.getByRole('option', { name: /Global/ }))
    expect(window.location.search).toContain('geo=global')
    expect(window.localStorage.getItem('pa-geo')).toBe('global')
    // Remount fresh (a reload / back-navigation): the mount effect re-seeds from URL/storage.
    unmount()
    render(<Harness />)
    expect(screen.getByRole('button', { name: /Global/ })).toBeDefined()
    // The shared store should ALSO remember the explicit Global choice for co-mounted consumers.
    expect(getGeoChoice()).toBe(GEO_GLOBAL)
  })
})
