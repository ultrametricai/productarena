'use client'

import { useEffect, useState } from 'react'
import { getGeoSelection, subscribeGeoSelection, type GeoSelection } from '@/lib/geoPreference'

// The consumer half of the geo preference (lib/geoPreference.ts): every geo-aware component —
// the process banner, step markers, vendor annotations, the product strip, the index glyphs —
// calls this and re-renders when GeoSwitcher changes the selection.
//
// Static-HTML/hydration contract (the components/JurisdictionToggle.tsx precedent): the server
// snapshot (and the first client render) is always the US default — `null` — so the static HTML
// stays byte-identical and hydrates with zero mismatches; the store value only lands in the
// mount effect. GeoSwitcher owns reading ?geo=/localStorage into the store; this hook only
// mirrors the store.
export function useGeoSelection(): GeoSelection | null {
  const [geo, setGeo] = useState<GeoSelection | null>(null)
  /* eslint-disable react-hooks/set-state-in-effect -- one-time post-hydration sync FROM the
     shared store (an external system). The static HTML must render the US default, so this
     cannot be a useState initializer (hydration mismatch); it runs once and renders at most one
     extra pass. */
  useEffect(() => {
    setGeo(getGeoSelection())
    return subscribeGeoSelection(() => setGeo(getGeoSelection()))
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */
  return geo
}
