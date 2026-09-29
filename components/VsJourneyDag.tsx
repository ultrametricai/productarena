'use client'

import { useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import ProductLogoView from '@/components/ProductLogoView'
import { chainIcon, processIcon } from '@/lib/processIcons'
import type { SimStep } from '@/lib/processSim'
import type { SyntheticArtifact, TopVendorPick, VirtualTaskPayload } from '@/lib/virtualStartup'

// The journey DAG strip (founder ask 2026-09-29: "the DAG visualization UI unit … on top of the
// terminal output for the startup simulator"): an always-visible horizontal graph of the run —
// one node per PROCESS (chain task) in journey order, clustered and colored by phase (the chain
// it belongs to), hand-rolled SVG edges left→right along the journey spine. The composed journey
// is strictly sequential (lib/virtualStartup.ts journeyPhases returns time-ordered phases), so
// the spine is a single left→right path with labeled phase clusters — no parallel lanes exist to
// draw, and none are invented.
//
// LIVE state is DERIVED from the exact same revealed-row list the terminal and the state panel
// print from (no timers of its own — tests assert it): a node is pending (dim outline) until the
// reveal reaches its first row, active (pulsing emerald ring) while its rows are printing, done
// (filled, chain-tinted) once its last row printed. Seeded mid-run events and semi-auto decision
// pauses render as small diamond markers under the node whose terminal region carries them; the
// pause the run is currently waiting on pulses amber. The top judged pick's logo dot attaches
// under a node once its step prints. Pre-run the FULL journey skeleton renders dim — the strip
// shows what WILL run, deterministic from the composed rows. A semi-auto recomposition simply
// re-derives: printed/passed nodes never change (the pause lands before the first affected row),
// only the unrevealed tail redraws.
//
// Rendering: pure flex + tiny inline SVG edges (no d3/reactflow — no new dependencies), one
// horizontally scrollable strip that keeps the active node in view while running with the same
// follow-slack contract as the terminal: the follow flag re-derives from where the viewport
// actually is, so a reader's scroll away pauses following and scrolling back re-engages it.

// How close (px) the active node must be to the visible strip to still count as "followed" —
// the horizontal analog of the terminal's FOLLOW_SLACK_PX.
const DAG_FOLLOW_SLACK_PX = 24

// ---------------------------------------------------------------------------
// Source rows — structurally identical to VirtualStartup.tsx's Row union (mirrored here so the
// two components stay decoupled; TypeScript's structural typing keeps them assignable).
// ---------------------------------------------------------------------------

export type VsDagSourceRow =
  | { kind: 'phase'; key: string; title: string; chainId: string; chainName: string; note: string | null }
  | { kind: 'task'; key: string; task: VirtualTaskPayload }
  | { kind: 'day'; key: string; day: number }
  | { kind: 'step'; key: string; step: SimStep; top: TopVendorPick | null; outNote: string | null; outMinutes: number }
  | { kind: 'artifact'; key: string; artifact: SyntheticArtifact }
  | { kind: 'vsevent'; key: string; eventId: string; day: number }

// A semi-auto pause point (VirtualStartup's pause schedule): the run stops at row index `at`
// until the reader answers `id` (a decision id or 'name'); `label` is the visible card title.
export interface VsDagPause {
  id: string
  at: number
  label: string
}

// ---------------------------------------------------------------------------
// Pure derivation — exported so tests can drive it directly.
// ---------------------------------------------------------------------------

export interface VsDagNode {
  taskId: string
  title: string
  slug: string
  stepCount: number
  agentSteps: number
  // The row-index span this process occupies in the terminal: rowStart is its task row, rowEnd
  // the last row (step/artifact/day/event) printed under it before the next process or phase.
  rowStart: number
  rowEnd: number
  // The first printed step's top judged pick (logo dot) and the row where it prints (-1 = none).
  vendor: { productId: string; name: string; hasLogo: boolean } | null
  vendorRow: number
}

export interface VsDagCluster {
  phaseKey: string
  title: string
  chainId: string
  chainName: string
  nodes: VsDagNode[]
}

export interface VsDagMarker {
  kind: 'event' | 'pause'
  key: string
  id: string
  // The drawn sim day for events; null for pauses (a pause is a row position, not a day).
  day: number | null
  // The node the marker attaches under (null = before the first node — a Run-press pause).
  taskId: string | null
  // The row index the marker lives at — revealed once the cursor passes it.
  at: number
}

export function deriveJourneyDag(
  rows: readonly VsDagSourceRow[],
  pauses: readonly VsDagPause[] = [],
): { clusters: VsDagCluster[]; markers: VsDagMarker[] } {
  const clusters: VsDagCluster[] = []
  const nodes: VsDagNode[] = []
  const markers: VsDagMarker[] = []
  let current: VsDagNode | null = null
  const close = (endIdx: number) => {
    if (current) current.rowEnd = endIdx
    current = null
  }
  rows.forEach((row, i) => {
    if (row.kind === 'phase') {
      close(i - 1)
      clusters.push({ phaseKey: row.key, title: row.title, chainId: row.chainId, chainName: row.chainName, nodes: [] })
    } else if (row.kind === 'task') {
      close(i - 1)
      current = {
        taskId: row.task.id,
        title: row.task.title,
        slug: row.task.slug,
        stepCount: row.task.steps.length,
        agentSteps: row.task.steps.filter((s) => s.route === 'agent').length,
        rowStart: i,
        rowEnd: rows.length - 1,
        vendor: null,
        vendorRow: -1,
      }
      // Defensive: buildRunRows always leads with a phase row, so this never fires in practice.
      if (clusters.length === 0) clusters.push({ phaseKey: 'phase-unknown', title: '', chainId: '', chainName: '', nodes: [] })
      clusters[clusters.length - 1].nodes.push(current)
      nodes.push(current)
    } else if (row.kind === 'step') {
      if (current && current.vendor === null && row.top) {
        current.vendor = { productId: row.top.productId, name: row.top.name, hasLogo: row.top.hasLogo === true }
        current.vendorRow = i
      }
    } else if (row.kind === 'vsevent') {
      markers.push({
        kind: 'event',
        key: `event-${row.eventId}`,
        id: row.eventId,
        day: row.day,
        taskId: current?.taskId ?? null,
        at: i,
      })
    }
  })
  // A pause attaches under the node whose terminal region contains its row (the last node whose
  // task row is at or before the pause index); a Run-press pause (at 0, before any node) floats
  // at the strip's leading edge.
  for (const p of pauses) {
    let host: VsDagNode | null = null
    for (const n of nodes) {
      if (n.rowStart <= p.at) host = n
      else break
    }
    markers.push({ kind: 'pause', key: `pause-${p.id}`, id: p.id, day: null, taskId: host?.taskId ?? null, at: p.at })
  }
  return { clusters: clusters.filter((c) => c.nodes.length > 0), markers }
}

export type VsDagNodeState = 'pending' | 'active' | 'done'

// A node lights as the reveal passes it: done once every row under it printed, active while the
// cursor sits inside its span, pending (dim skeleton) before the reveal reaches it. Derived from
// the same `revealed` counter the terminal slices by — never a timer of this component's own.
export function dagNodeState(node: Pick<VsDagNode, 'rowStart' | 'rowEnd'>, revealed: number): VsDagNodeState {
  if (revealed > node.rowEnd) return 'done'
  if (revealed > node.rowStart) return 'active'
  return 'pending'
}

export function activeDagTaskId(clusters: readonly VsDagCluster[], revealed: number): string | null {
  for (const c of clusters) {
    for (const n of c.nodes) {
      if (dagNodeState(n, revealed) === 'active') return n.taskId
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Chain palette — one hue per journey chain (lib/virtualStartup.ts VS_CHAIN_IDS), full literal
// Tailwind classes (no dynamic class construction). Emerald is reserved for the ACTIVE ring and
// fuchsia for synthetic artifacts, so neither appears as a cluster hue.
// ---------------------------------------------------------------------------

interface ChainStyle {
  cluster: string // cluster border + label tint
  label: string
  done: string // filled node once every row printed
}

const CHAIN_STYLES: Record<string, ChainStyle> = {
  'name-the-company': { cluster: 'border-sky-400/30', label: 'text-sky-300/80', done: 'border-sky-400/50 bg-sky-400/10 text-zinc-200' },
  'company-launch': { cluster: 'border-violet-400/30', label: 'text-violet-300/80', done: 'border-violet-400/50 bg-violet-400/10 text-zinc-200' },
  'raise-a-seed-round': { cluster: 'border-amber-400/30', label: 'text-amber-300/80', done: 'border-amber-400/50 bg-amber-400/10 text-zinc-200' },
  'set-up-compliance': { cluster: 'border-teal-400/30', label: 'text-teal-300/80', done: 'border-teal-400/50 bg-teal-400/10 text-zinc-200' },
  'ship-v1': { cluster: 'border-lime-400/30', label: 'text-lime-300/80', done: 'border-lime-400/50 bg-lime-400/10 text-zinc-200' },
  'launch-website': { cluster: 'border-cyan-400/30', label: 'text-cyan-300/80', done: 'border-cyan-400/50 bg-cyan-400/10 text-zinc-200' },
  'get-paid': { cluster: 'border-rose-400/30', label: 'text-rose-300/80', done: 'border-rose-400/50 bg-rose-400/10 text-zinc-200' },
  'first-hire': { cluster: 'border-indigo-400/30', label: 'text-indigo-300/80', done: 'border-indigo-400/50 bg-indigo-400/10 text-zinc-200' },
  'launch-on-product-hunt': { cluster: 'border-orange-400/30', label: 'text-orange-300/80', done: 'border-orange-400/50 bg-orange-400/10 text-zinc-200' },
  'land-the-enterprise-deal': { cluster: 'border-purple-400/30', label: 'text-purple-300/80', done: 'border-purple-400/50 bg-purple-400/10 text-zinc-200' },
}

const CHAIN_FALLBACK: ChainStyle = { cluster: 'border-zinc-700', label: 'text-zinc-400', done: 'border-zinc-600 bg-zinc-800 text-zinc-200' }

function chainStyle(chainId: string): ChainStyle {
  return CHAIN_STYLES[chainId] ?? CHAIN_FALLBACK
}

// A hand-rolled spine edge: short line + arrowhead, lit emerald once the reveal traversed it
// (its downstream node is active or done).
function Edge({ lit, tall }: { lit: boolean; tall?: boolean }) {
  return (
    <svg
      aria-hidden
      width="16"
      height="8"
      viewBox="0 0 16 8"
      className={`mx-0.5 shrink-0 ${tall ? 'mt-[26px]' : 'mt-[13px]'}`}
    >
      <line x1="0" y1="4" x2="10" y2="4" strokeWidth="1.5" className={lit ? 'stroke-emerald-400/70' : 'stroke-zinc-700'} />
      <path d="M10 1 L15.5 4 L10 7 Z" className={lit ? 'fill-emerald-400/70' : 'fill-zinc-700'} />
    </svg>
  )
}

export default function VsJourneyDag({
  rows,
  revealed,
  running,
  waitingOn = null,
  pauses = [],
  eventTitles = {},
  onNodeClick,
}: {
  // The SAME assembled row list the terminal slices — the strip derives everything from it.
  rows: VsDagSourceRow[]
  // How many rows the terminal has printed (the shared reveal counter).
  revealed: number
  // Whether the reveal ticker is live — the strip only auto-follows while running.
  running: boolean
  // The semi-auto pause the run is currently waiting on (decision id or 'name'); its marker pulses.
  waitingOn?: string | null
  // The semi-auto pause schedule (still-unanswered decisions + the naming card).
  pauses?: VsDagPause[]
  // Event id → title, for the event diamonds' tooltips.
  eventTitles?: Record<string, string>
  // Primary node action: scroll the terminal to this process's first printed row.
  onNodeClick?: (taskId: string) => void
}) {
  const { clusters, markers } = useMemo(() => deriveJourneyDag(rows, pauses), [rows, pauses])
  const pauseLabels = useMemo(() => new Map(pauses.map((p) => [p.id, p.label])), [pauses])
  const markersByTask = useMemo(() => {
    const m = new Map<string | null, VsDagMarker[]>()
    for (const marker of markers) {
      const list = m.get(marker.taskId) ?? []
      list.push(marker)
      m.set(marker.taskId, list)
    }
    return m
  }, [markers])
  const activeId = useMemo(() => activeDagTaskId(clusters, revealed), [clusters, revealed])

  // Follow the active node while running — the terminal's follow-slack contract, horizontal:
  // any scroll re-derives the flag from whether the active node is (near) in view, so a reader's
  // scroll away pauses following and scrolling back re-engages it. No timers here.
  const stripRef = useRef<HTMLDivElement>(null)
  const followRef = useRef(true)
  useEffect(() => {
    if (!running || !followRef.current) return
    const el = stripRef.current?.querySelector<HTMLElement>('[data-dag-state="active"]')
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [revealed, running, activeId])
  function onStripScroll() {
    const wrap = stripRef.current
    if (!wrap) return
    const active = wrap.querySelector<HTMLElement>('[data-dag-state="active"]')
    if (!active) {
      followRef.current = true
      return
    }
    const left = active.offsetLeft - wrap.scrollLeft
    followRef.current = left > -DAG_FOLLOW_SLACK_PX && left + active.offsetWidth < wrap.clientWidth + DAG_FOLLOW_SLACK_PX
  }

  function markerChip(m: VsDagMarker) {
    const revealedMarker = revealed > m.at
    const activePause = m.kind === 'pause' && waitingOn !== null && waitingOn === m.id
    const title =
      m.kind === 'event'
        ? `day ${m.day} — ${eventTitles[m.id] ?? m.id} (seeded mid-run event)`
        : `${pauseLabels.get(m.id) ?? m.id} — the run ${activePause ? 'is waiting on you here' : 'pauses here for your decision'} (semi-auto)`
    return (
      <span
        key={m.key}
        data-testid={`vs-dag-marker-${m.kind}`}
        data-marker-id={m.id}
        data-marker-active={activePause ? 'true' : undefined}
        title={title}
        className={`inline-block h-1.5 w-1.5 shrink-0 rotate-45 ${
          activePause
            ? 'animate-pulse bg-amber-300'
            : m.kind === 'pause'
              ? revealedMarker
                ? 'bg-amber-400/80'
                : 'bg-amber-400/30'
              : revealedMarker
                ? 'bg-fuchsia-400/90'
                : 'bg-fuchsia-400/30'
        }`}
      >
        <span className="sr-only">{title}</span>
      </span>
    )
  }

  return (
    <section
      data-testid="vs-journeydag"
      aria-label="Journey map — the run as a graph"
      className="rounded-xl border border-zinc-800 bg-zinc-950/60"
    >
      <div
        ref={stripRef}
        onScroll={onStripScroll}
        data-testid="vs-journeydag-strip"
        className="overflow-x-auto px-2 py-1.5 sm:px-3 sm:py-2"
      >
        <ol className="flex w-max items-start" aria-label="Journey phases">
          {/* Run-press pauses (row 0, before any node) float at the strip's leading edge. */}
          {(markersByTask.get(null) ?? []).length > 0 && (
            <li className="mr-1 flex h-9 items-center gap-1 sm:h-10">
              {(markersByTask.get(null) ?? []).map((m) => markerChip(m))}
            </li>
          )}
          {clusters.map((cluster, ci) => {
            const style = chainStyle(cluster.chainId)
            const firstState = dagNodeState(cluster.nodes[0], revealed)
            return (
              <li key={cluster.phaseKey} className="flex items-start">
                {ci > 0 && <Edge lit={firstState !== 'pending'} tall />}
                <div
                  data-testid="vs-dag-cluster"
                  data-chain={cluster.chainId}
                  className={`rounded-lg border px-1.5 pb-1 pt-0.5 ${style.cluster}`}
                >
                  <p
                    className={`truncate text-[9px] uppercase tracking-wider ${style.label}`}
                    title={`${cluster.title} — from the ${cluster.chainName} playbook`}
                  >
                    <span aria-hidden className="mr-0.5">{chainIcon(cluster.chainId)}</span>
                    {cluster.title}
                  </p>
                  <div className="mt-0.5 flex items-start">
                    {cluster.nodes.map((node, ni) => {
                      const state = dagNodeState(node, revealed)
                      const pct = node.stepCount > 0 ? Math.round((node.agentSteps / node.stepCount) * 100) : 0
                      const nodeMarkers = markersByTask.get(node.taskId) ?? []
                      const vendorPrinted = node.vendor !== null && node.vendorRow !== -1 && revealed > node.vendorRow
                      return (
                        <div key={node.taskId} className="flex items-start">
                          {ni > 0 && <Edge lit={state !== 'pending'} />}
                          <div className="flex flex-col items-center gap-0.5">
                            <button
                              type="button"
                              data-testid={`vs-dag-node-${node.taskId}`}
                              data-dag-state={state}
                              aria-label={node.title}
                              title={`${node.title} — ${node.stepCount} step${node.stepCount === 1 ? '' : 's'}, ${node.agentSteps} agent-runnable (~${pct}% agent ceiling). Click to jump to it in the terminal.`}
                              onClick={() => onNodeClick?.(node.taskId)}
                              className={`flex max-w-[104px] items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] leading-none transition sm:max-w-[128px] ${
                                state === 'done'
                                  ? style.done
                                  : state === 'active'
                                    ? 'animate-pulse border-emerald-400/70 text-zinc-100 ring-2 ring-emerald-400/50'
                                    : 'border-zinc-800 text-zinc-600'
                              }`}
                            >
                              <span aria-hidden className={state === 'pending' ? 'opacity-50' : ''}>{processIcon(node.taskId)}</span>
                              <span className="min-w-0 truncate">{node.title}</span>
                            </button>
                            {/* Under-node row: the top judged pick's logo dot (once its step
                                printed), the event/pause diamonds, and the ↗ process-page link. */}
                            <span className="flex h-3.5 items-center gap-1">
                              {vendorPrinted && node.vendor && (
                                <span
                                  data-testid={`vs-dag-vendor-${node.vendor.productId}`}
                                  title={`${node.vendor.name} — top judged pick for this process's step`}
                                >
                                  <ProductLogoView
                                    product={{ id: node.vendor.productId, name: node.vendor.name }}
                                    size={12}
                                    hasLogo={node.vendor.hasLogo}
                                  />
                                </span>
                              )}
                              {nodeMarkers.map((m) => markerChip(m))}
                              <Link
                                href={`/processes/${node.slug}`}
                                data-testid={`vs-dag-open-${node.taskId}`}
                                aria-label={`${node.title} — open the process page`}
                                title={`${node.title} — open the process page`}
                                className="text-[9px] leading-none text-zinc-700 transition hover:text-emerald-300"
                              >
                                ↗
                              </Link>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
