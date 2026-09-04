// Pure score-history helpers — parsing, series extraction, and the 30-day trend delta — split
// from lib/scoreHistory.ts (the fs loader) the same way lib/megaTableSort.ts is split from
// lib/megaTable.ts: this module never touches fs, so client components (the watchlist) and
// tests can import it without dragging Node builtins into the client bundle.
import { ScoreHistoryEntrySchema, type ScoreHistoryEntry } from './schemas'

export type ScoreMetric = 'aiEra' | 'agentReady'

export const TREND_WINDOW_DAYS = 30

// Scores are stored (and compared for "did it change?") at 1-decimal precision — the same
// precision lib/scoring.ts emits into rankings.json — so history dedupe never churns on float
// noise.
export function roundScore(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.round(value * 10) / 10
}

// Parses score-history.jsonl text into validated entries. Blank lines are tolerated (a trailing
// newline is the append-friendly file convention); a malformed line is a real error, not
// something to silently drop — the file is machine-written only.
export function parseScoreHistoryJsonl(text: string): ScoreHistoryEntry[] {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => ScoreHistoryEntrySchema.parse(JSON.parse(line)))
}

export interface SeriesPoint {
  date: string
  value: number
}

// One metric's plottable series for one product: null values (metric not applicable at that
// point in time) are dropped, and points are sorted by date — the file is append-ordered
// already, but the backfill (commit dates) and forward-fill (generatedAt) can interleave.
export function seriesFor(entries: ScoreHistoryEntry[], metric: ScoreMetric): SeriesPoint[] {
  return entries
    .flatMap((e) => (typeof e[metric] === 'number' ? [{ date: e.date, value: e[metric] }] : []))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// 30-day trend delta: latest value minus the value that was in effect 30 days ago (the latest
// point at or before the cutoff — the series is change-only, so values carry forward between
// points). When every point is younger than 30 days the earliest point is the baseline (the
// whole observable window). Null when there's nothing to compare (<2 points) — histories only
// days old will mostly be null, and that's honest: no trend yet, not "flat".
export function trendDelta(series: SeriesPoint[], now: Date = new Date(), windowDays: number = TREND_WINDOW_DAYS): number | null {
  if (series.length < 2) return null
  const cutoff = now.getTime() - windowDays * 24 * 60 * 60 * 1000
  let baseline = series[0]
  for (const point of series) {
    if (new Date(point.date).getTime() > cutoff) break
    baseline = point
  }
  const last = series[series.length - 1]
  return roundScore(last.value - baseline.value)
}
