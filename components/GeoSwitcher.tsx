'use client'

import { useEffect, useState } from 'react'
import {
  GEO_COUNTRIES,
  GEO_GLOBAL,
  GEO_GLOBAL_META,
  GEO_PARAM,
  GEO_PREF_META,
  GEO_STORAGE_KEY,
  getGeoChoice,
  parseGeoChoice,
  serializeGeoChoice,
  setGeoChoice,
  subscribeGeoSelection,
  type GeoChoice,
} from '@/lib/geoPreference'
import { readParam, setParams } from '@/lib/urlState'

// The global geo switcher (founder GEO ask 2026-09-28: "make GEO a top-level process driver at
// the top of a particular process page or a vendor, so we know how it works across the globe").
// Compact country pills — 🇺🇸 US (default) · 🇬🇧 UK · 🇮🇳 IN · 🇩🇪 DE · 🇫🇷 FR — now rendered only
// in the WhereItWorks strip (process detail pages and the /processes index moved to the
// GeoDropdown form, founder 2026-09-29/2026-10-02). With GeoDropdown it co-writes the shared
// selection (lib/geoPreference.ts store) that the banner, step markers, vendor annotations and
// index glyphs consume via components/useGeoSelection.ts.
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
  const [geo, setGeo] = useState<GeoChoice | null>(null)
  /* eslint-disable react-hooks/set-state-in-effect -- one-time post-hydration sync FROM the URL
     and the stored preference (external systems). The static HTML must render the US default,
     so this cannot be a useState initializer (hydration mismatch); it runs once and renders at
     most one extra pass. */
  useEffect(() => {
    const fromUrl = readParam(GEO_PARAM)
    const initial =
      fromUrl !== null
        ? parseGeoChoice(fromUrl)
        : parseGeoChoice(window.localStorage.getItem(GEO_STORAGE_KEY))
    // Mount-only: the URL (else the stored copy) is the INITIAL view. Seed the shared store so
    // every co-mounted consumer (banner, markers, annotations) sees the same selection, and
    // mirror the store locally so a second GeoSwitcher instance would stay in sync too.
    setGeoChoice(initial)
    setGeo(getGeoChoice())
    return subscribeGeoSelection(() => setGeo(getGeoChoice()))
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const apply = (next: GeoChoice | null) => {
    setGeoChoice(next)
    const serialized = serializeGeoChoice(next)
    setParams({ [GEO_PARAM]: serialized })
    if (serialized === null) window.localStorage.removeItem(GEO_STORAGE_KEY)
    else window.localStorage.setItem(GEO_STORAGE_KEY, serialized)
  }

  const pill = (isActive: boolean, key: string, flag: string, label: string, title: string, next: GeoChoice | null) => (
    <button
      key={key}
      type="button"
      onClick={() => apply(next)}
      title={title}
      aria-pressed={isActive}
      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs transition sm:px-3 ${
        isActive
          ? 'bg-emerald-400/15 font-medium text-emerald-300 ring-1 ring-emerald-400/50'
          : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      <span aria-hidden className="mr-1">{flag}</span>
      {label}
    </button>
  )

  return (
    <div className="inline-flex flex-wrap items-center gap-0.5 rounded-full border border-zinc-800 p-1 sm:gap-1">
      <span className="sr-only">Country</span>
      {GEO_COUNTRIES.map((c) =>
        pill(
          c === 'US' ? geo === null : geo === c,
          c,
          GEO_PREF_META[c].flag,
          c,
          c === 'US'
            ? `${GEO_PREF_META[c].label} — the default every page renders and every number is judged in`
            : `${GEO_PREF_META[c].label} — annotate this page with the committed ${c} evidence (never re-ranked, never guessed)`,
          c === 'US' ? null : c,
        ),
      )}
      {/* The explicit geo-neutral choice (founder 2026-09-30): the process in its
          country-agnostic form — country-conditional steps, per-country analogs and geo
          auto-preselects all stand down. Judged numbers never move; this is a display lens. */}
      {pill(
        geo === GEO_GLOBAL,
        GEO_GLOBAL,
        GEO_GLOBAL_META.flag,
        GEO_GLOBAL_META.label,
        'Global — the country-agnostic view: country-specific steps, analogs and availability marks are hidden (judged data unchanged)',
        GEO_GLOBAL,
      )}
    </div>
  )
}
