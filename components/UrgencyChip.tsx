import { URGENCY_META, type Urgency } from '@/lib/processSim'

// Urgency chip for SITUATIONS (founder 2026-10-01: reactive, trigger-driven records in the
// process corpus). Same quiet idiom as ReversibilityBadge, but every tier renders — urgency is
// the point of a situation, not an exception state: red 🚨 within hours, amber ⏰ within days,
// sky 🗓 within weeks, each with the full tier definition as its tooltip (URGENCY_META,
// lib/processSim.ts — client-safe, no node:fs). Server-renderable, no state: used on the
// /processes situation rows and the situation page header. Display-only — the tier is curated
// in processes/corpus.json and no judged number reads it.
const TIER_STYLE: Record<Urgency, { glyph: string; className: string }> = {
  hours: {
    glyph: '🚨',
    className: 'bg-red-400/10 text-red-300',
  },
  days: {
    glyph: '⏰',
    className: 'bg-amber-400/10 text-amber-300',
  },
  weeks: {
    glyph: '🗓',
    className: 'bg-sky-400/10 text-sky-300',
  },
}

export default function UrgencyChip({ tier }: { tier: Urgency }) {
  const style = TIER_STYLE[tier]
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${style.className}`}
      title={URGENCY_META[tier].definition}
    >
      {style.glyph} {URGENCY_META[tier].label}
    </span>
  )
}
