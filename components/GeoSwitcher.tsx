'use client'

import { useEffect, useState } from 'react'
import {
  GEO_COUNTRIES,
  GEO_PARAM,
  GEO_PREF_META,
  GEO_STORAGE_KEY,
  getGeoSelection,
  parseGeo,
  serializeGeo,
  setGeoSelection,
  subscribeGeoSelection,
  type GeoSelection,
} from '@/lib/geoPreference'
import { readParam, setParams } from '@/lib/urlState'

// The global geo switcher (founder GEO ask 2026-09-28: "make GEO a top-level process driver at
// the top of a particular process page or a vendor, so we know how it works across the globe").
// Compact country pills — 🇺🇸 US (default) · 🇬🇧 UK · 🇮🇳 IN · 🇩🇪 DE · 🇫🇷 FR — rendered at the
// top of process pages, in the product-page header, and on the /processes index header. It is
// the ONLY writer of the shared selection (lib/geoPreference.ts store) that the banner, step
// markers, vendor annotations and index glyphs consume via components/useGeoSelection.ts.
//
// Static-HTML/hydration contract (the components/JurisdictionToggle.tsx precedent): the server
// snapshot always renders the 🇺🇸 US default — the selection only appears after the mount effect
// reads ?geo= (lib/urlState.ts conventions; the URL wins) or the localStorage copy (pa-geo).
// Picking a country writes both; the US default never appears in the URL and clears the stored
// copy.
//
// Honesty: switching countries never re-ranks or recomputes a judged number — every geo-aware
// consumer is annotation-only, derived from committed evidence (process geoNotes,
// jurisdictions/vendor-geo.json), and unsupported countries are said to be unmapped, never
// guessed.

export default function GeoSwitcher() {
  const [geo, setGeo] = useState<GeoSelection | null>(null)
  /* eslint-disable react-hooks/set-state-in-effect -- one-time post-hydration sync FROM the URL
     and the stored preference (external systems). The static HTML must render the US default,
     so this cannot be a useState initializer (hydration mismatch); it runs once and renders at
     most one extra pass. */
  useEffect(() => {
    const fromUrl = readParam(GEO_PARAM)
    const initial =
      fromUrl !== null
        ? parseGeo(fromUrl)
        : parseGeo(window.localStorage.getItem(GEO_STORAGE_KEY))
    // Mount-only: the URL (else the stored copy) is the INITIAL view. Seed the shared store so
    // every co-mounted consumer (banner, markers, annotations) sees the same selection, and
    // mirror the store locally so a second GeoSwitcher instance would stay in sync too.
    setGeoSelection(initial)
    setGeo(getGeoSelection())
    return subscribeGeoSelection(() => setGeo(getGeoSelection()))
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const apply = (next: GeoSelection | null) => {
    setGeoSelection(next)
    const serialized = serializeGeo(next)
    setParams({ [GEO_PARAM]: serialized })
    if (serialized === null) window.localStorage.removeItem(GEO_STORAGE_KEY)
    else window.localStorage.setItem(GEO_STORAGE_KEY, serialized)
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-0.5 rounded-full border border-zinc-800 p-1 sm:gap-1">
      <span className="sr-only">Country</span>
      {GEO_COUNTRIES.map((c) => {
        const isActive = c === 'US' ? geo === null : geo === c
        return (
          <button
            key={c}
            type="button"
            onClick={() => apply(c === 'US' ? null : c)}
            title={
              c === 'US'
                ? `${GEO_PREF_META[c].label} — the default every page renders and every number is judged in`
                : `${GEO_PREF_META[c].label} — annotate this page with the committed ${c} evidence (never re-ranked, never guessed)`
            }
            aria-pressed={isActive}
            className={`whitespace-nowrap rounded-full px-2 py-1 text-xs transition sm:px-3 ${
              isActive
                ? 'bg-emerald-400/15 font-medium text-emerald-300 ring-1 ring-emerald-400/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span aria-hidden className="mr-1">{GEO_PREF_META[c].flag}</span>
            {c}
          </button>
        )
      })}
    </div>
  )
}
