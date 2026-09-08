// The Arena Score's lead badge — deliberately more prominent than AgenticBadge (bigger type,
// solid emerald ring) since v2.4 re-prioritizes the whole site around this number. Internally
// still keyed on the `aiEra` field/formula (see README's "Arena Score (formerly AI-Era Index)"
// section for the blend formula and weights) — only the display label changed.
//
// The pill itself renders a bare number (`32/100`, mono/bold) with no "Arena" prefix — the
// surrounding heading/column-header/label is responsible for saying "Arena Score" once so a
// bare number is never ambiguous in context (see callers). The tooltip still carries the full
// formula + component breakdown regardless.

export interface AiEraComponents {
  agentReady: number | null
  apiQuality: number | null
  openness: number | null
  agenticApp: number | null
  automation: number | null
}

// 68% confidence band on the score, from data/{cat}/score-intervals.json (see
// lib/scoreIntervals.ts). Only ever rendered when real interval data exists — callers without a
// computed band simply omit the prop and the badge is unchanged.
export interface ScoreBand {
  low: number
  high: number
}

const FORMULA =
  'Arena Score (0–100): agent-ready ×0.30 · API quality ×0.20 · openness ×0.20 · agentic app ×0.15 · automation ×0.15 (n/a components excluded, weights renormalized). Every component is evidence-judged — see /methodology.'

import Link from 'next/link'

// Half-width shown as "±N" — the tooltip carries the exact (possibly asymmetric) low–high band.
export const bandHalfWidth = (band: ScoreBand): number => Math.round((band.high - band.low) / 2)

function tooltip(components?: AiEraComponents, band?: ScoreBand): string {
  const bandLine = band
    ? `\n±${bandHalfWidth(band)} (68% band: ${band.low.toFixed(0)}–${band.high.toFixed(0)}) — propagated from measured judge re-roll variance; untested cells widen it. See README "Score intervals".`
    : ''
  if (!components) return FORMULA + bandLine
  const fmt = (n: number | null) => (n === null ? 'n/a' : n.toFixed(0))
  return (
    `Agent-ready ${fmt(components.agentReady)} · API quality ${fmt(components.apiQuality)} · ` +
    `Openness ${fmt(components.openness)} · Agentic app ${fmt(components.agenticApp)} · ` +
    `Automation ${fmt(components.automation)}\n${FORMULA}${bandLine}`
  )
}

export default function AiEraBadge({
  value,
  size = 'md',
  components,
  href,
  interval,
  showBand = false,
}: {
  value: number | null
  size?: 'md' | 'sm'
  components?: AiEraComponents
  // Optional click-through (e.g. /methodology#arena-score). Callers must NOT set this when the
  // badge is rendered inside another link (arena/battle cards) — nested anchors are invalid.
  href?: string
  // 68% confidence band from score-intervals.json (undefined/null when no interval data exists —
  // the badge then renders exactly as before; a band is never fabricated). When present it is
  // always appended to the tooltip; `showBand` additionally renders the "±N" inline (product
  // page header — "42 ±3 /100"), which table callers leave off to keep columns tight.
  interval?: ScoreBand | null
  showBand?: boolean
}) {
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
  if (value === null) {
    return (
      <span
        title={tooltip(components)}
        className={`inline-flex w-fit items-center rounded-full bg-zinc-900 font-mono font-semibold italic text-zinc-400 ring-1 ring-zinc-800 ${sizeClass}`}
      >
        n/a
      </span>
    )
  }
  const band = interval ?? undefined
  const badge = (
    <span
      title={tooltip(components, band)}
      className={`inline-flex w-fit cursor-help items-center rounded-full bg-emerald-400 font-mono font-bold text-zinc-950 ring-1 ring-emerald-300 tabular-nums ${sizeClass}`}
    >
      {value.toFixed(0)}
      {showBand && band && (
        <span className="pl-1 text-[0.72em] font-medium opacity-60">±{bandHalfWidth(band)}</span>
      )}
      <span className="font-medium opacity-60">/100</span>
    </span>
  )
  if (href) {
    return (
      <Link href={href} title="How is this calculated?" className="inline-flex">
        {badge}
      </Link>
    )
  }
  return badge
}
