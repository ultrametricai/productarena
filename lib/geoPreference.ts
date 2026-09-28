// The reader's country preference (founder GEO ask 2026-09-28: "make GEO a top-level process
// driver at the top of a particular process page or a vendor, so we know how it works across
// the globe"). One preference, five countries — the same set the vendor-geo spike judged
// (lib/vendorGeo.ts) and the process geo notes cover (lib/processes.ts GeoNoteSchema).
//
// This module is the CLIENT-SAFE half (no node:fs — the lib/jurisdictions.ts split convention):
// the country list, labels/flags, the ?geo= URL/localStorage codec, and a tiny per-tab store so
// every geo-aware component on a page (the switcher, the process banner, step markers, vendor
// annotations) shares ONE selection without a context provider re-plumbing the server pages.
//
// URL/localStorage contract (lib/urlState.ts conventions, the JurisdictionToggle precedent):
// the default — 🇺🇸 US — NEVER appears in the URL; ?geo=uk / ?geo=in / ?geo=de / ?geo=fr is the
// shareable non-default state, mirrored to localStorage under `pa-geo`. Components read it on
// MOUNT ONLY, so the static HTML always renders the US default byte-identically and hydrates
// with zero mismatches — geo-conditional UI appears only after the reader (or their stored
// preference) opts in, and no judged number ever moves.

export const GEO_COUNTRIES = ['US', 'UK', 'IN', 'DE', 'FR'] as const
export type GeoCountry = (typeof GEO_COUNTRIES)[number]

/** The non-default selections — everything a ?geo= param can carry. */
export type GeoSelection = Exclude<GeoCountry, 'US'>

// `prose` is the in-sentence form ("the same steps apply in the United Kingdom") — the bare
// label reads wrong inside prose for the two "the" countries.
export const GEO_PREF_META: Record<GeoCountry, { label: string; flag: string; prose: string }> = {
  US: { label: 'United States', flag: '🇺🇸', prose: 'the United States' },
  UK: { label: 'United Kingdom', flag: '🇬🇧', prose: 'the United Kingdom' },
  IN: { label: 'India', flag: '🇮🇳', prose: 'India' },
  DE: { label: 'Germany', flag: '🇩🇪', prose: 'Germany' },
  FR: { label: 'France', flag: '🇫🇷', prose: 'France' },
}

export const GEO_PARAM = 'geo'
export const GEO_STORAGE_KEY = 'pa-geo'

// The /processes-index scope glyphs (only visible while a non-US country is selected): every
// corpus process carries a required geoScope (lib/processes.ts) — 🌐 the work is the same
// everywhere, 🇺🇸 written around US federal law/agencies, 🏛 a US state is the counterparty.
export const GEO_SCOPE_GLYPH: Record<'global' | 'us' | 'us-state', { glyph: string; label: string }> = {
  global: { glyph: '🌐', label: 'Global process — the same steps apply everywhere' },
  us: { glyph: '🇺🇸', label: 'US-centric process — written around US federal law and agencies' },
  'us-state': { glyph: '🏛', label: 'US state-level process — a US state is the counterparty' },
}

// One curated per-country analog of a US-scoped process (the client-safe shape of
// lib/processes.ts GeoNote — same fields, so the server page passes task.geoNotes straight
// through to components/ProcessGeoBanner.tsx without the client bundle touching node:fs).
export interface GeoAnalogNote {
  country: GeoSelection
  summary: string
  actionUrl: string
  actionLabel: string
}

// One (product, country) availability cell of jurisdictions/vendor-geo.json, pre-serialized
// server-side (lib/vendorGeo.ts vendorGeoLookup) so client annotations never touch node:fs.
// Only non-US countries appear — the US default view never annotates anything.
export interface VendorGeoCell {
  status: 'available' | 'partial' | 'unavailable'
  note: string
  sourceUrl: string
}
export type VendorGeoByCountry = Partial<Record<GeoSelection, VendorGeoCell>>
/** Keyed by productId; products the geo spike hasn't judged are simply absent (never guessed). */
export type VendorGeoLookup = Record<string, VendorGeoByCountry>

/** One full "Where it works" chip row (client-safe shape of lib/vendorGeo.ts entries). */
export interface VendorGeoStripRow extends VendorGeoCell {
  country: GeoCountry
  checkedAt: string
}

// Availability glyphs — the same visual language as lib/vendorGeo.ts VENDOR_GEO_STATUS_META,
// duplicated here because that module is server-only (node:fs).
export const GEO_STATUS_META: Record<VendorGeoCell['status'], { glyph: string; label: string }> = {
  available: { glyph: '✓', label: 'available' },
  partial: { glyph: '◐', label: 'partial' },
  unavailable: { glyph: '✕', label: 'not available' },
}

// Tolerant parse of a ?geo= value (or the stored copy): case-insensitive, unknown tokens (and
// 'us' — the default is never a stored/URL state) collapse to null. Never a crash, never an
// invalid country in state.
export function parseGeo(raw: string | null): GeoSelection | null {
  if (!raw) return null
  const token = raw.trim().toUpperCase()
  const hit = GEO_COUNTRIES.find((c) => c === token)
  return hit && hit !== 'US' ? hit : null
}

// Canonical serialization — null for the default US (the caller passes it straight to
// setParams, which deletes the param, and removes the localStorage copy).
export function serializeGeo(selection: GeoSelection | null): string | null {
  return selection === null ? null : selection.toLowerCase()
}

// ---------------------------------------------------------------------------------------------
// The per-tab store. Module-level state in the client bundle: every subscriber sees the same
// selection, GeoSwitcher is the only writer, and the server render never touches it (each
// consumer starts from the US default and syncs in its mount effect — the client-
// personalization contract).

type Listener = () => void
let selection: GeoSelection | null = null
const listeners = new Set<Listener>()

export function getGeoSelection(): GeoSelection | null {
  return selection
}

/** Set + notify. GeoSwitcher owns the URL/localStorage writes; this is state fan-out only. */
export function setGeoSelection(next: GeoSelection | null): void {
  if (selection === next) return
  selection = next
  for (const l of listeners) l()
}

export function subscribeGeoSelection(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
