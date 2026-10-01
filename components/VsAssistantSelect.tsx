'use client'

import { useEffect, useId, useRef, useState } from 'react'
import ProductLogoView from '@/components/ProductLogoView'
import type { VsAssistant } from '@/lib/virtualStartup'

// 'Which AI firm are you using' (founder batch 2026-09-30, item 7) — the setup band's "I'm
// using" selector: the house listbox pattern (components/VsDecisionSelect.tsx / VsGeoSelector.tsx,
// never a native <select>) over the REAL judged ai-assistants roster (lib/virtualStartup.ts
// VS_AI_FIRM_IDS, resolved server-side). The pick is a DISPLAY PIN: the chosen assistant renders
// as 'your assistant' on the AI-conversation steps while the judged top keeps its
// '(recommended · judged)' chip — no judged number moves, no clock changes. Rides the ?run=
// permalink ('a' token). Fresh visits arrive pre-selected on ChatGPT (founder 2026-10-01,
// item 5 — the 'judged pick' wording that used to label the null default is GONE; the null row
// is plain 'Not set' now and exists for legacy links, which decode without the 'a' token).
//
// NO title= tooltips on the trigger or the options (founder batch 2026-09-30, item 3: they
// overlap the open listbox), and NO sublabels (item 4, 2026-10-01: names only) — the pin
// semantics stay on the row's IconChip tooltip and on the step surface itself ('your assistant'
// + the untouched '(recommended · judged)' label); accessible names stay on aria-label.

export default function VsAssistantSelect({
  assistants,
  value,
  onChange,
}: {
  assistants: VsAssistant[]
  // The pinned judged product id, or null for no pin (legacy links; fresh visits arrive
  // pre-selected — lib/virtualStartup.ts DEFAULT_VS_ASSISTANT).
  value: string | null
  onChange: (next: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const activeOptionRef = useRef<HTMLButtonElement>(null)
  const listboxId = useId()

  const current = assistants.find((a) => a.id === value) ?? null

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
    onChange(next)
    close(true)
  }

  return (
    <div
      ref={rootRef}
      data-testid="vs-assistant-row"
      role="group"
      aria-label="Which AI firm are you using?"
      className="relative flex shrink-0 items-center"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation()
          close(true)
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        data-testid="vs-assistant-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs transition ${
          open
            ? 'border-emerald-400/60 bg-emerald-400/5 text-zinc-100'
            : current
              ? 'border-zinc-700 text-zinc-200 hover:border-emerald-400/50'
              : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
        }`}
      >
        {current && <ProductLogoView product={{ id: current.id, name: current.name }} size={14} hasLogo={current.hasLogo} />}
        {current ? current.name : 'Not set'}
        <span aria-hidden className="text-[9px] text-zinc-500">
          ▾
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          id={listboxId}
          aria-label="Which AI firm are you using? options"
          className="absolute left-0 top-full z-30 mt-1 min-w-[260px] max-w-[calc(100vw-2.5rem)] rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-2xl"
        >
          <li role="presentation">
            <button
              ref={current === null ? activeOptionRef : undefined}
              type="button"
              role="option"
              aria-selected={current === null}
              data-testid="vs-assistant-judged"
              onClick={() => pick(null)}
              className={`flex w-full items-start gap-2 border-l-2 px-2.5 py-1.5 text-left text-xs transition ${
                current === null
                  ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-300'
                  : 'border-transparent text-zinc-400 hover:bg-emerald-400/10 hover:text-emerald-300'
              }`}
            >
              {/* The null row: plain 'Not set' — the 'Judged pick' default labeling is gone
                  (item 5, 2026-10-01); unpinned steps simply show the step's own ranked chips. */}
              <span className="min-w-0 flex-1">Not set</span>
              {current === null && (
                <span aria-hidden className="shrink-0 text-emerald-300">
                  ✓
                </span>
              )}
            </button>
          </li>
          {assistants.map((a) => {
            const active = current?.id === a.id
            return (
              <li key={a.id} role="presentation">
                <button
                  ref={active ? activeOptionRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={active}
                  aria-label={a.name}
                  data-testid={`vs-assistant-${a.id}`}
                  onClick={() => pick(a.id)}
                  className={`flex w-full items-start gap-2 border-l-2 px-2.5 py-1.5 text-left text-xs transition ${
                    active
                      ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-300'
                      : 'border-transparent text-zinc-300 hover:bg-emerald-400/10 hover:text-emerald-300'
                  }`}
                >
                  <ProductLogoView product={{ id: a.id, name: a.name }} size={14} hasLogo={a.hasLogo} />
                  {/* Names only (item 4, 2026-10-01) — the pin-semantics sublabel moved to the
                      row IconChip tooltip and the step surface labels. */}
                  <span className="min-w-0 flex-1">{a.name}</span>
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
