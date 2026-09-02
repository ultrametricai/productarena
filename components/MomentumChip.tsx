import { formatCompact, hasSignal } from '@/lib/popularity'
import type { Popularity } from '@/lib/schemas'

// Momentum/popularity chip — a keyless, evidence-free "will this project be alive tomorrow?"
// signal (see pipeline/stages/popularity.ts). Deliberately NOT styled like AiEraBadge/ScoreBar
// (no amber "score" treatment): this is adoption data from public registries, not a judged
// verdict, and must never look like it's part of the INIT Score (see METHODOLOGY.md's
// "Popularity is not part of the INIT Score" section).
//
// `compact` (dense table cells) renders nothing at all when there's no signal, so a column full
// of empty products doesn't turn into a wall of muted placeholder text. The full-size variant
// (product page header) instead renders a muted "no public signals" so a reader doesn't wonder
// whether the chip failed to load.
export default function MomentumChip({
  popularity,
  compact = false,
}: {
  popularity: Popularity | undefined
  compact?: boolean
}) {
  if (!hasSignal(popularity)) {
    if (compact) return null
    return <span className="text-xs text-zinc-500">no public signals</span>
  }

  const title = `Popularity signal as of ${popularity.fetchedAt.slice(0, 10)} — sourced from public registries (GitHub/npm/PyPI), not part of the INIT Score.`

  return (
    <span title={title} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-xs text-zinc-400">
      {popularity.stars !== undefined && (
        <span className="text-zinc-300">★ {formatCompact(popularity.stars)}</span>
      )}
      {popularity.starsPerYear !== undefined && (
        <span className="text-emerald-400">▲ {formatCompact(popularity.starsPerYear)}/yr</span>
      )}
      {popularity.npmWeekly !== undefined && <span>npm {formatCompact(popularity.npmWeekly)}/wk</span>}
      {popularity.pypiWeekly !== undefined && <span>pypi {formatCompact(popularity.pypiWeekly)}/wk</span>}
    </span>
  )
}
