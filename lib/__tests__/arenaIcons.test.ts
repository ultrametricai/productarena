import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { GLYPHS } from '@/components/icons/ProcessIcon'
import { DECISION_ICONS, ROW_ICONS } from '@/components/VirtualStartup'
import {
  ARENA_ICONS, ARENA_SECTION_HUES, arenaIcon, EXPLORE_SECTION_ICONS, MOBILE_NAV_ICONS, OVERALL_ICON,
} from '@/lib/arenaIcons'
import { loadArenaSections } from '@/lib/arenaSections'
import { loadCategories } from '@/lib/data'
import { parseProcessIconToken } from '@/lib/processIcons'

const DATA_DIR = path.resolve(__dirname, '../../data')

// Same contract as the process set (lib/__tests__/processIcons.test.ts): a curated icon must be
// a house token (`pi:<glyph>:<hue>`) naming a DESIGNED glyph — a token pointing at a glyph
// nobody drew would render the honest-fallback placeholder, which is a design failure.
const resolvesToDesignedGlyph = (s: string) => {
  const parsed = parseProcessIconToken(s)
  return parsed !== null && parsed.glyph in GLYPHS
}

describe('arena icon coverage (totality over the live arenas)', () => {
  it('every live arena has a curated icon resolving to a designed glyph', () => {
    for (const category of loadCategories(DATA_DIR)) {
      const icon = arenaIcon(category.id)
      expect(
        resolvesToDesignedGlyph(icon),
        `arena ${category.id} (${category.name}) needs a curated icon naming a designed glyph (got '${icon}')`,
      ).toBe(true)
    }
  })

  it('no stale mappings: every curated key is a live arena id', () => {
    const ids = new Set(loadCategories(DATA_DIR).map((c) => c.id))
    for (const id of Object.keys(ARENA_ICONS)) {
      expect(ids.has(id), `ARENA_ICONS has stale arena id ${id}`).toBe(true)
    }
  })

  it("every arena's hue follows its curated section (data/arena-sections.json)", () => {
    for (const section of loadArenaSections(path.join(DATA_DIR, 'arena-sections.json'))) {
      const hue = ARENA_SECTION_HUES[section.id]
      expect(hue, `section ${section.id} needs a hue in ARENA_SECTION_HUES`).toBeTruthy()
      for (const id of section.arenaIds) {
        const parsed = parseProcessIconToken(arenaIcon(id))
        expect(parsed?.hue, `arena ${id} must wear its section's hue (${section.id} → ${hue})`).toBe(hue)
      }
    }
  })

  it('the menu/site chrome tokens (Overall, Explore sections, mobile nav) name designed glyphs', () => {
    expect(resolvesToDesignedGlyph(OVERALL_ICON)).toBe(true)
    for (const [key, token] of Object.entries(EXPLORE_SECTION_ICONS)) {
      expect(resolvesToDesignedGlyph(token), `EXPLORE_SECTION_ICONS.${key} must name a designed glyph`).toBe(true)
    }
    for (const [href, token] of Object.entries(MOBILE_NAV_ICONS)) {
      expect(resolvesToDesignedGlyph(token), `MOBILE_NAV_ICONS['${href}'] must name a designed glyph`).toBe(true)
    }
  })

  it("the sim's control tokens (setup rows, decisions) name designed glyphs", () => {
    for (const [key, entry] of Object.entries(ROW_ICONS)) {
      expect(resolvesToDesignedGlyph(entry.icon), `ROW_ICONS.${key} must name a designed glyph`).toBe(true)
    }
    for (const [key, token] of Object.entries(DECISION_ICONS)) {
      expect(resolvesToDesignedGlyph(token), `DECISION_ICONS.${key} must name a designed glyph`).toBe(true)
    }
  })
})
