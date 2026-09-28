'use client'

import { useGeoSelection } from '@/components/useGeoSelection'
import { GEO_PREF_META } from '@/lib/geoPreference'

// The subtle per-step 🇺🇸 marker (founder GEO ask 2026-09-28): while a non-US country is
// selected, steps that are US-specific — every step of a us/us-state-scoped process (the server
// gates rendering on geoScope), and the jurisdiction-conditional steps in
// components/JurisdictionToggle.tsx — carry a quiet flag naming the mismatch. Renders NOTHING
// in the static HTML and for the US default (the client-personalization contract), so the
// default page stays byte-identical. Annotation only: routes, ceilings and rankings never move.
export default function GeoStepMark() {
  const geo = useGeoSelection()
  if (geo === null) return null
  return (
    <span
      aria-hidden
      className="ml-1.5 text-[10px] opacity-60"
      title={`US-specific step — this flow is written around US law/agencies; you are viewing the page from ${GEO_PREF_META[geo].prose}`}
    >
      🇺🇸
    </span>
  )
}
