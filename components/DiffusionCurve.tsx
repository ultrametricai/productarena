import type { DiffusionPoint } from '@/lib/diffusion'

// Capability diffusion curve for a /global/[story] page — % adoption vs month, one emerald
// line on the zinc surface (a slightly larger cousin of components/Sparkline.tsx, with axes).
// Server-safe pure props → markup, no chart library. Renders nothing with fewer than 2 points:
// a single month of tracking is a headline stat, not a curve (the page says "tracking since …"
// instead). Y axis is fixed 0–100%: adoption is a share, and a zoomed axis would dramatize
// noise. Grid and axis text stay recessive (zinc); only the data line carries the accent.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatMonth(month: string): string {
  const [y, m] = month.split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}

const round2 = (n: number) => Math.round(n * 100) / 100

export default function DiffusionCurve({ points, label }: { points: DiffusionPoint[]; label: string }) {
  if (points.length < 2) return null

  const width = 520
  const height = 170
  const pad = { top: 12, right: 46, bottom: 24, left: 38 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const x = (i: number) => round2(pad.left + (i / (points.length - 1)) * innerW)
  const y = (pct: number) => round2(pad.top + (1 - pct / 100) * innerH)

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.pct)}`).join(' ')
  const last = points[points.length - 1]

  // At most ~6 x labels so months never collide at narrow curves.
  const labelStep = Math.max(1, Math.ceil(points.length / 6))
  const xLabelIdx = points.map((_, i) => i).filter((i) => i % labelStep === 0 || i === points.length - 1)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-3 h-auto w-full max-w-xl"
      role="img"
      aria-label={`${label}: ${points.map((p) => `${formatMonth(p.month)} ${p.pct}% of ${p.tracked}`).join(', ')}`}
    >
      {/* Recessive grid: 0/50/100% lines + y tick labels in muted ink. */}
      {[0, 50, 100].map((pct) => (
        <g key={pct}>
          <line x1={pad.left} y1={y(pct)} x2={width - pad.right} y2={y(pct)} className="stroke-zinc-800" strokeWidth={1} />
          <text x={pad.left - 6} y={y(pct) + 3} textAnchor="end" className="fill-zinc-500 font-mono text-[10px]">
            {pct}%
          </text>
        </g>
      ))}
      {xLabelIdx.map((i) => (
        <text key={points[i].month} x={x(i)} y={height - 6} textAnchor="middle" className="fill-zinc-500 font-mono text-[10px]">
          {formatMonth(points[i].month)}
        </text>
      ))}
      <path d={d} fill="none" className="stroke-emerald-400" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={p.month} cx={x(i)} cy={y(p.pct)} r={i === points.length - 1 ? 3 : 2} className="fill-emerald-400" />
      ))}
      {/* Selective direct label: the latest value only, in text ink (identity comes from the
          adjacent mark, not colored text). */}
      <text x={x(points.length - 1) + 8} y={y(last.pct) + 3} className="fill-zinc-300 font-mono text-[10px] tabular-nums">
        {last.pct}%
      </text>
    </svg>
  )
}
