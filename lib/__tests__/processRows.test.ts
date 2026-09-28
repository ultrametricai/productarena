// The phase → area display map (founder 2026-09-28): friendly founder-lifecycle areas are the
// primary grouping on the "All processes" table, so the map must stay TOTAL over the live
// corpus — a newly added phase without a curated area must fail HERE, loudly, not render a
// stray or missing group in production.
import { describe, expect, it } from 'vitest'
import { loadProcesses } from '@/lib/processes'
import { AREA_ORDER, areaOf, areaRank, buildProcessRows, PHASE_AREA } from '@/lib/processRows'

describe('phase → area display map (lib/processRows.ts)', () => {
  it('is total over the live corpus: every phase maps to exactly one curated area', () => {
    const phases = [...new Set(loadProcesses().map((t) => t.phase))]
    expect(phases.length).toBeGreaterThan(0)
    for (const phase of phases) {
      // areaOf throws on an unmapped phase — a new corpus phase fails this walk loudly.
      const area = areaOf(phase)
      expect(AREA_ORDER, `phase "${phase}" must map into AREA_ORDER`).toContain(area)
    }
  })

  it('throws loudly for a phase with no curated area', () => {
    expect(() => areaOf('interdimensional-tax')).toThrowError(/No display area mapped for phase "interdimensional-tax"/)
  })

  it('every mapped area sits in AREA_ORDER with a real lifecycle rank', () => {
    for (const area of Object.values(PHASE_AREA)) {
      expect(areaRank(area), `area "${area}" must have an AREA_ORDER rank`).toBeGreaterThanOrEqual(0)
    }
    // And an unknown area reads as unranked, not silently first.
    expect(areaRank('Not an area')).toBe(-1)
  })

  it('built rows carry the area + rank the grouped table renders', () => {
    const { rows } = buildProcessRows()
    for (const r of rows) {
      expect(r.area).toBe(areaOf(r.phase))
      expect(r.areaRank).toBe(areaRank(r.area))
    }
  })
})
