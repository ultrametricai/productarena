'use client'

import { useEffect, useId, useRef, useState } from 'react'
import IconChip from '@/components/IconChip'
import { DEFAULT_CHOICES, type DecisionDef } from '@/lib/virtualStartup'

// One starting decision as a compact select-style dropdown (founder addendum 2026-09-29: the
// nine decisions become dropdowns, not toggle pill strips) — the house listbox pattern
// (components/SimRolePicker.tsx), text-only, NEVER a native <select> (founder-rejected UI).
//
// The 'Not set' state: a decision starts unasserted — the journey composes exactly as the
// DEFAULT_CHOICES branch, the closed button reads 'Not set', the open list's first option reads
// 'Not set (default: <default label>)', and the ?run=/URL state omits it. Picking any explicit
// value asserts it (including explicitly picking the default's value, which then serializes).
// Semi-auto drive mode leans on exactly this substrate: unasserted decisions are the ones the
// run pauses on.
//
// Label differentiation (founder batch 2026-09-29, item 3): the group label is clearly
// non-interactive — a plain uppercase micro-label with a colon, muted, no pill border — while
// the trigger keeps the button/pill affordance. Accessible names stay canonical: the group is
// aria-label={decision.title}, each option's accessible name is its full canonical label.
//
// NO title= tooltips on the trigger or the options (founder batch 2026-09-30, item 3: the
// tooltips overlapped the open listboxes). NO sublabels either (founder batch 2026-10-01,
// item 4): the open list shows NAMES ONLY — the corpus-mapping receipts the sublabels carried
// move back to non-blocking surfaces: the semi-auto decision cards' tooltips keep each option's
// detail, the terminal's phase notes name every mapping as the run composes, and a single muted
// info line under the decisions row (components/VirtualStartup.tsx) points at that contract.
// Canonical aria-labels stay untouched.
export default function VsDecisionSelect({
  decision,
  shortTitle,
  shortOptions,
  icon,
  value,
  visibleValues,
  onSelect,
}: {
  decision: DecisionDef
  // Compact display title (display only — the group keeps the canonical title as its name).
  shortTitle: string
  // Compact display text per option value (display only).
  shortOptions: Record<string, string>
  icon: string
  // The ASSERTED value, or undefined for 'Not set' (composes as the default).
  value: string | undefined
  // Optional DISPLAY roster (founder round 5, item 1: the Entity options follow the geo pick):
  // only these option values render in the open list. Additive — absent = every option renders.
  // The full decision stays the source of truth: the codec, the default lookup, and an asserted
  // off-roster value (an old link's) all keep resolving against decision.options.
  visibleValues?: readonly string[]
  // null clears back to 'Not set'; a string asserts that option.
  onSelect: (value: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const activeOptionRef = useRef<HTMLButtonElement>(null)
  const listboxId = useId()

  const defaultOption = decision.options.find((o) => o.value === DEFAULT_CHOICES[decision.id])!
  const current = value === undefined ? null : decision.options.find((o) => o.value === value) ?? null
  const listed = visibleValues ? decision.options.filter((o) => visibleValues.includes(o.value)) : decision.options

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

  function pick(next: string | null) {
    onSelect(next)
    close(true)
  }

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={decision.title}
      className="relative flex shrink-0 items-center gap-1"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation()
          close(true)
        }
      }}
    >
      <IconChip icon={icon} title={`${decision.title} — starting decision`} className="text-[11px]" />
      {/* Non-interactive micro-label: muted, colon, no pill — visibly not a button. */}
      <span className="text-[10px] uppercase tracking-wider text-zinc-400">{shortTitle}:</span>
      <button
        ref={triggerRef}
        type="button"
        data-testid={`vs-decision-${decision.id}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((v) => !v)}
        aria-label={
          current
            ? `${decision.title}: ${current.label}`
            : `${decision.title}: not set — composes the default (${defaultOption.label})`
        }
        className={`flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs transition ${
          open
            ? 'border-emerald-400/60 bg-emerald-400/5 text-zinc-100'
            : current
              ? 'border-zinc-700 text-zinc-200 hover:border-emerald-400/50'
              : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
        }`}
      >
        {current ? shortOptions[current.value] ?? current.label : 'Not set'}
        <span aria-hidden className="text-[9px] text-zinc-500">
          ▾
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          id={listboxId}
          aria-label={`${decision.title} options`}
          className="absolute left-0 top-full z-30 mt-1 w-[260px] max-w-[calc(100vw-2.5rem)] rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-2xl"
        >
          <li role="presentation">
            <button
              ref={current === null ? activeOptionRef : undefined}
              type="button"
              role="option"
              aria-selected={current === null}
              aria-label={`Not set (default: ${defaultOption.label})`}
              data-testid={`vs-decision-${decision.id}-notset`}
              onClick={() => pick(null)}
              className={`flex w-full items-start gap-2 border-l-2 px-2.5 py-1.5 text-left text-xs transition ${
                current === null
                  ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-300'
                  : 'border-transparent text-zinc-400 hover:bg-emerald-400/10 hover:text-emerald-300'
              }`}
            >
              {/* Names only (item 4) — the what-unasserted-means explainer moved off the list;
                  the trigger's aria-label still says 'composes the default (…)'. */}
              <span className="min-w-0 flex-1">Not set (default: {defaultOption.label})</span>
              {current === null && (
                <span aria-hidden className="shrink-0 text-emerald-300">
                  ✓
                </span>
              )}
            </button>
          </li>
          {listed.map((o) => {
            const active = current?.value === o.value
            return (
              <li key={o.value} role="presentation">
                <button
                  ref={active ? activeOptionRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={active}
                  aria-label={o.label}
                  data-testid={`vs-decision-${decision.id}-${o.value}`}
                  onClick={() => pick(o.value)}
                  className={`flex w-full items-start gap-2 border-l-2 px-2.5 py-1.5 text-left text-xs transition ${
                    active
                      ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-300'
                      : 'border-transparent text-zinc-300 hover:bg-emerald-400/10 hover:text-emerald-300'
                  }`}
                >
                  {/* Names only (item 4): o.detail no longer renders here — see the module
                      header for where the corpus-mapping receipt now lives. */}
                  <span className="min-w-0 flex-1">{o.label}</span>
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
