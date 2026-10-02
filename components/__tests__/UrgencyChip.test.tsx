// @vitest-environment jsdom
// UrgencyChip — the situation clock chip, now wearing house glyphs instead of the 🚨/⏰/🗓 emoji
// (founder 2026-10-02). Pins: each tier renders its URGENCY_ICONS glyph (siren/clock-alert/
// calendar) in the tier's semantic hue class, the full tier definition stays the tooltip, and
// no emoji survives in the chip text.
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import UrgencyChip from '@/components/UrgencyChip'
import { URGENCY_META, URGENCY_TIERS, type Urgency } from '@/lib/processSim'

const EXPECTED: Record<Urgency, { glyph: string; hueClass: string }> = {
  hours: { glyph: 'siren', hueClass: 'text-red-300' },
  days: { glyph: 'clock-alert', hueClass: 'text-amber-300' },
  weeks: { glyph: 'calendar', hueClass: 'text-sky-300' },
}

describe('UrgencyChip', () => {
  it.each(URGENCY_TIERS)('%s: house glyph in the tier hue, label + definition tooltip, no emoji', (tier) => {
    const { container } = render(<UrgencyChip tier={tier} />)
    const chip = container.querySelector('span[title]') as HTMLElement
    expect(chip.getAttribute('title')).toBe(URGENCY_META[tier].definition)
    expect(chip.className).toContain(EXPECTED[tier].hueClass)
    expect(chip.textContent).toContain(URGENCY_META[tier].label)
    expect(container.querySelector(`svg[data-glyph="${EXPECTED[tier].glyph}"]`)).not.toBeNull()
    expect(chip.textContent).not.toMatch(/[🚨⏰🗓]/u)
  })
})
