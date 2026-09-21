// The process LENS — "view this process via the vendors I pick" (founder 2026-09-21: "while on
// a specific process, if the user clicks a vendor I want it to select using that vendor through
// the process and adapt the DAG to using that … also if they have certain vendors they use I
// want them to see the process via those vendors"). Client-safe (no node builtins), the same
// split as lib/processCheck.ts vs lib/processCheckData.ts.
//
// The lens is a client-side view over the SAME static HTML — the personalization contract used
// everywhere on this site: the server snapshot renders the default view byte-identically, and
// only readers who click a vendor or carry an "I'm using" stack see anything change. Nothing
// here recomputes a score: every number is the pre-serialized story-derived step score the
// process page already publishes (lib/processCheckData.ts), only re-arranged.
//
// Resolution order per step (the semantics, tested in lib/__tests__/processLens.test.ts):
//   1. the explicit lens pick for one of the step's arenas — but ONLY when that vendor appears
//      in the step's serialized vendor list for that arena and is not shutdown (lib/shutdown.ts
//      founder rule: a shutdown vendor is never OFFERED, so the lens can never resolve to one);
//   2. else the reader's account-stack pick (lib/processCheck.ts yoursForStep — which DOES let
//      a shutdown pick resolve: the reader really runs it and needs to be told to migrate);
//   3. else null — the default/best view, exactly what the static page shows.
//
// The adaptation is WHO EXECUTES a step, never WHAT IS POSSIBLE: routes and agent ceilings are
// untouched — picking a vendor doesn't make a human step agent-runnable.
//
// Persistence: localStorage under `pa-process-lens:<pageKey>` (taskId on /processes/[slug],
// the chain id on /processes/chains/[chain] so one selection flows across all sections) plus a
// same-tab change event — the exact lib/myStack.ts subscribe pattern. The stored payload also
// carries a productId→name map recorded at click time, so an honest "not covered by <Vendor>"
// gap note can name a vendor on steps where it has no judged evidence (and thus no row to read
// the name from).

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useMyStackMap } from '@/components/useMyStackMap'
import type { StackMap } from './myStack'
import { yoursForStep, type CheckVendor, type ProcessCheckStep } from './processCheck'

// One pick per arena — the same shape as the account stack's StackMap, deliberately: a lens is
// a per-page, click-scoped override of the same "which vendor serves this arena" question.
export type LensMap = Record<string, string>

export interface LensState {
  picks: LensMap
  /** Display names recorded at click time, keyed by productId — pruned to picked ids on write. */
  names: Record<string, string>
}

export const EMPTY_LENS_RAW = '{}'
export const PROCESS_LENS_PREFIX = 'pa-process-lens:'
// Same-tab change event — localStorage's 'storage' event only fires in OTHER tabs (the
// lib/myStack.ts precedent).
export const PROCESS_LENS_EVENT = 'pa-process-lens-change'
export const MAX_LENS_ARENAS = 100

export function lensStorageKey(pageKey: string): string {
  return `${PROCESS_LENS_PREFIX}${pageKey}`
}

// Tolerant parse, entry-wise degradation, never a crash — the lib/myStack.ts parseStackMap
// contract. Anything that isn't { picks: {string: string}, names: {string: string} } degrades.
export function parseLensState(raw: string | null): LensState {
  const empty: LensState = { picks: {}, names: {} }
  if (!raw) return empty
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return empty
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return empty
  const readMap = (value: unknown, cap: number): Record<string, string> => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(value)) {
      if (k === '' || typeof v !== 'string' || v === '') continue
      out[k] = v
      if (Object.keys(out).length >= cap) break
    }
    return out
  }
  const obj = parsed as { picks?: unknown; names?: unknown }
  return { picks: readMap(obj.picks, MAX_LENS_ARENAS), names: readMap(obj.names, MAX_LENS_ARENAS) }
}

// Canonical serialization (sorted keys) so snapshots are stable regardless of insertion order.
export function serializeLensState(state: LensState): string {
  const sorted = (m: Record<string, string>) =>
    Object.fromEntries(Object.entries(m).sort(([a], [b]) => a.localeCompare(b)))
  return JSON.stringify({ picks: sorted(state.picks), names: sorted(state.names) })
}

// Raw snapshot for useSyncExternalStore — the STRING is the snapshot (stable identity between
// writes), '{}' on the server and where localStorage throws.
export function readLensRaw(storageKey: string): string {
  if (typeof window === 'undefined') return EMPTY_LENS_RAW
  try {
    return window.localStorage.getItem(storageKey) ?? EMPTY_LENS_RAW
  } catch {
    return EMPTY_LENS_RAW
  }
}

export function writeLens(storageKey: string, state: LensState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, serializeLensState(state))
  } catch {
    return // storage unavailable — the click is a silent no-op, same as reads
  }
  window.dispatchEvent(new Event(PROCESS_LENS_EVENT))
}

export function subscribeLens(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', callback)
  window.addEventListener(PROCESS_LENS_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(PROCESS_LENS_EVENT, callback)
  }
}

// ---------------------------------------------------------------------------
// Resolution — pure functions over the pre-serialized ProcessCheckStep rows
// ---------------------------------------------------------------------------

export type LensSource = 'lens' | 'stack'

export interface ResolvedStepVendor {
  vendor: CheckVendor & { arenaId: string; arenaName: string }
  source: LensSource
}

// Which vendor executes one step under this lens + stack — the resolution order documented in
// the header. Arenas are tried in serialized order (covering arena first, then extras), the
// same convention as yoursForStep.
export function resolveStepVendor(
  step: ProcessCheckStep,
  lens: LensMap,
  stack: StackMap,
): ResolvedStepVendor | null {
  for (const arena of step.arenas) {
    const pickId = lens[arena.arenaId]
    if (!pickId) continue
    const vendor = arena.vendors.find((v) => v.productId === pickId)
    // A lens pick never resolves to a shutdown vendor — the lens is an OFFER surface
    // (lib/shutdown.ts); the pick falls through to the stack / default instead.
    if (vendor && vendor.shutdown !== true) {
      return { vendor: { ...vendor, arenaId: arena.arenaId, arenaName: arena.arenaName }, source: 'lens' }
    }
  }
  const yours = yoursForStep(step, stack)
  return yours ? { vendor: yours, source: 'stack' } : null
}

export interface LensGap {
  arenaId: string
  arenaName: string
  productId: string
}

// The honest per-step gap: the FIRST of the step's arenas carrying a lens pick that does not
// cover the step (the vendor has no judged evidence on the step's mapped stories, or announced
// a shutdown). Arenas the lens says nothing about are not gaps — the lens never claimed to
// serve them. Callers show the note only when the step didn't resolve via the lens at all.
export function lensGapFor(step: ProcessCheckStep, lens: LensMap): LensGap | null {
  for (const arena of step.arenas) {
    const pickId = lens[arena.arenaId]
    if (!pickId) continue
    const vendor = arena.vendors.find((v) => v.productId === pickId)
    if (!vendor || vendor.shutdown === true) {
      return { arenaId: arena.arenaId, arenaName: arena.arenaName, productId: pickId }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// The process-level summary — lib/processRankings.ts processLeaderboard's math, client-safe
// ---------------------------------------------------------------------------

const round1 = (n: number) => Math.round(n * 10) / 10

export interface LensSummary {
  /** The distinct vendors the lens/stack resolves across the steps, first-seen order. */
  vendors: Array<{ productId: string; name: string; source: LensSource }>
  /** Steps a resolved vendor serves (has a judged step score on). */
  served: number
  /** All rankable steps (== steps.length) — the leaderboard's denominator. */
  rankable: number
  /** Sum of resolved step scores over ALL rankable steps (unserved = 0), normalized 0–100 —
   *  the SAME formula as processLeaderboard's processScore (sum / rankable, one decimal). */
  score: number
}

export function lensProcessSummary(
  steps: ProcessCheckStep[],
  lens: LensMap,
  stack: StackMap,
): LensSummary {
  const vendors: LensSummary['vendors'] = []
  const seen = new Set<string>()
  let sum = 0
  let served = 0
  for (const step of steps) {
    const r = resolveStepVendor(step, lens, stack)
    if (!r) continue
    sum += r.vendor.score
    served += 1
    if (!seen.has(r.vendor.productId)) {
      seen.add(r.vendor.productId)
      vendors.push({ productId: r.vendor.productId, name: r.vendor.name, source: r.source })
    }
  }
  return {
    vendors,
    served,
    rankable: steps.length,
    score: steps.length === 0 ? 0 : round1(sum / steps.length),
  }
}

// ---------------------------------------------------------------------------
// The hook — useMyStackMap's useSyncExternalStore pattern, plus the stack itself
// ---------------------------------------------------------------------------

export interface ProcessLens {
  lens: LensState
  stack: StackMap
  /** Set (or, with null, clear) the lens pick for one arena. `name` is recorded for honest
   *  gap notes on steps the vendor doesn't cover. No-op without a pageKey. */
  setPick: (arenaId: string, productId: string | null, name?: string) => void
  clearLens: () => void
  resolveFor: (step: ProcessCheckStep) => ResolvedStepVendor | null
}

const EMPTY_STATE: LensState = { picks: {}, names: {} }

export function useProcessLens(pageKey: string | undefined): ProcessLens {
  const storageKey = pageKey === undefined || pageKey === '' ? null : lensStorageKey(pageKey)
  const getSnapshot = useCallback(
    () => (storageKey === null ? EMPTY_LENS_RAW : readLensRaw(storageKey)),
    [storageKey],
  )
  // Server snapshot is '{}' — the static HTML always renders the default (no-lens) view.
  const raw = useSyncExternalStore(subscribeLens, getSnapshot, () => EMPTY_LENS_RAW)
  const lens = useMemo(() => (raw === EMPTY_LENS_RAW ? EMPTY_STATE : parseLensState(raw)), [raw])
  const stack = useMyStackMap()

  const setPick = useCallback(
    (arenaId: string, productId: string | null, name?: string) => {
      if (storageKey === null) return
      const current = parseLensState(readLensRaw(storageKey))
      const picks = { ...current.picks }
      const names = { ...current.names }
      if (productId === null) delete picks[arenaId]
      else {
        picks[arenaId] = productId
        if (name) names[productId] = name
      }
      const pickedIds = new Set(Object.values(picks))
      for (const id of Object.keys(names)) if (!pickedIds.has(id)) delete names[id]
      writeLens(storageKey, { picks, names })
    },
    [storageKey],
  )

  const clearLens = useCallback(() => {
    if (storageKey === null) return
    writeLens(storageKey, { picks: {}, names: {} })
  }, [storageKey])

  const resolveFor = useCallback(
    (step: ProcessCheckStep) => resolveStepVendor(step, lens.picks, stack),
    [lens, stack],
  )

  return { lens, stack, setPick, clearLens, resolveFor }
}
