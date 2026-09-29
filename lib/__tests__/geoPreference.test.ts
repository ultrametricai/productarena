import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  GEO_COUNTRIES,
  GEO_GLOBAL,
  GEO_PREF_META,
  GEO_SCOPE_GLYPH,
  getGeoSelection,
  parseGeo,
  parseGeoChoice,
  serializeGeo,
  serializeGeoChoice,
  setGeoSelection,
  subscribeGeoSelection,
} from '@/lib/geoPreference'

// The geo preference's client-safe half (founder GEO ask 2026-09-28): the ?geo=/pa-geo codec —
// tolerant on read, canonical on write, the US default never serialized — and the per-tab store
// every geo-aware component shares.

afterEach(() => setGeoSelection(null))

describe('?geo= codec', () => {
  it('parses tolerantly: case-insensitive, whitespace ignored, every non-US country accepted', () => {
    expect(parseGeo('uk')).toBe('UK')
    expect(parseGeo('UK')).toBe('UK')
    expect(parseGeo(' de ')).toBe('DE')
    expect(parseGeo('in')).toBe('IN')
    expect(parseGeo('fr')).toBe('FR')
  })

  it('collapses the default and junk to null — never a crash, never an invalid country', () => {
    // 'us' is the default, not a selection — it never round-trips through URL or storage.
    expect(parseGeo('us')).toBeNull()
    expect(parseGeo(null)).toBeNull()
    expect(parseGeo('')).toBeNull()
    expect(parseGeo('narnia')).toBeNull()
    expect(parseGeo('uk,de')).toBeNull() // single-valued — a list is not a selection
  })

  it('serializes canonically: lowercase country, null for the US default (param deleted)', () => {
    expect(serializeGeo('UK')).toBe('uk')
    expect(serializeGeo('FR')).toBe('fr')
    expect(serializeGeo(null)).toBeNull()
    // Round trip: everything serializable parses back to itself.
    for (const c of ['UK', 'IN', 'DE', 'FR'] as const) {
      expect(parseGeo(serializeGeo(c))).toBe(c)
    }
  })
})

// The 'global' token (Virtual Startup batch 2026-09-29) — ADDITIVE: parseGeo/serializeGeo above
// are untouched (a stray ?geo=global on a process page still collapses to the null default,
// which is exactly what geo-neutral means there), and only the choice-level codec knows it.
describe('the GeoChoice codec (countries + the explicit 🌐 Global)', () => {
  it('parses every country exactly like parseGeo, plus the global token (case-insensitive)', () => {
    expect(parseGeoChoice('uk')).toBe('UK')
    expect(parseGeoChoice(' de ')).toBe('DE')
    expect(parseGeoChoice('global')).toBe(GEO_GLOBAL)
    expect(parseGeoChoice('GLOBAL')).toBe(GEO_GLOBAL)
    // The default and junk still collapse to null — never an invalid choice in state.
    expect(parseGeoChoice('us')).toBeNull()
    expect(parseGeoChoice(null)).toBeNull()
    expect(parseGeoChoice('narnia')).toBeNull()
  })

  it('serializes canonically and round-trips; the base parseGeo NEVER learns the token', () => {
    expect(serializeGeoChoice(GEO_GLOBAL)).toBe('global')
    expect(serializeGeoChoice('UK')).toBe('uk')
    expect(serializeGeoChoice(null)).toBeNull()
    for (const c of ['UK', 'IN', 'DE', 'FR', GEO_GLOBAL] as const) {
      expect(parseGeoChoice(serializeGeoChoice(c))).toBe(c)
    }
    // Default byte-identical guarantee for existing consumers: a stored/URL 'global' is the
    // null default to every parseGeo call site (banner, marks, annotations render nothing).
    expect(parseGeo('global')).toBeNull()
  })
})

describe('the shared per-tab store', () => {
  it('starts at the US default, sets, notifies subscribers, and de-dupes identical sets', () => {
    expect(getGeoSelection()).toBeNull()
    const listener = vi.fn()
    const unsubscribe = subscribeGeoSelection(listener)
    setGeoSelection('UK')
    expect(getGeoSelection()).toBe('UK')
    expect(listener).toHaveBeenCalledTimes(1)
    setGeoSelection('UK') // no-op — no notification storm
    expect(listener).toHaveBeenCalledTimes(1)
    setGeoSelection(null)
    expect(getGeoSelection()).toBeNull()
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    setGeoSelection('DE')
    expect(listener).toHaveBeenCalledTimes(2)
  })
})

describe('display metadata', () => {
  it('covers all five countries and all three geo scopes', () => {
    expect(GEO_COUNTRIES).toEqual(['US', 'UK', 'IN', 'DE', 'FR'])
    for (const c of GEO_COUNTRIES) {
      expect(GEO_PREF_META[c].label).toBeTruthy()
      expect(GEO_PREF_META[c].flag).toBeTruthy()
    }
    for (const s of ['global', 'us', 'us-state'] as const) {
      expect(GEO_SCOPE_GLYPH[s].glyph).toBeTruthy()
      expect(GEO_SCOPE_GLYPH[s].label).toBeTruthy()
    }
  })
})
