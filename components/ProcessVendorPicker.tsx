'use client'

import ProductLogoView from '@/components/ProductLogoView'
import { isPicked, stackPicks } from '@/lib/myStack'
import { useProcessLens } from '@/lib/processLens'
import type { ProcessCheckStep } from '@/lib/processCheck'

// Top-of-page vendor picker for process and chain pages (founder 2026-09-22: "a button next to
// the company logo so IF the user clicks on something like Mercury it will drive the process by
// that being the actual vendor selected — the DAG below adjusts; it starts generic with no
// vendors selected"). One click sets the process lens (lib/processLens.ts) for that vendor's
// arena, and every step block, API-call panel, and agent prompt below re-resolves through it —
// the exact same lens the per-step "use" affordances and the ?via= share param drive.
//
// The static HTML renders the generic chip row (an honest market summary); selection state only
// hydrates in client-side, so the SEO page stays byte-identical for readers with no lens/stack.

interface PickerVendor {
  productId: string
  name: string
  hasLogo: boolean
  best: number
}

interface PickerArena {
  arenaId: string
  arenaName: string
  vendors: PickerVendor[]
}

// Chips shown per arena before the rest fold behind the reader's pick logic.
const VENDORS_PER_ARENA = 5

// Derive the pickable market from the same pre-serialized rows the lens resolves against:
// per covering arena, its vendors ranked by their best step score across the whole stream.
function buildArenas(steps: ProcessCheckStep[]): PickerArena[] {
  const arenas = new Map<string, { arenaName: string; vendors: Map<string, PickerVendor> }>()
  for (const step of steps) {
    for (const arena of step.arenas) {
      if (arena.kind !== 'function') continue
      let bucket = arenas.get(arena.arenaId)
      if (!bucket) {
        bucket = { arenaName: arena.arenaName ?? arena.arenaId, vendors: new Map() }
        arenas.set(arena.arenaId, bucket)
      }
      for (const v of arena.vendors) {
        if (v.shutdown) continue // never offer a shutting-down vendor (lib/shutdown.ts rule)
        const existing = bucket.vendors.get(v.productId)
        if (!existing || v.score > existing.best) {
          bucket.vendors.set(v.productId, {
            productId: v.productId,
            name: v.name,
            hasLogo: v.hasLogo ?? false,
            best: v.score,
          })
        }
      }
    }
  }
  return [...arenas.entries()]
    .map(([arenaId, b]) => ({
      arenaId,
      arenaName: b.arenaName,
      vendors: [...b.vendors.values()].sort((a, c) => c.best - a.best || a.name.localeCompare(c.name)),
    }))
    .filter((a) => a.vendors.length > 0)
    .sort((a, c) => a.arenaName.localeCompare(c.arenaName))
}

export default function ProcessVendorPicker({ steps, lensKey }: { steps: ProcessCheckStep[]; lensKey: string }) {
  const { lens, stack, setPick } = useProcessLens(lensKey)
  const arenas = buildArenas(steps)
  if (arenas.length === 0) return null

  return (
    <div className="mt-3 rounded-xl border border-zinc-800 px-3.5 py-2.5">
      <p
        className="text-[10px] uppercase tracking-widest text-zinc-500"
        title="Pick the vendor you actually run for each market and the whole process below adjusts to it — step rankings pin your vendor, its real API calls and agent prompts lead, and steps it can't cover say so honestly. Starts generic with nothing selected; your picks persist on this device and travel in the URL (?via=) when you share it."
      >
        Drive this process with your vendors
      </p>
      <div className="mt-2 space-y-1.5">
        {arenas.map((arena) => {
          const picked = lens.picks[arena.arenaId]
          const stacked = stackPicks(stack, arena.arenaId)
          // The reader's picks must always be visible, wherever they rank.
          const visible = arena.vendors.slice(0, VENDORS_PER_ARENA)
          for (const id of [picked, ...stacked]) {
            if (id && !visible.some((v) => v.productId === id)) {
              const extra = arena.vendors.find((v) => v.productId === id)
              if (extra) visible.push(extra)
            }
          }
          return (
            <div key={arena.arenaId} className="flex flex-wrap items-center gap-1.5">
              <span className="w-32 shrink-0 truncate text-[10px] uppercase tracking-wide text-zinc-600" title={`${arena.arenaName} — the market serving this stream's steps`}>
                {arena.arenaName}
              </span>
              {visible.map((v) => {
                const isLens = picked === v.productId
                // With no explicit lens pick, EVERY stack pick in the arena wears "yours" —
                // multi-vendor stacks are deliberate (lib/myStack.ts v2).
                const isStack = !isLens && picked === undefined && isPicked(stack, arena.arenaId, v.productId)
                const active = isLens || isStack
                return (
                  <button
                    key={v.productId}
                    type="button"
                    onClick={() => setPick(arena.arenaId, isLens ? null : v.productId, v.name)}
                    title={
                      isLens
                        ? `${v.name} is driving this process — click to clear and go back to the generic view`
                        : isStack
                          ? `${v.name} — your "I'm using" stack pick is driving this process; click to pin it explicitly`
                          : `Drive this process with ${v.name} — best judged step score ${v.best.toFixed(0)}/100 across this stream; the steps below adjust to it`
                    }
                    className={`inline-flex items-center gap-1.5 rounded-md border py-0.5 pl-0.5 pr-2 text-xs transition ${
                      active
                        ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-300'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-emerald-400/50 hover:text-emerald-300'
                    }`}
                  >
                    <ProductLogoView product={{ id: v.productId, name: v.name }} size={22} hasLogo={v.hasLogo} />
                    <span className="max-w-[10rem] truncate">{v.name}</span>
                    {isLens && <span aria-hidden className="text-[10px] text-emerald-400/80">✕</span>}
                    {isStack && <span className="rounded bg-emerald-400/10 px-1 text-[9px] font-semibold">yours</span>}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
