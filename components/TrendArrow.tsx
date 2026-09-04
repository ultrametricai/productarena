// 30-day Arena Score trend glyph for table rows: ▲ (emerald, moved up) / ▼ (red, moved down) /
// — (zinc, flat or no trend yet — a null delta means <2 history points, see lib/scoreTrend.ts's
// trendDelta, and renders the same quiet dash rather than implying "flat"). Pure props → markup,
// safe in both server and client trees.
export default function TrendArrow({ delta }: { delta: number | null | undefined }) {
  const d = delta ?? null
  const glyph = d !== null && d > 0 ? '▲' : d !== null && d < 0 ? '▼' : '—'
  const color = d !== null && d > 0 ? 'text-emerald-400' : d !== null && d < 0 ? 'text-red-400' : 'text-zinc-600'
  return (
    <span className={`text-[10px] leading-none ${color}`} title="30-day Arena Score trend">
      {glyph}
      <span className="sr-only">
        {d === null ? 'no 30-day Arena Score trend yet' : d > 0 ? `Arena Score up ${d} in 30 days` : d < 0 ? `Arena Score down ${Math.abs(d)} in 30 days` : 'Arena Score flat over 30 days'}
      </span>
    </span>
  )
}
