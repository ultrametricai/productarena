'use client'

import GeoSwitcher from '@/components/GeoSwitcher'
import { useGeoSelection } from '@/components/useGeoSelection'
import {
  GEO_PREF_META,
  GEO_STATUS_META,
  type VendorGeoStripRow,
} from '@/lib/geoPreference'

// The header-level "Where it works" strip (founder GEO ask 2026-09-28 — promoted from the old
// compact server-rendered line): per-country availability chips for the products the vendor-geo
// spike judged, now with the global GeoSwitcher alongside. Under a non-US selection the
// selected country's chip highlights and its honest note shows inline; the US default renders
// the exact same chips as before, and the static HTML never carries a selection (the
// client-personalization contract — mount-only reads via the shared store).
//
// Each chip stays a LINK to the vendor's OWN page the row rests on (crawl-verified,
// lib/vendorGeo.ts) with the note in its tooltip — evidence, not a score.
export default function WhereItWorksStrip({ rows }: { rows: VendorGeoStripRow[] }) {
  const geo = useGeoSelection()
  const statusClass = {
    available: 'border-emerald-400/40 text-emerald-300 hover:border-emerald-400/80',
    partial: 'border-amber-400/40 text-amber-300 hover:border-amber-400/80',
    unavailable: 'border-zinc-800 text-zinc-500 hover:border-zinc-600',
  } as const
  const selectedRow = geo === null ? undefined : rows.find((r) => r.country === geo)
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span
          className="text-[10px] uppercase tracking-widest text-zinc-500"
          title="Region availability from the vendor's own pages (help center, docs, availability tables) — crawl-verified evidence, not a score. ✓ available · ◐ partial · ✕ not available. Each chip links to the source."
        >
          Where it works
        </span>
        {rows.map((r) => {
          const c = GEO_PREF_META[r.country]
          const s = GEO_STATUS_META[r.status]
          return (
            <a
              key={r.country}
              href={r.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`${c.label} — ${s.label}: ${r.note} (vendor source, checked ${r.checkedAt})`}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${statusClass[r.status]}${
                geo === r.country ? ' bg-emerald-400/10 ring-1 ring-emerald-400/50' : ''
              }`}
            >
              <span aria-hidden>{c.flag}</span>
              {r.country}
              <span aria-hidden className="font-mono text-[10px]">{s.glyph}</span>
              <span className="sr-only">{s.label}</span>
            </a>
          )
        })}
        {/* The global geo switcher (lib/geoPreference.ts) — same ?geo=/pa-geo preference the
            process pages honor; rendered only for spiked products, so unspiked product pages
            stay exactly as before. */}
        <GeoSwitcher />
      </div>
      {/* The selected country's committed note, inline — nothing for the US default, and
          nothing (no guess) when the spike has no row for that country. */}
      {selectedRow && (
        <p className="mt-1.5 max-w-2xl text-xs text-zinc-400">
          <span aria-hidden className="mr-1">{GEO_PREF_META[selectedRow.country].flag}</span>
          <span className="text-zinc-300">
            {GEO_PREF_META[selectedRow.country].label} — {GEO_STATUS_META[selectedRow.status].label}:
          </span>{' '}
          {selectedRow.note}{' '}
          <a
            href={selectedRow.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 underline decoration-zinc-700 underline-offset-2 transition hover:text-emerald-300"
            title={`The vendor's own page this row rests on — checked ${selectedRow.checkedAt}`}
          >
            source ↗
          </a>
        </p>
      )}
    </div>
  )
}
