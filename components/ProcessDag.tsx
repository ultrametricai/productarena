import Link from 'next/link'
import { Fragment } from 'react'
import CeilingBar from '@/components/CeilingBar'
import ProductLogoView from '@/components/ProductLogoView'
import { resolveGapStep } from '@/lib/gapClosers'
import { hasLogo } from '@/lib/logos'
import type { DagNode } from '@/lib/processes'
import { formatMinutes, VENDOR_ARENA, vendorAlternatives, vendorLabel } from '@/lib/processes'

// Block-diagram rendering of a process DAG (server component — <details> for expansion, no
// client JS). Visual language ported from Ultrametric's internal ai-docs eval dashboard and
// adapted to the zinc/emerald theme: each step is a bordered block card with a route-coded
// border + tinted fill (emerald = agent-runnable, amber = manual form/portal, red-zinc = needs
// a human), blocks joined by a vertical connector spine with arrowheads. Layers with true
// parallelism (from dag.edges) render side by side inside a dashed "runs in parallel" group.
//
// Every mapped-vendor block also surfaces the market: beneath the canonical vendor chip, an
// "or:" row lists the arena's top alternatives by agent-readiness (lib/processes.ts swap-options
// machinery). Non-agent steps with an agentic gap-closer (lib/gapClosers.ts, resolved at build
// time against live arenas) keep their compact "⚡ agentic workaround" line inside the block.

export interface DagEdge {
  from: string
  to: string
}

// One task's slice of a chained run — rendered as a labeled header block inside the same
// continuous flow so a whole chain reads as one diagram.
export interface DagSection {
  key: string
  kicker?: string
  title: string
  href?: string
  meta?: string
  pct?: number
  nodes: DagNode[]
  edges?: DagEdge[]
}

const ROUTE_STYLE: Record<DagNode['route'], { block: string; badge: string; label: string }> = {
  agent: {
    block: 'border-emerald-400/40 bg-emerald-400/[0.06]',
    badge: 'bg-emerald-400/10 text-emerald-300',
    label: 'agent',
  },
  form: {
    block: 'border-amber-400/40 bg-amber-400/[0.05]',
    badge: 'bg-amber-400/10 text-amber-300',
    label: 'manual form',
  },
  person: {
    block: 'border-red-900/70 bg-red-400/[0.04]',
    badge: 'bg-red-400/10 text-red-300/90',
    label: 'human',
  },
}

// Kahn layering (same approach as the ai-docs dashboard's layoutDAG): each topological layer is
// one row of the diagram; a layer with >1 node is genuine parallelism. Tasks without edges are
// linear by node order. Nodes an edge cycle would strand are appended as their own rows.
function layerNodes(nodes: DagNode[], edges?: DagEdge[]): DagNode[][] {
  if (!edges || edges.length === 0) return nodes.map((n) => [n])
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const order = new Map(nodes.map((n, i) => [n.id, i]))
  const inDegree = new Map(nodes.map((n) => [n.id, 0]))
  const children = new Map<string, string[]>(nodes.map((n) => [n.id, []]))
  for (const e of edges) {
    if (!byId.has(e.from) || !byId.has(e.to)) continue
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1)
    children.get(e.from)?.push(e.to)
  }
  const layers: DagNode[][] = []
  const seen = new Set<string>()
  let frontier = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id)
  while (frontier.length > 0) {
    const layer: string[] = []
    const next: string[] = []
    for (const id of frontier) {
      if (seen.has(id)) continue
      seen.add(id)
      layer.push(id)
      for (const child of children.get(id) ?? []) {
        const d = (inDegree.get(child) ?? 1) - 1
        inDegree.set(child, d)
        if (d <= 0) next.push(child)
      }
    }
    if (layer.length > 0) {
      layer.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
      layers.push(layer.map((id) => byId.get(id)!))
    }
    frontier = next
  }
  for (const n of nodes) if (!seen.has(n.id)) layers.push([n])
  return layers
}

// Vertical connector segment with an arrowhead — the spine joint between blocks. Fixed left
// offset so every joint lines up down the whole diagram.
function Connector() {
  return (
    <svg aria-hidden width="16" height="28" viewBox="0 0 16 28" className="ml-6 block text-zinc-600">
      <line x1="8" y1="0" x2="8" y2="20.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 20 L8 27 L11.5 20 Z" fill="currentColor" />
    </svg>
  )
}

function NodeBlock({ node, index }: { node: DagNode; index: number }) {
  const style = ROUTE_STYLE[node.route]
  const arenaId = node.vendor ? VENDOR_ARENA[node.vendor] : undefined
  const alts = node.vendor ? vendorAlternatives(node.vendor) : []
  const calls = node.functionCalls ?? []
  const gap = resolveGapStep(node)
  const closer = gap?.kind === 'closer' ? gap.closer : null

  const vendorChip = node.vendor && (
    <>
      <ProductLogoView
        product={{ id: node.vendor, name: vendorLabel(node.vendor) }}
        size={16}
        hasLogo={hasLogo(node.vendor)}
      />
      <span className="truncate">{vendorLabel(node.vendor)}</span>
    </>
  )

  return (
    <div className={`min-w-0 rounded-lg border p-3 ${style.block}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-medium text-zinc-100">
          <span className="mr-1.5 font-mono text-[10px] tabular-nums text-zinc-500">
            {String(index).padStart(2, '0')}
          </span>
          {node.label}
        </p>
        <span
          className={`mt-px shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}
        >
          {style.label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11px]">
        {node.vendor &&
          (arenaId ? (
            <Link
              href={`/arena/${arenaId}/product/${node.vendor}`}
              className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900/60 py-0.5 pl-0.5 pr-2 text-zinc-200 transition hover:border-emerald-400/60 hover:text-emerald-300"
            >
              {vendorChip}
            </Link>
          ) : (
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 py-0.5 pl-0.5 pr-2 text-zinc-400">
              {vendorChip}
            </span>
          ))}
        <span className="font-mono tabular-nums text-zinc-500">{formatMinutes(node.estimatedMinutes)}</span>
        {node.approvalRequired && (
          <span
            className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300"
            title="Approval gate — agent-runnable, but a human signs off first"
          >
            ⏸ approval gate
          </span>
        )}
        {node.async && (
          <span className="text-zinc-500" title="Async — the process waits on a third party here">
            ⏳ async
          </span>
        )}
        {node.riskLevel && node.riskLevel !== 'low' && (
          <span className={node.riskLevel === 'high' ? 'font-semibold text-red-300/90' : 'text-zinc-500'}>
            {node.riskLevel} risk
          </span>
        )}
      </div>

      {alts.length > 0 && (
        <p className="mt-1.5 text-[11px] text-zinc-500">
          <span className="mr-1.5 text-[10px] uppercase tracking-wide">or:</span>
          {alts.map((o, i) => (
            <span key={o.id} className="whitespace-nowrap">
              {i > 0 && <span className="mx-1.5 text-zinc-700">·</span>}
              <Link
                href={`/arena/${o.arenaId}/product/${o.id}`}
                className="text-zinc-300 transition hover:text-emerald-300"
              >
                {o.name}
              </Link>
              {o.agentReady !== null && (
                <span
                  className="ml-1 font-mono text-[10px] tabular-nums text-emerald-400/80"
                  title={`${o.agentReady.toFixed(0)}/100 agent-ready`}
                >
                  {o.agentReady.toFixed(0)}
                </span>
              )}
            </span>
          ))}
        </p>
      )}

      {calls.length > 0 ? (
        <details className="group mt-2">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-[11px] text-zinc-500 transition hover:text-zinc-300 [&::-webkit-details-marker]:hidden">
            <span aria-hidden className="inline-block text-[9px] transition-transform group-open:rotate-90">
              ▶
            </span>
            {calls.length} API call{calls.length === 1 ? '' : 's'}
          </summary>
          <ul className="mt-1.5 space-y-0.5 border-l border-zinc-800 pl-3">
            {calls.map((fc) => (
              <li key={fc.method} className="truncate font-mono text-[11px] text-zinc-400" title={fc.description}>
                {fc.method}
                {fc.type === 'manual' && <span className="ml-1 text-amber-400/80">(manual)</span>}
              </li>
            ))}
          </ul>
        </details>
      ) : (
        node.toolCall && <p className="mt-2 truncate font-mono text-[11px] text-zinc-500">{node.toolCall}</p>
      )}

      {closer && (
        <p className="mt-2 text-[11px] text-zinc-400">
          <span className="text-emerald-300/90">⚡ agentic workaround:</span> {closer.blurb} —{' '}
          <Link
            href={`/arena/${closer.arenaId}/product/${closer.topProduct.id}`}
            className="text-zinc-300 underline decoration-zinc-700 underline-offset-2 transition hover:text-emerald-300"
          >
            {closer.topProduct.name}
          </Link>
          {', '}
          <Link href={`/arena/${closer.arenaId}`} className="transition hover:text-emerald-300">
            top of {closer.arenaName} →
          </Link>
          {closer.caution && <span className="text-amber-400/80"> · {closer.caution}</span>}
        </p>
      )}
    </div>
  )
}

function Flow({ nodes, edges }: { nodes: DagNode[]; edges?: DagEdge[] }) {
  const layers = layerNodes(nodes, edges)
  let stepIndex = 0
  return (
    <>
      {layers.map((layer, li) => {
        const start = stepIndex
        stepIndex += layer.length
        return (
          <Fragment key={layer[0].id}>
            {li > 0 && <Connector />}
            {layer.length === 1 ? (
              <NodeBlock node={layer[0]} index={start + 1} />
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-700/80 p-2">
                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  runs in parallel · {layer.length}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {layer.map((n, ni) => (
                    <NodeBlock key={n.id} node={n} index={start + ni + 1} />
                  ))}
                </div>
              </div>
            )}
          </Fragment>
        )
      })}
    </>
  )
}

// Chain divider: the task title as a header block in the same flow, so a chained run reads as
// one continuous diagram with labeled sections.
function SectionHeader({ section }: { section: DagSection }) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          {section.kicker && (
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">{section.kicker}</p>
          )}
          <h3 className="font-display text-base font-semibold tracking-tight text-zinc-100">
            {section.href ? (
              <Link href={section.href} className="transition hover:text-emerald-300">
                {section.title}
              </Link>
            ) : (
              section.title
            )}
          </h3>
        </div>
        {typeof section.pct === 'number' && <CeilingBar pct={section.pct} />}
      </div>
      {section.meta && <p className="mt-1 text-xs text-zinc-500">{section.meta}</p>}
    </div>
  )
}

export default function ProcessDag({
  nodes,
  edges,
  sections,
}: {
  nodes?: DagNode[]
  edges?: DagEdge[]
  sections?: DagSection[]
}) {
  if (sections && sections.length > 0) {
    return (
      <div>
        {sections.map((s, si) => (
          <Fragment key={s.key}>
            {si > 0 && <Connector />}
            <SectionHeader section={s} />
            <Connector />
            <Flow nodes={s.nodes} edges={s.edges} />
          </Fragment>
        ))}
      </div>
    )
  }
  return (
    <div>
      <Flow nodes={nodes ?? []} edges={edges} />
    </div>
  )
}
