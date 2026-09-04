// Pure SVG path math for components/Sparkline.tsx — extracted (like lib/megaTableSort.ts from
// MegaTable) so the mapping from a value series to path coordinates is unit-testable without
// rendering React. No chart library: a sparkline is one polyline.

export interface SparklinePoint {
  x: number
  y: number
}

// Maps a value series onto evenly-spaced x positions and value-scaled y positions inside a
// width×height box (y inverted: SVG y grows downward, higher values plot higher). `pad` insets
// the line so the stroke doesn't clip at the viewBox edge. A flat series (max === min) renders
// as a horizontal midline rather than dividing by zero. Null when there's nothing to draw a
// line through (<2 points) — the caller renders nothing, not a dot or an empty box.
export function sparklinePoints(values: number[], width: number, height: number, pad = 2): SparklinePoint[] | null {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const innerWidth = width - pad * 2
  const innerHeight = height - pad * 2
  const step = innerWidth / (values.length - 1)
  return values.map((value, i) => ({
    x: round2(pad + i * step),
    y: round2(range === 0 ? height / 2 : pad + (1 - (value - min) / range) * innerHeight),
  }))
}

// "M x,y L x,y …" path for the same series — what Sparkline.tsx actually feeds <path d={…}/>.
export function sparklinePath(values: number[], width: number, height: number, pad = 2): string | null {
  const points = sparklinePoints(values, width, height, pad)
  if (!points) return null
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
}

// 2-decimal coordinates keep the markup small and the tests exact (no 13.333333333333334).
function round2(n: number): number {
  return Math.round(n * 100) / 100
}
