import Sparkline from '@/components/Sparkline'
import type { ScoreHistoryEntry } from '@/lib/schemas'
import { seriesFor, type ScoreMetric, type SeriesPoint } from '@/lib/scoreTrend'

// "Score trend" block for the product page: one sparkline per headline metric (Arena Score /
// aiEra and agent-readiness) with first→last values and dates, fed by
// data/{cat}/score-history.jsonl (see lib/scoreHistory.ts). Server component — the history never
// crosses to the client here. Renders nothing at all when there's no history file/entries yet;
// with entries but <2 plottable points per metric it says so honestly instead of drawing a line.

const METRICS: Array<{ metric: ScoreMetric; label: string }> = [
  { metric: 'aiEra', label: 'Arena Score' },
  { metric: 'agentReady', label: 'Agent-ready' },
]

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function TrendRow({ label, series }: { label: string; series: SeriesPoint[] }) {
  if (series.length < 2) {
    const since = series[0] ? shortDate(series[0].date) : null
    return (
      <div className="flex items-center gap-3">
        <span className="w-24 shrink-0 text-[10px] uppercase tracking-widest text-zinc-400">{label}</span>
        <span className="text-xs italic text-zinc-500">
          {since ? `tracked since ${since} — no movement recorded yet` : 'not tracked yet'}
        </span>
      </div>
    )
  }
  const first = series[0]
  const last = series[series.length - 1]
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-24 shrink-0 text-[10px] uppercase tracking-widest text-zinc-400">{label}</span>
      <Sparkline
        values={series.map((p) => p.value)}
        label={`${label} trend: ${first.value} on ${shortDate(first.date)} to ${last.value} on ${shortDate(last.date)}`}
      />
      <span className="font-mono text-xs tabular-nums text-zinc-400">
        {first.value.toFixed(0)} <span className="text-zinc-600">({shortDate(first.date)})</span>
        <span aria-hidden className="mx-1 text-zinc-600">→</span>
        <span className="text-zinc-200">{last.value.toFixed(0)}</span> <span className="text-zinc-600">({shortDate(last.date)})</span>
      </span>
    </div>
  )
}

export default function ScoreTrend({ entries }: { entries: ScoreHistoryEntry[] }) {
  if (entries.length === 0) return null
  return (
    <div className="rounded-xl border border-zinc-800 p-4">
      <h2 className="font-display leading-[1.1] text-lg font-semibold">Score trend</h2>
      <p className="mt-0.5 text-xs text-zinc-500">
        How this product&rsquo;s scores have moved as evidence and verdicts are re-derived — a point per change, not per day.
      </p>
      <div className="mt-3 space-y-2">
        {METRICS.map(({ metric, label }) => (
          <TrendRow key={metric} label={label} series={seriesFor(entries, metric)} />
        ))}
      </div>
    </div>
  )
}
