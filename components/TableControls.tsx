'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

// Shared control strip for the ranking tables (homepage MegaTable + per-arena ArenaTable) —
// one component so "rank by" presets, the scope <select>, the text filter, and the live
// "Ranked by …" line look and behave identically everywhere a leaderboard renders.
export interface TableControlsPreset<C extends string> {
  col: C
  label: string
  // Optional icon, shown in the dropdown variant (founder 2026-09-30: /processes rank-by as a
  // single dropdown with icons).
  icon?: string
}

function presetButtonClass(active: boolean): string {
  // focus-visible ring so keyboard users can see which preset pill has focus (the inputs in
  // this same strip already carry focus styles).
  const base = 'rounded-full border px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60'
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
  presetsAsDropdown = false,
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
  // Render the desktop presets as ONE house-listbox dropdown instead of the pill row
  // (founder 2026-09-30, /processes) — mobile keeps its select either way.
  presetsAsDropdown?: boolean
}) {
  // Founder 2026-09-23: one line — rank-by presets left, scope + filter pushed right; narrow
  // viewports wrap naturally. Founder 2026-09-24 (mobile): below sm the preset pills collapse
  // into one "Rank by" <select> so the controls fit a phone width.
  const activePreset = presets.find((p) => p.col === activeColumn && presetActive)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="hidden text-xs uppercase tracking-widest text-zinc-500 sm:inline">Rank by</span>
      <span className="relative inline-flex sm:hidden">
        <select
          value={activePreset?.col ?? ''}
          onChange={(e) => e.target.value !== '' && onPreset(e.target.value as C)}
          aria-label="Rank by"
          className="max-w-[10rem] appearance-none rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-2.5 pr-7 text-sm text-zinc-100 focus:border-emerald-400/60 focus:outline-none"
        >
          {/* The empty option shows when the reader column-sorted into a non-preset view. */}
          {activePreset === undefined && <option value="">Rank by…</option>}
          {presets.map((p) => (
            <option key={p.col} value={p.col}>
              {p.icon ? `${p.icon} ${p.label}` : p.label}
            </option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emerald-400">▾</span>
      </span>
      {presetsAsDropdown ? (
        <span className="hidden sm:inline-flex">
          <PresetDropdown presets={presets} active={activePreset?.col ?? null} onPreset={onPreset} />
        </span>
      ) : (
        presets.map((p) => (
          <button
            key={p.col}
            type="button"
            onClick={() => onPreset(p.col)}
            className={`hidden sm:inline-block ${presetButtonClass(activeColumn === p.col && presetActive)}`}
          >
            {p.label}
          </button>
        ))
      )}
      {/* Founder 2026-09-24 (mobile): the rank select and the arena scope share ONE line; the
          rank control keeps the width priority and the filter stays narrow, expanding on focus
          (a phone reader taps it before typing anyway). */}
      <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 sm:ml-auto sm:flex-none">
        {scope && (
          <span className="relative inline-flex min-w-0 shrink">
            <select
              value={scope.value}
              onChange={(e) => scope.onChange(e.target.value)}
              aria-label={scope.ariaLabel}
              className="w-full max-w-[11rem] appearance-none rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-2.5 pr-7 text-sm text-zinc-100 focus:border-emerald-400/60 focus:outline-none"
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
          className="ml-auto w-20 min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 transition-[width] duration-150 placeholder:text-zinc-500 focus:w-40 focus:border-emerald-400/60 focus:outline-none sm:w-48 sm:focus:w-48"
        />
        {after && <span className="hidden text-xs text-zinc-400 sm:inline">{after}</span>}
        {/* Founder 2026-09-15: no "?" beside the filter — the methodology link in the footer and
            the column tooltips carry the definitions; the chip was visual noise. */}
      </div>
    </div>
  )
}


// The single rank-by dropdown (house listbox — GeoDropdown/SimRolePicker family, never a
// native select on desktop). Closed button shows the active preset (icon + label) or 'Rank by'.
function PresetDropdown<C extends string>({
  presets,
  active,
  onPreset,
}: {
  presets: Array<TableControlsPreset<C>>
  active: C | null
  onPreset: (col: C) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])
  const current = presets.find((p) => p.col === active) ?? null
  return (
    <span ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={presetButtonClass(current !== null)}
      >
        {current ? `${current.icon ? `${current.icon} ` : ''}${current.label}` : 'Rank by'}{' '}
        <span aria-hidden className="text-[10px] text-zinc-500">▾</span>
      </button>
      {open && (
        <ul role="listbox" aria-label="Rank by" className="absolute left-0 z-40 mt-1 w-52 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-2xl">
          {presets.map((p) => {
            const isActive = p.col === active
            return (
              <li key={p.col} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onPreset(p.col)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition ${
                    isActive ? 'bg-emerald-400/10 text-emerald-300' : 'text-zinc-300 hover:bg-zinc-800 hover:text-emerald-300'
                  }`}
                >
                  {p.icon && <span aria-hidden>{p.icon}</span>}
                  {p.label}
                  {isActive && <span aria-hidden className="ml-auto">✓</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </span>
  )
}
