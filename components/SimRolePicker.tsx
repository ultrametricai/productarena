'use client'

import { useEffect, useId, useRef, useState } from 'react'
import ProductLogoView from '@/components/ProductLogoView'
import type { VendorRole } from '@/lib/processSim'

// One swappable market role of the process simulator, as a logo-bearing card + popover listbox
// (founder 2026-09-25: the simulator's native <select>s "have poor UI in those dropdown menus —
// needs logos and a better layout"). Purely presentational over ProcessSimulator's existing
// selections state: picking an option fires the same onSelect the old <select> onChange did.
//
// Semantics: the trigger is a real <button> with aria-haspopup="listbox"/aria-expanded; the
// popover is a role="listbox" <ul> whose options are real <button role="option">s (native
// Enter/Space activation, Tab order), aria-selected on the current pick, Escape closes and
// returns focus to the trigger, outside clicks close. Options keep the arena's ranked order
// (VendorRole.alternatives is the agent-readiness ladder), each row a logo + name + score, the
// active pick wearing the house emerald ring + check (ProcessVendorPicker/MyStackBuilder
// pattern). The popover spans the card (left-0 right-0) so it never overflows the viewport on
// mobile, and scrolls past ~8 rows instead of growing.

export default function SimRolePicker({
  role,
  selectedId,
  onSelect,
}: {
  role: VendorRole
  selectedId: string
  onSelect: (productId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const activeOptionRef = useRef<HTMLButtonElement>(null)
  const listboxId = useId()

  const current = role.alternatives.find((o) => o.id === selectedId)
  const rankOf = (id: string) => role.alternatives.findIndex((o) => o.id === id) + 1
  const swapped = selectedId !== role.canonicalVendor

  // Close on any click/tap outside the card while open.
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

  // Keyboard flow: Enter on the trigger opens, focus lands on the current pick, Enter picks.
  useEffect(() => {
    if (open) activeOptionRef.current?.focus()
  }, [open])

  function close(refocus: boolean) {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }

  function pick(id: string) {
    onSelect(id)
    close(true)
  }

  return (
    <div
      ref={rootRef}
      className="relative min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/40 px-2.5 py-2"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation()
          close(true)
        }
      }}
    >
      <div className="flex items-baseline justify-between gap-2 text-[10px]">
        <span
          className="truncate uppercase tracking-widest text-zinc-500"
          title={`${role.arenaName} — the market serving this role's steps`}
        >
          {role.arenaName}
        </span>
        {swapped && <span className="shrink-0 text-amber-400/90">(swapped)</span>}
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          onClick={() => setOpen((v) => !v)}
          title={`Change the ${role.arenaName} product for this dry run`}
          className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border py-1 pl-1 pr-2 text-sm transition ${
            open
              ? 'border-emerald-400/60 bg-emerald-400/5 text-zinc-100'
              : 'border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-emerald-400/50'
          }`}
        >
          <ProductLogoView
            product={{ id: selectedId, name: current?.name ?? role.defaultProductName }}
            size={22}
            hasLogo={current?.hasLogo ?? false}
          />
          <span className="min-w-0 flex-1 truncate text-left">{current?.name ?? role.defaultProductName}</span>
          {current && rankOf(current.id) > 0 && (
            <span className="shrink-0 text-[10px] text-zinc-500" title={`#${rankOf(current.id)} of ${role.alternatives.length} on this arena's agent-readiness ladder`}>
              #{rankOf(current.id)}
            </span>
          )}
          <span aria-hidden className="shrink-0 text-[10px] text-zinc-500">
            ▾
          </span>
        </button>
        {selectedId !== role.defaultProductId && (
          <button
            type="button"
            onClick={() => pick(role.defaultProductId)}
            aria-label={`Reset ${role.arenaName} to ${role.defaultProductName}`}
            title={`Reset to ${role.defaultProductName} — this process's default pick`}
            className="shrink-0 rounded-lg border border-zinc-800 px-1.5 py-1 text-xs text-zinc-500 transition hover:border-emerald-400/40 hover:text-emerald-300"
          >
            ↺
          </button>
        )}
      </div>

      {open && (
        <ul
          role="listbox"
          id={listboxId}
          aria-label={`${role.arenaName} products`}
          className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-2xl"
        >
          {role.alternatives.map((o, i) => {
            const active = o.id === selectedId
            return (
              <li key={o.id} role="presentation">
                <button
                  ref={active ? activeOptionRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(o.id)}
                  className={`flex w-full items-center gap-2 border-l-2 px-2.5 py-1.5 text-left text-sm transition ${
                    active
                      ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-300'
                      : 'border-transparent text-zinc-300 hover:bg-emerald-400/10 hover:text-emerald-300'
                  }`}
                >
                  <span className="w-6 shrink-0 text-right text-[10px] text-zinc-500">#{i + 1}</span>
                  <ProductLogoView product={{ id: o.id, name: o.name }} size={20} hasLogo={o.hasLogo ?? false} />
                  <span className="min-w-0 flex-1 truncate">
                    {o.name}
                    {o.id === role.canonicalVendor && <span className="ml-1 text-[10px] text-zinc-500">(canonical)</span>}
                  </span>
                  {o.agentReady !== null && (
                    <span className="shrink-0 text-[10px] text-zinc-500">{o.agentReady.toFixed(0)}/100 agent-ready</span>
                  )}
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
