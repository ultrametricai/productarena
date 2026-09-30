'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  VS_EXPERIENCE_OPTIONS,
  VS_TECHNICAL_OPTIONS,
  type VsFounderAxes,
} from '@/lib/virtualStartupRun'

// The founder picker — ONE dropdown (founder addendum 2026-09-30): the two orthogonal axes
// (Technical × Experience, founder batch 2026-09-29 item 4) present as a single house-listbox
// selector over their FOUR combinations — 'Technical, first-time' / 'Technical, repeat
// entrepreneur' / 'Non-technical, first-time' / 'Non-technical, repeat entrepreneur'. DISPLAY
// consolidation only: the axis model, the ?run= codec 'f' token, the legacy persona mapping, and
// the event-seed tokens (lib/virtualStartupRun.ts) are untouched — each option IS an exact
// VsFounderAxes pair, derived from the committed axis options, never a new persona. Founder-count
// stays the Team decision's business; no solo option lives here. An axis shifts which
// person-routed work is DIY vs delegated in the run's time model only (computeStackOutcome — the
// two modifiers compose) — it never changes a judged verdict or a corpus estimate. NO title=
// tooltips on the trigger or options (founder batch 2026-09-30, item 3: they overlap the open
// listbox) — the blurbs + each axis's named simulation assumption render as option SUBLABELS
// inside the list instead; the run's outcome surfaces still disclose the assumptions where they
// apply.

interface AxisCombo {
  axes: VsFounderAxes
  // Compact trigger/option text, e.g. 'Technical, first-time'.
  short: string
  // The canonical accessible name, e.g. 'Technical founder, first-time'.
  label: string
  // Blurbs + named simulation assumptions of BOTH axes — rendered as the option SUBLABEL (the
  // receipt the removed tooltip used to carry — item 3, 2026-09-30).
  title: string
}

// The four combinations, derived from the committed axis options so labels/assumptions can never
// drift from lib/virtualStartupRun.ts.
const AXIS_COMBOS: AxisCombo[] = VS_TECHNICAL_OPTIONS.flatMap((t) =>
  VS_EXPERIENCE_OPTIONS.map((e) => {
    const expShort = e.value === 'first-timer' ? 'first-time' : e.short.toLowerCase()
    const assumptions = [t.assumption, e.assumption].filter((a): a is string => a !== null)
    return {
      axes: { technical: t.value, experience: e.value },
      short: `${t.short}, ${expShort}`,
      label: `${t.label}, ${expShort}`,
      title: `${t.label} — ${t.blurb} · ${e.label} — ${e.blurb}${
        assumptions.length > 0 ? ` (${assumptions.join(' · ')})` : ''
      }`,
    }
  }),
)

const comboId = (axes: VsFounderAxes) => `${axes.technical}-${axes.experience}`

export default function VsPersonaPicker({
  axes,
  onSelect,
}: {
  axes: VsFounderAxes
  onSelect: (axes: VsFounderAxes) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const activeOptionRef = useRef<HTMLButtonElement>(null)
  const listboxId = useId()

  const current = AXIS_COMBOS.find((c) => comboId(c.axes) === comboId(axes)) ?? AXIS_COMBOS[0]

  // Close on any click/tap outside while open (SimRolePicker contract).
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Keyboard flow: Enter on the trigger opens, focus lands on the current state, Enter picks.
  useEffect(() => {
    if (open) activeOptionRef.current?.focus()
  }, [open])

  function close(refocus: boolean) {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }

  function pick(c: AxisCombo) {
    onSelect(c.axes)
    close(true)
  }

  return (
    <div
      ref={rootRef}
      data-testid="vs-persona-picker"
      role="group"
      aria-label="Who is the founder?"
      className="relative flex shrink-0 items-center"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation()
          close(true)
        }
      }}
    >
      {/* No visible label — the setup band's grid label column says "Founder" (2026-09-28). */}
      <button
        ref={triggerRef}
        type="button"
        data-testid="vs-persona-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={current.label}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs transition ${
          open
            ? 'border-emerald-400/60 bg-emerald-400/5 text-zinc-100'
            : 'border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100'
        }`}
      >
        {current.short}
        <span aria-hidden className="text-[9px] text-zinc-500">
          ▾
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          id={listboxId}
          aria-label="Who is the founder? options"
          className="absolute left-0 top-full z-30 mt-1 w-[300px] rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-2xl"
        >
          {AXIS_COMBOS.map((c) => {
            const active = comboId(c.axes) === comboId(axes)
            return (
              <li key={comboId(c.axes)} role="presentation">
                <button
                  ref={active ? activeOptionRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={active}
                  aria-label={c.label}
                  data-testid={`vs-persona-${comboId(c.axes)}`}
                  onClick={() => pick(c)}
                  className={`flex w-full items-start gap-2 border-l-2 px-2.5 py-1.5 text-left text-xs transition ${
                    active
                      ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-300'
                      : 'border-transparent text-zinc-300 hover:bg-emerald-400/10 hover:text-emerald-300'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    {c.short}
                    {/* Sublabel (item 3, 2026-09-30): the blurbs + named simulation assumptions
                        the removed tooltip carried — the receipt stays visible in the list. */}
                    <span data-testid="vs-persona-detail" className="mt-0.5 block text-[10px] leading-snug text-zinc-400">
                      {c.title}
                    </span>
                  </span>
                  {active && (
                    <span aria-hidden className="shrink-0 text-emerald-300">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
