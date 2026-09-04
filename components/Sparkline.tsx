import { sparklinePoints } from '@/lib/sparkline'

// Tiny inline SVG trend line — no chart library, just one <path> (math in lib/sparkline.ts).
// Server-safe and client-safe (pure props → markup), used on product pages ("Score trend") and
// in the watchlist. Renders nothing with fewer than 2 points: a single measurement is not a
// trend, and an empty box would imply "flat" rather than "unknown".
export default function Sparkline({
  values,
  width = 90,
  height = 24,
  label,
  className = '',
}: {
  values: number[]
  width?: number
  height?: number
  // Accessible name; when omitted the line is decorative (aria-hidden).
  label?: string
  className?: string
}) {
  const points = sparklinePoints(values, width, height)
  if (!points) return null
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const end = points[points.length - 1]
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={`shrink-0 ${className}`}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <path d={d} fill="none" className="stroke-emerald-400" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={end.x} cy={end.y} r={2} className="fill-emerald-400" />
    </svg>
  )
}
