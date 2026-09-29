'use client'

import {
  VS_EXPERIENCE_OPTIONS,
  VS_TECHNICAL_OPTIONS,
  type VsAxisOption,
  type VsFounderAxes,
} from '@/lib/virtualStartupRun'

// The founder picker (founder batch 2026-09-29, item 4): the old three mutually-exclusive
// personas untangled into TWO tiny segmented pairs under the setup band's Founder label —
// Technical (technical / non-technical) × Experience (first-timer / second-timer). Founder-count
// stays where it belongs: the Team decision ('Cofounders vs Solo founder'); no solo assumption
// lives here. An axis shifts which person-routed work is DIY vs delegated in the run's time
// model only (lib/virtualStartupRun.ts computeStackOutcome — the two modifiers compose) — it
// never changes a judged verdict or a corpus estimate. Options render as small pill buttons:
// short visible labels, the canonical full label as the accessible name, and the blurb — plus
// the option's named simulation assumption where one applies — in the tooltip
// (components/InstantTooltip.tsx upgrades every title= site-wide). The band prints no amber
// assumption lines (founder round 3, 2026-09-29) and the setup-guide expand is gone (round 4,
// item 1): the tooltips ARE the explanation surface, and the run's outcome surfaces disclose
// the assumptions where they actually apply.

function AxisPair<V extends string>({
  name,
  options,
  value,
  onSelect,
}: {
  name: string
  options: VsAxisOption<V>[]
  value: V
  onSelect: (v: V) => void
}) {
  return (
    <span role="group" aria-label={name} className="flex shrink-0 items-center gap-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-testid={`vs-persona-${o.value}`}
          aria-pressed={o.value === value}
          aria-label={o.label}
          title={`${o.label} — ${o.blurb}${o.assumption ? ` (${o.assumption})` : ''}`}
          onClick={() => onSelect(o.value)}
          className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs transition ${
            o.value === value
              ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'
              : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
          }`}
        >
          {o.short}
        </button>
      ))}
    </span>
  )
}

export default function VsPersonaPicker({
  axes,
  onSelect,
}: {
  axes: VsFounderAxes
  onSelect: (axes: VsFounderAxes) => void
}) {
  return (
    <span
      data-testid="vs-persona-picker"
      role="group"
      aria-label="Who is the founder?"
      className="flex shrink-0 items-center gap-1.5"
    >
      {/* No visible label — the setup band's grid label column says "Founder" (2026-09-28). */}
      <AxisPair
        name="Technical background"
        options={VS_TECHNICAL_OPTIONS}
        value={axes.technical}
        onSelect={(technical) => onSelect({ ...axes, technical })}
      />
      <span aria-hidden className="text-zinc-700">
        ·
      </span>
      <AxisPair
        name="Founder experience"
        options={VS_EXPERIENCE_OPTIONS}
        value={axes.experience}
        onSelect={(experience) => onSelect({ ...axes, experience })}
      />
    </span>
  )
}
