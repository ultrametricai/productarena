'use client'

import type { ReactNode } from 'react'

// Shared control strip for the ranking tables (homepage MegaTable + per-arena ArenaTable) —
// one component so "rank by" presets, the scope <select>, the text filter, and the live
// "Ranked by …" line look and behave identically everywhere a leaderboard renders.
export interface TableControlsPreset<C extends string> {
  col: C
  label: string
}

function presetButtonClass(active: boolean): string {
  const base = 'rounded-full border px-3 py-1.5 text-xs font-medium transition'
  return active
    ? `${base} border-emerald-400/60 bg-emerald-400/10 text-emerald-300`
    : `${base} border-zinc-800 text-zinc-400 hover:border-emerald-400/40 hover:text-emerald-300`
}

export default function TableControls<C extends string>({
  presets,
  activeColumn,
  presetActive,
  onPreset,
  scope,
  query,
  onQuery,
  after,
}: {
  presets: Array<TableControlsPreset<C>>
  activeColumn: C
  // Whether the active column counts as "the preset is on" (e.g. only when direction is desc).
  presetActive: boolean
  onPreset: (col: C) => void
  // Optional scope <select> (the mega-table's "All products / <arena>" control).
  scope?: {
    value: string
    onChange: (value: string) => void
    ariaLabel: string
    options: Array<{ value: string; label: string }>
  }
  query: string
  onQuery: (value: string) => void
  // Extra inline content at the end of the controls row (e.g. the arena table's legend link).
  after?: ReactNode
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-zinc-500">Rank by</span>
        {presets.map((p) => (
          <button
            key={p.col}
            type="button"
            onClick={() => onPreset(p.col)}
            className={presetButtonClass(activeColumn === p.col && presetActive)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-nowrap items-center gap-2">
        {scope && (
          <span className="relative inline-flex">
            <select
              value={scope.value}
              onChange={(e) => scope.onChange(e.target.value)}
              aria-label={scope.ariaLabel}
              className="max-w-[11rem] appearance-none rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-2.5 pr-7 text-sm text-zinc-100 focus:border-emerald-400/60 focus:outline-none"
            >
              {scope.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {/* native select arrows are near-invisible on dark backgrounds — draw our own */}
            <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emerald-400">▾</span>
          </span>
        )}
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Filter…"
          aria-label="Filter products by name or vendor"
          className="ml-auto min-w-0 flex-1 basis-16 max-w-[14rem] rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-400/60 focus:outline-none sm:flex-none sm:w-48"
        />
        {after && <span className="text-xs text-zinc-400">{after}</span>}
      </div>
    </>
  )
}
