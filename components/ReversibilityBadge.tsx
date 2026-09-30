import { REVERSIBILITY_META, type Reversibility } from '@/lib/processSim'

// Reversibility marker (founder 2026-09-30: "map what is irreversible and what is reversible …
// for ALL processes and process steps"). Deliberately tiny and quiet: reversible renders
// NOTHING (the badge marks doors that close, not the default state of work), painful renders an
// amber ⚠ "hard to undo", irreversible a red ⛔ "irreversible" — each with the full tier
// definition as its tooltip (REVERSIBILITY_META, lib/processSim.ts — client-safe, no node:fs).
// Server-renderable, no state: safe to drop next to any step or process header. The tiers are
// curated in processes/corpus.json and are display-only — no judged number reads them.
const TIER_STYLE: Record<Exclude<Reversibility, 'reversible'>, { glyph: string; className: string }> = {
  painful: {
    glyph: '⚠',
    className: 'bg-amber-400/10 text-amber-300',
  },
  irreversible: {
    glyph: '⛔',
    className: 'bg-red-400/10 text-red-300',
  },
}

export default function ReversibilityBadge({ tier }: { tier: Reversibility }) {
  if (tier === 'reversible') return null
  const style = TIER_STYLE[tier]
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${style.className}`}
      title={REVERSIBILITY_META[tier].definition}
    >
      {style.glyph} {REVERSIBILITY_META[tier].label}
    </span>
  )
}
