import WhereItWorksStrip from '@/components/WhereItWorksStrip'
import { vendorGeoFor } from '@/lib/vendorGeo'

// "Where it works" (founder GEO ask 2026-09-28): per-country availability chips for the
// products the vendor-geo spike has judged — evidence, not a score, each chip linking to the
// vendor's OWN page the row rests on (crawl-verified; lib/vendorGeo.ts) with the honest note in
// its tooltip, negatives included (Mercury/Brex/Ramp/Gusto are US-entity-only; Square has no
// Germany or India). This server half only loads the committed rows; the header-level strip —
// chips + the global GeoSwitcher + the selected country's inline note — is the client half
// (components/WhereItWorksStrip.tsx). Renders nothing for the many products without rows, so
// those pages are untouched.
export default function WhereItWorks({ productId }: { productId: string }) {
  const rows = vendorGeoFor(productId)
  if (rows.length === 0) return null
  return (
    <WhereItWorksStrip
      rows={rows.map((r) => ({
        country: r.country,
        status: r.status,
        sourceUrl: r.sourceUrl,
        note: r.note,
        checkedAt: r.checkedAt,
      }))}
    />
  )
}
