import {
  VENDOR_GEO_COUNTRY_META, VENDOR_GEO_STATUS_META, vendorGeoFor,
} from '@/lib/vendorGeo'

// The compact "Where it works" line (founder GEO ask 2026-09-28): per-country availability
// chips for the products the vendor-geo spike has judged — evidence, not a score. Each chip
// links to the vendor's OWN page the row rests on (crawl-verified; lib/vendorGeo.ts) and its
// tooltip carries the honest note, including the negatives (Mercury/Brex/Ramp/Gusto are
// US-entity-only; Square has no Germany or India). Server component — renders nothing for the
// many products without rows.
export default function WhereItWorks({ productId }: { productId: string }) {
  const rows = vendorGeoFor(productId)
  if (rows.length === 0) return null
  const statusClass = {
    available: 'border-emerald-400/40 text-emerald-300 hover:border-emerald-400/80',
    partial: 'border-amber-400/40 text-amber-300 hover:border-amber-400/80',
    unavailable: 'border-zinc-800 text-zinc-500 hover:border-zinc-600',
  } as const
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <span
        className="text-[10px] uppercase tracking-widest text-zinc-500"
        title="Region availability from the vendor's own pages (help center, docs, availability tables) — crawl-verified evidence, not a score. ✓ available · ◐ partial · ✕ not available. Each chip links to the source."
      >
        Where it works
      </span>
      {rows.map((r) => {
        const c = VENDOR_GEO_COUNTRY_META[r.country]
        const s = VENDOR_GEO_STATUS_META[r.status]
        return (
          <a
            key={r.country}
            href={r.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`${c.label} — ${s.label}: ${r.note} (vendor source, checked ${r.checkedAt})`}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${statusClass[r.status]}`}
          >
            <span aria-hidden>{c.flag}</span>
            {r.country}
            <span aria-hidden className="font-mono text-[10px]">{s.glyph}</span>
            <span className="sr-only">{s.label}</span>
          </a>
        )
      })}
    </div>
  )
}
