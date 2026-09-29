'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import ProductLogoView from '@/components/ProductLogoView'
import { chainIcon, processIcon } from '@/lib/processIcons'
import type { SimStep } from '@/lib/processSim'
import type { SyntheticArtifact, TopVendorPick, VirtualTaskPayload } from '@/lib/virtualStartup'

// The journey DAG viewer (founder ask 2026-09-29; reworked round 4: "too vertically small and no
// one will horizontally scroll… as it goes along, zoom out; don't show parts that are coming
// up"): a TALLER (~200px desktop / ~140px mobile), never-horizontally-scrolling graph of the run
// above the terminal — one node per PROCESS (chain task) in journey order, clustered and colored
// by phase, hand-rolled SVG spine edges. The composed journey is strictly sequential
// (lib/virtualStartup.ts journeyPhases returns time-ordered phases), so the spine is a single
// left→right path with labeled phase clusters — no parallel lanes exist to draw, none invented.
//
// PROGRESSIVE REVEAL (round 4): upcoming nodes are NOT shown. Pre-run only the FIRST node
// renders, dim; each node appears exactly when the reveal reaches its task row (dagNodeReached —
// which also covers "its cluster started": the phase row prints one tick earlier). A completed
// run shows the whole traversed journey, fitted.
//
// ZOOM-OUT FIT (round 4): the strip ALWAYS fits the container width — recomputed flex sizing,
// not a CSS transform (crisper text, no blurry raster scaling). The row is w-full; each cluster
// grows proportionally to its visible node count; every non-active node is flex-1/min-w-0 so the
// traversed tail compresses evenly as nodes accumulate (a clean fisheye), while the ACTIVE node
// stays flex-none at FULL size — pulsing, icon + title always legible. A zoom TIER derived from
// the visible node count (dagZoomTier) steps node padding/icon size down and hides non-active
// node titles below the 'sm' threshold — icons stay, accessible names stay (aria-label), and
// the full title stays in the tooltip.
//
// LIVE state is DERIVED from the exact same revealed-row list the terminal and the state panel
// print from (no timers of its own — tests assert it): a node is pending (dim outline) until the
// reveal reaches its first row, active (pulsing emerald ring) while its rows are printing, done
// (filled, chain-tinted) once its last row printed. Seeded mid-run events and semi-auto decision
// pauses render as small diamond markers under the node whose terminal region carries them; the
// pause the run is currently waiting on pulses amber (its host node is visible by construction —
// a pause row is never past the reveal). The top judged pick's logo dot attaches under a node
// once its step prints. A semi-auto recomposition simply re-derives: printed/passed nodes never
// change (the pause lands before the first affected row), only the unrevealed tail redraws.

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
// Progressive reveal + zoom tiers (founder round 4) — pure, exported for tests.
// ---------------------------------------------------------------------------

// Reveal-on-reach: a node renders once the reveal has reached its task row (revealed ≥ rowStart —
// one row after its phase header printed, so "its cluster started" shows it a tick before its
// state turns active). Upcoming nodes are NOT rendered.
export function dagNodeReached(node: Pick<VsDagNode, 'rowStart'>, revealed: number): boolean {
  return revealed >= node.rowStart
}

// The visible task ids for a reveal position: every reached node, or — before anything is
// reached (pre-run / the first phase row) — ONLY the journey's first node, rendered dim.
export function dagVisibleTaskIds(clusters: readonly VsDagCluster[], revealed: number): Set<string> {
  const out = new Set<string>()
  for (const c of clusters) {
    for (const n of c.nodes) {
      if (dagNodeReached(n, revealed)) out.add(n.taskId)
    }
  }
  if (out.size === 0) {
    const first = clusters[0]?.nodes[0]
    if (first) out.add(first.taskId)
  }
  return out
}

// The zoom tier for a visible-node count: the whole traversed journey always fits the width
// (flex does the fitting); the tier only steps the node CHROME down so compressed nodes stay
// crisp — below 'md', non-active node titles hide (icons stay, aria-labels stay).
export type VsDagZoomTier = 'xl' | 'md' | 'sm' | 'xs'

export function dagZoomTier(visibleCount: number): VsDagZoomTier {
  if (visibleCount <= 5) return 'xl'
  if (visibleCount <= 9) return 'md'
  if (visibleCount <= 14) return 'sm'
  return 'xs'
}

// Whether a non-active node's title text renders at this tier (the active node ALWAYS shows its
// title — it keeps full size regardless of tier).
export function dagTierShowsTitle(tier: VsDagZoomTier): boolean {
  return tier === 'xl' || tier === 'md'
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

// Per-tier node chrome (non-active nodes; the active node always wears the 'xl' chrome).
const TIER_NODE: Record<VsDagZoomTier, { pad: string; icon: string; title: string }> = {
  xl: { pad: 'px-2 py-1.5', icon: 'text-base', title: 'text-[11px]' },
  md: { pad: 'px-1.5 py-1', icon: 'text-sm', title: 'text-[10px]' },
  sm: { pad: 'px-1 py-1', icon: 'text-sm', title: '' },
  xs: { pad: 'px-0.5 py-0.5', icon: 'text-xs', title: '' },
}

// A hand-rolled spine edge: short line + arrowhead, lit emerald once the reveal traversed it
// (its downstream node is active or done); narrower at compressed tiers so it never steals the
// width the nodes are fitting into.
function Edge({ lit, tier }: { lit: boolean; tier: VsDagZoomTier }) {
  const w = tier === 'xl' || tier === 'md' ? 14 : tier === 'sm' ? 9 : 6
  return (
    <svg
      aria-hidden
      width={w}
      height="8"
      viewBox="0 0 16 8"
      preserveAspectRatio="none"
      className="shrink-0 self-center"
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
  // Whether the reveal ticker is live — surfaced as a data attribute (the strip needs no
  // follow-scroll anymore: it never overflows horizontally).
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

  // Progressive reveal + zoom (round 4): only reached nodes render (pre-run: the first node,
  // dim); the tier steps chrome down as the traversed set grows so everything keeps fitting.
  const visible = useMemo(() => dagVisibleTaskIds(clusters, revealed), [clusters, revealed])
  const tier = dagZoomTier(visible.size)

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
      data-dag-tier={tier}
      data-dag-running={running ? 'true' : undefined}
      aria-label="Journey map — the run as a graph"
      className="rounded-xl border border-zinc-800 bg-zinc-950/60"
    >
      {/* Taller viewer (founder round 4): ~200px desktop / ~140px mobile, vertically centered.
          NO horizontal scroll — the row below is w-full and flex-fits every visible node. */}
      <div
        data-testid="vs-journeydag-strip"
        className="flex h-[140px] items-center px-2 sm:h-[200px] sm:px-3"
      >
        <ol className="flex w-full min-w-0 items-center" aria-label="Journey phases">
          {/* Run-press pauses (row 0, before any node) float at the strip's leading edge. */}
          {(markersByTask.get(null) ?? []).length > 0 && (
            <li className="mr-1 flex shrink-0 items-center gap-1 self-center">
              {(markersByTask.get(null) ?? []).map((m) => markerChip(m))}
            </li>
          )}
          {clusters.map((cluster, ci) => {
            const style = chainStyle(cluster.chainId)
            const visibleNodes = cluster.nodes.filter((n) => visible.has(n.taskId))
            // Upcoming clusters are NOT shown (reveal-on-reach) — they appear as the run
            // reaches their first process.
            if (visibleNodes.length === 0) return null
            const firstState = dagNodeState(visibleNodes[0], revealed)
            const clusterHasActive = visibleNodes.some((n) => dagNodeState(n, revealed) === 'active')
            return (
              <li
                key={cluster.phaseKey}
                className="flex min-w-0 items-center"
                // Width shares out proportional to node count; a cluster holding the ACTIVE
                // (full-size) node grows a little extra so its neighbors compress first.
                style={{ flexGrow: visibleNodes.length + (clusterHasActive ? 1 : 0), flexShrink: 1, flexBasis: 0 }}
              >
                {ci > 0 && <Edge lit={firstState !== 'pending'} tier={tier} />}
                <div
                  data-testid="vs-dag-cluster"
                  data-chain={cluster.chainId}
                  className={`min-w-0 flex-1 rounded-lg border px-1 pb-1 pt-0.5 sm:px-1.5 ${style.cluster}`}
                >
                  <p
                    className={`truncate text-[9px] uppercase tracking-wider ${style.label}`}
                    title={`${cluster.title} — from the ${cluster.chainName} playbook`}
                  >
                    <span aria-hidden className="mr-0.5">{chainIcon(cluster.chainId)}</span>
                    {cluster.title}
                  </p>
                  <div className="mt-0.5 flex min-w-0 items-start">
                    {visibleNodes.map((node, ni) => {
                      const state = dagNodeState(node, revealed)
                      const isActive = state === 'active'
                      const pct = node.stepCount > 0 ? Math.round((node.agentSteps / node.stepCount) * 100) : 0
                      const nodeMarkers = markersByTask.get(node.taskId) ?? []
                      const vendorPrinted = node.vendor !== null && node.vendorRow !== -1 && revealed > node.vendorRow
                      // The active node keeps FULL size (fisheye: the traversed tail compresses
                      // around it); everything else wears the tier chrome and flex-shrinks.
                      const chrome = isActive ? TIER_NODE.xl : TIER_NODE[tier]
                      const showTitle = isActive || dagTierShowsTitle(tier)
                      return (
                        <div key={node.taskId} className={`flex items-start ${isActive ? 'shrink-0' : 'min-w-0 flex-1'}`}>
                          {ni > 0 && <Edge lit={state !== 'pending'} tier={tier} />}
                          <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
                            <button
                              type="button"
                              data-testid={`vs-dag-node-${node.taskId}`}
                              data-dag-state={state}
                              data-dag-size={isActive ? 'full' : 'fit'}
                              aria-label={node.title}
                              title={`${node.title} — ${node.stepCount} step${node.stepCount === 1 ? '' : 's'}, ${node.agentSteps} agent-runnable (~${pct}% agent ceiling). Click to jump to it in the terminal.`}
                              onClick={() => onNodeClick?.(node.taskId)}
                              className={`flex w-full min-w-0 items-center justify-center gap-1 rounded-md border leading-none transition ${chrome.pad} ${
                                isActive ? 'max-w-[160px]' : ''
                              } ${
                                state === 'done'
                                  ? style.done
                                  : isActive
                                    ? 'animate-pulse border-emerald-400/70 text-zinc-100 ring-2 ring-emerald-400/50'
                                    : 'border-zinc-800 text-zinc-600'
                              }`}
                            >
                              <span aria-hidden className={`${chrome.icon} ${state === 'pending' ? 'opacity-50' : ''}`}>
                                {processIcon(node.taskId)}
                              </span>
                              {showTitle && (
                                <span className={`min-w-0 truncate ${isActive ? 'text-[11px]' : chrome.title}`}>{node.title}</span>
                              )}
                            </button>
                            {/* Under-node row: the top judged pick's logo dot (once its step
                                printed), the event/pause diamonds, and the ↗ process-page link. */}
                            <span className="flex h-3.5 min-w-0 items-center gap-1">
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
