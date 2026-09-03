import type { Verdict } from '@/lib/schemas'

const STYLES: Record<Verdict['verdict'], string> = {
  full: 'bg-emerald-950 text-emerald-300 ring-emerald-800',
  partial: 'bg-emerald-950 text-emerald-300 ring-emerald-800',
  disputed: 'bg-red-950 text-red-300 ring-red-800',
  none: 'bg-zinc-900 text-zinc-500 ring-zinc-700',
  na: 'bg-zinc-900 text-zinc-400 ring-zinc-800 italic',
}

const LABELS: Record<Verdict['verdict'], string> = {
  full: 'full',
  partial: 'partial',
  disputed: 'disputed',
  none: 'none',
  na: 'n/a',
}

// The same glyphs the compact access-glyph strips use (see lib/accessGlyphs.ts), rendered
// inside the chip so readers passively learn the glyph ↔ verdict mapping instead of keeping
// two visual vocabularies in their head. `na` carries no glyph: the dense strips collapse
// none/na into "—", but on a labeled chip "n/a" already says it and a "—" would wrongly
// suggest "none".
const GLYPHS: Record<Verdict['verdict'], string | null> = {
  full: '✓',
  partial: '~',
  disputed: '!',
  none: '—',
  na: null,
}

// Plain-language hover text so a bare chip never needs the legend to be understood.
const TITLES: Record<Verdict['verdict'], string> = {
  full: 'full — clear evidence it delivers',
  partial: 'partial — works, with caveats',
  disputed: 'disputed — evidence conflicts',
  none: 'none — no evidence found either way',
  na: "n/a — question doesn't apply to this kind of product",
}

export default function VerdictBadge({ verdict }: { verdict: Verdict['verdict'] }) {
  const glyph = GLYPHS[verdict]
  return (
    <span
      title={TITLES[verdict]}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STYLES[verdict]}`}
    >
      {glyph && (
        <span aria-hidden className="font-mono not-italic">
          {glyph}
        </span>
      )}
      <span>{LABELS[verdict]}</span>
    </span>
  )
}
