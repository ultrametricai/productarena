import Sparkline from '@/components/Sparkline'
import { formatCompact } from '@/lib/popularity'
import type { SeriesPoint } from '@/lib/scoreTrend'

// Tiny momentum sparklines for the product-page header — stars (and npm/pypi weekly downloads,
// when tracked) over time from data/{cat}/popularity-history.jsonl (see lib/popularityHistory.ts),
// rendered next to MomentumChip's point-in-time numbers. Same visual restraint as the chip: this
// is adoption data from public registries, never part of the PA Score, so it stays small,
// mono, and mostly zinc. Series with <2 distinct snapshots render nothing at all — one
// measurement is a number (the chip already shows it), not a trend.

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function fmtDelta(delta: number): string {
  if (delta === 0) return '±0'
  return `${delta > 0 ? '+' : ''}${formatCompact(delta)}`
}

export interface MomentumSeries {
  /** Short unit label, e.g. "★", "npm/wk", "pypi/wk". */
  label: string
  points: SeriesPoint[]
}

export default function MomentumTrend({ series }: { series: MomentumSeries[] }) {
  const drawable = series.filter((s) => s.points.length >= 2)
  if (drawable.length === 0) return null
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {drawable.map(({ label, points }) => {
        const first = points[0]
        const last = points[points.length - 1]
        const delta = last.value - first.value
        return (
          <span
            key={label}
            title={`${label}: ${formatCompact(first.value)} on ${shortDate(first.date)} → ${formatCompact(last.value)} on ${shortDate(last.date)} — public registry snapshots, not part of the PA Score.`}
            className="flex items-center gap-1.5"
          >
            <Sparkline
              values={points.map((p) => p.value)}
              width={56}
              height={16}
              label={`${label} trend: ${formatCompact(first.value)} on ${shortDate(first.date)} to ${formatCompact(last.value)} on ${shortDate(last.date)}`}
            />
            <span className="font-mono text-[10px] text-zinc-500">
              {label} <span className={delta > 0 ? 'text-emerald-400' : 'text-zinc-400'}>{fmtDelta(delta)}</span>
            </span>
          </span>
        )
      })}
    </span>
  )
}
