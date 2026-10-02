import { IconGlyph } from '@/components/IconChip'
import { URGENCY_ICONS } from '@/lib/processIcons'
import { URGENCY_META, type Urgency } from '@/lib/processSim'

// Urgency chip for SITUATIONS (founder 2026-10-01: reactive, trigger-driven records in the
// process corpus). Same quiet idiom as ReversibilityBadge, but every tier renders — urgency is
// the point of a situation, not an exception state: red siren within hours, amber overdue clock
// within days, sky calendar within weeks (house glyphs from the custom icon set, founder
// 2026-10-02 — the 🚨/⏰/🗓 emoji retired; lib/processIcons.ts URGENCY_ICONS keeps the tier→glyph
// truth). Each tier carries its full definition as the chip tooltip (URGENCY_META,
// lib/processSim.ts — client-safe, no node:fs). Server-renderable, no state: used on the
// /situations rows and the situation page header. Display-only — the tier is curated in
// processes/corpus.json and no judged number reads it.
const TIER_STYLE: Record<Urgency, { className: string }> = {
  hours: {
    className: 'bg-red-400/10 text-red-300',
  },
  days: {
    className: 'bg-amber-400/10 text-amber-300',
  },
  weeks: {
    className: 'bg-sky-400/10 text-sky-300',
  },
}

export default function UrgencyChip({ tier }: { tier: Urgency }) {
  const style = TIER_STYLE[tier]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${style.className}`}
      title={URGENCY_META[tier].definition}
    >
      {/* Bare glyph is allowed here: this chip's own title names the concept (IconChip rule). */}
      <span aria-hidden className="inline-flex">
        <IconGlyph icon={URGENCY_ICONS[tier]} />
      </span>
      {URGENCY_META[tier].label}
    </span>
  )
}
