import type { Cadence } from '@/lib/processSim'

// The year-at-a-glance rhythm chart for /processes/operating-rhythm: one row per cadence,
// tick marks spread across a single January→December track at that cadence's real frequency —
// daily reads as a dense band, weekly as 52 beats, annual as one tick. GeoMark house rules:
// server-rendered inline SVG, deterministic (no Math.random — the event-driven row's irregular
// ticks are a fixed constellation), currentColor strokes, exactly one emerald accent (the
// daily row — the loop that never stops is the page's headline). Every row carries a title
// tooltip; the visual is decoration over the lists below, never the only carrier of the data.

const TRACK = 520
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

// Fixed, deliberately irregular x-positions for the no-calendar row — a hire in February, a
// cancellation in May, a new vendor in September… the shape says "triggers, not a schedule".
const EVENT_TICKS = [23, 61, 88, 150, 197, 261, 305, 344, 401, 466, 498]

function ticksFor(cadence: Cadence): number[] {
  switch (cadence) {
    case 'daily':
      // Working days, stylized as a near-continuous band (240 ticks reads as "constant").
      return Array.from({ length: 240 }, (_, i) => (i + 0.5) * (TRACK / 240))
    case 'weekly':
      return Array.from({ length: 52 }, (_, i) => (i + 0.5) * (TRACK / 52))
    case 'monthly':
      return Array.from({ length: 12 }, (_, i) => (i + 0.5) * (TRACK / 12))
    case 'quarterly':
      return Array.from({ length: 4 }, (_, i) => (i + 0.5) * (TRACK / 4))
    case 'annual':
      // One tick, early in the year — the filing season cluster (franchise tax, 1099s).
      return [TRACK * 0.17]
    case 'event-driven':
      return EVENT_TICKS
    case 'once':
      // Day one, then never again.
      return [3]
  }
}

export interface RhythmRow {
  cadence: Cadence
  label: string
  count: number
}

export default function RhythmTimeline({ rows }: { rows: RhythmRow[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 p-4 sm:p-5">
      {/* Month axis — spans the same track as every row's SVG. */}
      <div className="flex items-center gap-3 text-[9px] uppercase text-zinc-600">
        <span className="w-24 shrink-0 sm:w-28" />
        <span aria-hidden className="flex flex-1 justify-between font-mono">
          {MONTHS.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </span>
        <span className="w-14 shrink-0" />
      </div>
      <div className="mt-1 space-y-1">
        {rows.map((row) => {
          const ticks = ticksFor(row.cadence)
          return (
            <div
              key={row.cadence}
              title={`${row.label} — ${row.count} ${row.count === 1 ? 'process' : 'processes'} on this rhythm`}
              className={`flex items-center gap-3 ${row.cadence === 'daily' ? 'text-emerald-400' : 'text-zinc-600'}`}
            >
              <span className="w-24 shrink-0 text-[10px] uppercase tracking-widest text-zinc-400 sm:w-28">
                {row.label}
              </span>
              <svg
                viewBox={`0 0 ${TRACK} 16`}
                preserveAspectRatio="none"
                className="h-4 min-w-0 flex-1"
                role="img"
                aria-label={`${row.label}: ${row.count} processes across the year`}
              >
                <line x1={0} x2={TRACK} y1={8} y2={8} stroke="currentColor" strokeWidth={0.5} opacity={0.25} />
                {ticks.map((x, i) => (
                  <line
                    key={i}
                    x1={x}
                    x2={x}
                    y1={3.5}
                    y2={12.5}
                    stroke="currentColor"
                    strokeWidth={ticks.length > 60 ? 1 : 1.5}
                    opacity={ticks.length > 60 ? 0.7 : 1}
                  />
                ))}
              </svg>
              <span className="w-14 shrink-0 text-right font-mono text-[10px] tabular-nums text-zinc-500">
                ×{row.count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
