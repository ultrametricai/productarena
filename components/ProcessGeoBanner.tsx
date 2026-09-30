'use client'

import { useGeoChoice } from '@/components/useGeoSelection'
import { GEO_GLOBAL, GEO_GLOBAL_META, GEO_PREF_META, type GeoAnalogNote } from '@/lib/geoPreference'

// The top-of-page geo banner (founder GEO ask 2026-09-28: "make GEO a top-level process driver
// at the top of a particular process page"): under a non-US selection it says, from COMMITTED
// data only, what this process means in that country. Renders right under the GeoSwitcher in
// the process header; renders NOTHING in the static HTML and for the US default, so the
// default page stays byte-identical (the client-personalization contract, lib/geoPreference.ts).
//
// Honesty per (geoScope × notes) — the unsupported-never-guessed doctrine:
//   geoScope 'global', no note  → "Global process — the same steps apply in {country}."
//   'global', note found        → same core-steps line PLUS the country's curated local flavor
//                                 (the 2026-09-29 mapping expansion: a global process can be
//                                 jurisdictionally flavored — stamp duty, e-invoicing, GDPR).
//   'us'/'us-state', note found → "US-centric process." + the country's curated analog
//                                 (summary + verified actionUrl), promoted from the buried
//                                 "Outside the US" block, with a link down to it.
//   'us'/'us-state', no note    → "No {country} mapping yet — this workflow is US-specific."
//                                 An analog is never fabricated.
export default function ProcessGeoBanner({
  geoScope,
  notes,
}: {
  geoScope: 'global' | 'us' | 'us-state'
  notes: GeoAnalogNote[]
}) {
  const geo = useGeoChoice()
  if (geo === null) return null

  // 🌐 Global (founder 2026-09-30: "show the GENERAL process without country-specifics"): the
  // country-agnostic lens — per-country analogs are summarized as AVAILABILITY ONLY (which
  // countries carry a curated mapping, nothing promoted), and the page's country-conditional
  // UI (jurisdiction steps, geo auto-preselects, vendor availability marks) stands down. A
  // display lens over the same committed data: no judged number moves.
  if (geo === GEO_GLOBAL) {
    return (
      <div className="mt-3 max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm">
        <p className="text-zinc-300">
          <span aria-hidden className="mr-1.5">{GEO_GLOBAL_META.flag}</span>
          <span className="font-medium text-zinc-100">Global view</span> — the process in its
          country-agnostic form
          {geoScope !== 'global' && (
            <span className="text-zinc-400"> (the flow itself is documented US-first)</span>
          )}
          : country-specific steps, per-country analogs and vendor availability marks are hidden.
        </p>
        {notes.length > 0 && (
          <p className="mt-1.5 text-xs text-zinc-400">
            Country mappings exist for{' '}
            {notes.map((n, i) => (
              <span key={n.country} title={`${GEO_PREF_META[n.country].label} — pick the country to see its curated mapping`}>
                {i > 0 && ' · '}
                <span aria-hidden className="mr-0.5">{GEO_PREF_META[n.country].flag}</span>
                {GEO_PREF_META[n.country].label}
              </span>
            ))}{' '}
            — pick a country above for the detail.
          </p>
        )}
      </div>
    )
  }

  const meta = GEO_PREF_META[geo]

  const note = notes.find((n) => n.country === geo)

  if (geoScope === 'global') {
    return (
      <div className="mt-3 max-w-2xl rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-3 py-2 text-sm">
        <p className="text-zinc-300">
          <span aria-hidden className="mr-1.5">{meta.flag}</span>
          <span className="font-medium text-emerald-300">Global process</span> — the same
          {note ? ' core' : ''} steps apply in {meta.prose}.
          {/* The curated local flavor, when this global process has one for the country —
              committed data only (corpus geoNotes), never inferred. */}
          {note && (
            <>
              {' '}Local flavor: <span className="text-zinc-300">{note.summary}</span>
            </>
          )}
        </p>
        {note && (
          <p className="mt-1.5 text-xs">
            <a
              href={note.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 transition hover:text-emerald-200"
              title={`${meta.label} — the canonical portal for this work (verified live)`}
            >
              {note.actionLabel} ↗
            </a>
            <span className="mx-1.5 text-zinc-700">·</span>
            <a
              href="#outside-the-us"
              className="text-zinc-400 underline decoration-zinc-700 underline-offset-2 transition hover:text-emerald-300"
              title="The full multi-country detail — every curated per-country note on this process"
            >
              all countries ↓
            </a>
          </p>
        )}
      </div>
    )
  }
  if (!note) {
    return (
      <p className="mt-3 max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-400">
        <span aria-hidden className="mr-1.5">{meta.flag}</span>
        <span className="font-medium text-zinc-300">US-centric process.</span> No {meta.label}{' '}
        mapping yet — this workflow is US-specific.
        {notes.length > 0 && (
          <>
            {' '}
            <a
              href="#outside-the-us"
              className="text-zinc-500 underline decoration-zinc-700 underline-offset-2 transition hover:text-emerald-300"
              title="Countries this process IS mapped for — the curated per-country analogs below"
            >
              other countries ↓
            </a>
          </>
        )}
      </p>
    )
  }

  return (
    <div className="mt-3 max-w-2xl rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-3 py-2 text-sm">
      <p className="text-zinc-300">
        <span aria-hidden className="mr-1.5">{meta.flag}</span>
        <span className="font-medium text-zinc-100">US-centric process.</span> In {meta.prose}:{' '}
        <span className="text-zinc-300">{note.summary}</span>
      </p>
      <p className="mt-1.5 text-xs">
        <a
          href={note.actionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 transition hover:text-emerald-200"
          title={`${meta.label} — the canonical portal for this work (verified live)`}
        >
          {note.actionLabel} ↗
        </a>
        {/* The "Outside the US" block below always exists here — this process has notes. */}
        <span className="mx-1.5 text-zinc-700">·</span>
        <a
          href="#outside-the-us"
          className="text-zinc-400 underline decoration-zinc-700 underline-offset-2 transition hover:text-emerald-300"
          title="The full multi-country detail — every curated per-country analog of this process"
        >
          all countries ↓
        </a>
      </p>
    </div>
  )
}
