import { Fragment } from 'react'
import { layerNodes, type DagEdge } from '@/lib/dagLayers'
import type { DagNode } from '@/lib/processes'

// Mini horizontal preview of the process DAG (founder ask 2026-09-23): a compact strip the
// reader can scan at a glance BEFORE the full vertical diagram — the task's Kahn layers left to
// right (lib/dagLayers.ts, the same layering the diagram uses), each step a small route-colored
// dot in the established palette (emerald agent / amber form / sky person / violet ✍ signature),
// parallel layers stacked vertically within their column, thin connectors between columns.
// Labels live in title tooltips only; the whole strip links to #steps. Server-rendered, static,
// quiet (~40–56px tall). Process pages only — chains already read as sections, so this never
// renders there.

const DOT_STYLE: Record<DagNode['route'], { dot: string; label: string }> = {
  agent: { dot: 'border-emerald-400/60 bg-emerald-400/25', label: 'agent' },
  form: { dot: 'border-amber-400/60 bg-amber-400/25', label: 'manual form' },
  person: { dot: 'border-sky-400/60 bg-sky-400/25', label: 'human or computer use' },
}

const SIGNATURE_DOT: { dot: string; label: string } = {
  dot: 'border-violet-400/60 bg-violet-400/25',
  label: '✍ signature — legally human',
}

export default function ProcessDagStrip({ nodes, edges }: { nodes: DagNode[]; edges?: DagEdge[] }) {
  if (nodes.length === 0) return null
  const layers = layerNodes(nodes, edges)
  // Cumulative step offsets, precomputed so nothing is reassigned inside the render map
  // (react-compiler lint) — same trick as ProcessDag's Flow.
  const offsets: number[] = []
  let acc = 0
  for (const layer of layers) {
    offsets.push(acc)
    acc += layer.length
  }
  return (
    <a
      href="#steps"
      title="The whole flow at a glance — one dot per step in run order, stacked dots run in parallel; colors match the diagram (emerald agent, amber manual form, sky human/computer use, violet signature). Jump to the step-by-step diagram."
      className="mt-3 flex max-w-full items-center gap-1.5 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 transition hover:border-zinc-700"
    >
      {layers.map((layer, li) => (
        <Fragment key={layer[0].id}>
          {li > 0 && <span aria-hidden className="h-px w-2.5 shrink-0 bg-zinc-700" />}
          <span className="flex shrink-0 flex-col items-center gap-0.5">
            {layer.map((n, ni) => {
              const style = n.legalSignature ? SIGNATURE_DOT : DOT_STYLE[n.route]
              return (
                <span
                  key={n.id}
                  data-route={n.legalSignature ? 'signature' : n.route}
                  title={`${String(offsets[li] + ni + 1).padStart(2, '0')} ${n.label} — ${style.label}`}
                  className={`h-2.5 w-2.5 rounded-full border ${style.dot}`}
                />
              )
            })}
          </span>
        </Fragment>
      ))}
      <span className="ml-1.5 shrink-0 whitespace-nowrap text-[10px] text-zinc-500">
        {nodes.length} steps ↓
      </span>
    </a>
  )
}
