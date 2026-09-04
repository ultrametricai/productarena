import Link from 'next/link'
import type { DagNode } from '@/lib/processes'
import { formatMinutes, VENDOR_ARENA, vendorLabel } from '@/lib/processes'

// Vertical step-flow rendering of a process DAG (server component — plain divs, no client JS).
// Route-coded: emerald = agent-runnable, amber = manual form/portal (no API path), red-ish
// zinc = needs a human. ⏸ marks approval gates (agent-runnable, human-gated), ⏳ marks async
// waits. Per-step recorded API/tool calls render in mono under the step.

const ROUTE_STYLE: Record<DagNode['route'], { dot: string; chip: string; label: string }> = {
  agent: {
    dot: 'bg-emerald-400',
    chip: 'border-emerald-400/40 text-emerald-300',
    label: 'agent',
  },
  form: {
    dot: 'bg-amber-400',
    chip: 'border-amber-400/40 text-amber-300',
    label: 'manual form',
  },
  person: {
    dot: 'bg-red-400/70',
    chip: 'border-red-900/60 text-red-200/80',
    label: 'human',
  },
}

export default function ProcessDag({ nodes }: { nodes: DagNode[] }) {
  return (
    <ol className="space-y-0">
      {nodes.map((node, i) => {
        const style = ROUTE_STYLE[node.route]
        const arenaId = node.vendor ? VENDOR_ARENA[node.vendor] : undefined
        const calls = node.functionCalls ?? []
        return (
          <li key={node.id} className="relative flex gap-3 pb-5 last:pb-0">
            {/* rail: colored dot + connector to the next step */}
            <div className="flex w-4 shrink-0 flex-col items-center pt-1.5">
              <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
              {i < nodes.length - 1 && <span aria-hidden className="mt-1 w-px flex-1 bg-zinc-800" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-zinc-100">{node.label}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${style.chip}`}>
                  {style.label}
                </span>
                {node.vendor && (
                  arenaId ? (
                    <Link
                      href={`/arena/${arenaId}/product/${node.vendor}`}
                      className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
                    >
                      {vendorLabel(node.vendor)}
                    </Link>
                  ) : (
                    <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-500">
                      {vendorLabel(node.vendor)}
                    </span>
                  )
                )}
                <span className="font-mono text-[11px] tabular-nums text-zinc-500">{formatMinutes(node.estimatedMinutes)}</span>
                {node.riskLevel && (
                  <span className={`text-[11px] ${node.riskLevel === 'high' ? 'text-red-300/90' : 'text-zinc-500'}`}>
                    {node.riskLevel} risk
                  </span>
                )}
                {node.approvalRequired && (
                  <span className="text-[11px] text-amber-300" title="Approval gate — agent-runnable, but a human signs off first">
                    ⏸ approval gate
                  </span>
                )}
                {node.async && (
                  <span className="text-[11px] text-zinc-500" title="Async — the process waits on a third party here">
                    ⏳ async
                  </span>
                )}
              </div>
              {(calls.length > 0 || node.toolCall) && (
                <div className="mt-1.5 space-y-0.5">
                  {node.toolCall && calls.length === 0 && (
                    <p className="truncate font-mono text-[11px] text-zinc-500">{node.toolCall}</p>
                  )}
                  {calls.map((fc) => (
                    <p key={fc.method} className="truncate font-mono text-[11px] text-zinc-500" title={fc.description}>
                      {fc.method}
                      {fc.type === 'manual' && <span className="ml-1 text-amber-400/80">(manual)</span>}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
