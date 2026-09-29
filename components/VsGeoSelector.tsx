'use client'

import { useEffect } from 'react'
import {
  GEO_GLOBAL,
  GEO_GLOBAL_META,
  GEO_COUNTRIES,
  GEO_PARAM,
  GEO_PREF_META,
  GEO_STORAGE_KEY,
  parseGeoChoice,
  serializeGeoChoice,
  setGeoSelection,
  type GeoChoice,
} from '@/lib/geoPreference'
import { readParam, setParams } from '@/lib/urlState'

// The Virtual Startup's in-sim Geo row (founder batch 2026-09-29, item 2): 🌐 Global · 🇺🇸 USA
// (default) · 🇬🇧 UK · 🇮🇳 IN · 🇩🇪 DE · 🇫🇷 FR. Same contract as components/GeoSwitcher.tsx —
// the ?geo= param + the pa-geo localStorage copy, read on MOUNT ONLY so the static HTML stays
// byte-identical — plus the one extra token this surface needs: 'global', the explicit
// geo-neutral choice (lib/geoPreference.ts GEO_GLOBAL, additive). Interop is deliberate: a UK
// pick here is the same ?geo=uk / pa-geo=uk the process and product pages read, and this row
// seeds the shared per-tab store (countries only — 'global' maps to the null store state, which
// is exactly what geo-neutral means to every existing consumer).
//
// Honesty (the GeoSwitcher doctrine, verbatim): switching countries never re-ranks or recomputes
// a judged number — every in-sim geo annotation is derived from committed evidence (process
// geoNotes, jurisdictions/vendor-geo.json), and unsupported countries are said to be unmapped,
// never guessed.

// The row's pills in display order: Global first, then the canonical US→UK→IN→DE→FR country set.
const PILLS: Array<{ choice: GeoChoice | null; code: string; flag: string; title: string }> = [
  {
    choice: GEO_GLOBAL,
    code: 'Global',
    flag: GEO_GLOBAL_META.flag,
    title: 'Global — a geo-neutral run: no country marks, no analogs; judged data unchanged',
  },
  ...GEO_COUNTRIES.map((c) => ({
    choice: c === 'US' ? null : c,
    code: c === 'US' ? 'USA' : c,
    flag: GEO_PREF_META[c].flag,
    title:
      c === 'US'
        ? `${GEO_PREF_META[c].label} — the default every page renders and every number is judged in`
        : `${GEO_PREF_META[c].label} — annotate the run with the committed ${c} evidence (never re-ranked, never guessed)`,
  })),
]

export default function VsGeoSelector({
  value,
  onChange,
}: {
  value: GeoChoice | null
  onChange: (next: GeoChoice | null) => void
}) {
  // One-time post-hydration sync FROM the URL and the stored preference (external systems), the
  // GeoSwitcher contract: the static HTML must render the US default, so this cannot be an
  // initializer (hydration mismatch); it runs once. (The setter is the parent's state setter,
  // passed down as onChange — which is also why the lint rule doesn't need disabling here.)
  useEffect(() => {
    const fromUrl = readParam(GEO_PARAM)
    const initial =
      fromUrl !== null
        ? parseGeoChoice(fromUrl)
        : parseGeoChoice(window.localStorage.getItem(GEO_STORAGE_KEY))
    if (initial === null) return
    // Seed the shared store too (countries only), so a client-side hop to a process page keeps
    // the same selection its own GeoSwitcher would read back from pa-geo.
    setGeoSelection(initial === GEO_GLOBAL ? null : initial)
    onChange(initial)
    // Mount-only: the URL (else the stored copy) is the INITIAL view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const apply = (next: GeoChoice | null) => {
    setGeoSelection(next === GEO_GLOBAL ? null : next)
    const serialized = serializeGeoChoice(next)
    setParams({ [GEO_PARAM]: serialized })
    if (serialized === null) window.localStorage.removeItem(GEO_STORAGE_KEY)
    else window.localStorage.setItem(GEO_STORAGE_KEY, serialized)
    onChange(next)
  }

  return (
    <div data-testid="vs-geo-row" role="group" aria-label="Country view" className="flex shrink-0 items-center gap-0.5">
      {PILLS.map((p) => {
        const active = value === p.choice
        return (
          <button
            key={p.code}
            type="button"
            data-testid={`vs-geo-${p.code.toLowerCase()}`}
            onClick={() => apply(p.choice)}
            title={p.title}
            aria-pressed={active}
            className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs transition ${
              active
                ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span aria-hidden className="mr-1">{p.flag}</span>
            {p.code}
          </button>
        )
      })}
    </div>
  )
}
