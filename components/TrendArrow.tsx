// 30-day trend glyph for table rows: ▲ (emerald, moved up) / ▼ (red, moved down) /
// — (zinc, flat or no trend yet — a null delta means <2 history points, see lib/scoreTrend.ts's
// trendDelta, and renders the same quiet dash rather than implying "flat"). Pure props → markup,
// safe in both server and client trees.
//
// `metric` names what moved (defaults to the Arena Score; the mega-table's Agent-ready column
// passes its own) — it drives both the hover title and the screen-reader text.
export default function TrendArrow({
  delta,
  metric = 'Arena Score',
}: {
  delta: number | null | undefined
  metric?: string
}) {
  const d = delta ?? null
  const glyph = d !== null && d > 0 ? '▲' : d !== null && d < 0 ? '▼' : '—'
  const color = d !== null && d > 0 ? 'text-emerald-400' : d !== null && d < 0 ? 'text-red-400' : 'text-zinc-600'
  return (
    // `relative` keeps the absolutely-positioned sr-only span contained here, so rows scrolled
    // out of an overflow-x-auto table wrapper can't widen the whole document on mobile.
    <span className={`relative text-[10px] leading-none ${color}`} title={`30-day ${metric} trend`}>
      {glyph}
      <span className="sr-only">
        {d === null ? `no 30-day ${metric} trend yet` : d > 0 ? `${metric} up ${d} in 30 days` : d < 0 ? `${metric} down ${Math.abs(d)} in 30 days` : `${metric} flat over 30 days`}
      </span>
    </span>
  )
}
