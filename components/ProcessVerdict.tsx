import ComputerUseChips from '@/components/ComputerUseChips'
import { resolveGapStep } from '@/lib/gapClosers'
import type { DagNode, ProcessCeiling, ProcessTask } from '@/lib/processes'

// The agent-ceiling verdict box: the single honest sentence for a process — how much an agent
// can run today, and exactly which steps still need a human or a manual portal. The gaps split
// three ways (lib/gapClosers.ts resolution, same buckets as splitGaps but with node identity):
// closable with today's market (an agentic vendor covers the step), irreducibly human
// (judgment/identity — no workaround is invented), and no workaround yet (still manual, the
// market hasn't closed it).
//
// EVERY manual step — all three buckets, form portals and human steps alike (founder
// 2026-09-18: "any time 'manual' is seen, see if we can do a computer use process for it") —
// additionally surfaces the judged computer-use fleet (components/ComputerUseChips.tsx →
// lib/processRankings.ts computerUseOptions) as "🖥 could attempt it today". The step KEEPS its
// manual routing — the row is honest capability evidence, never a claim the step is solved,
// and it renders nothing where no vendor has judged full/partial evidence.

interface GapRef {
  taskId: string
  node: DagNode
}

export default function ProcessVerdict({ ceiling, tasks }: { ceiling: ProcessCeiling; tasks: ProcessTask[] }) {
  const { agentSteps, totalSteps, approvalGates, gaps } = ceiling

  // Non-agent steps with node identity, bucketed by their gap resolution (mirrors splitGaps,
  // which only carries labels — each row here needs taskId:nodeId to look up its committed
  // computer-use story mapping).
  const closable: Array<GapRef & { blurb: string }> = []
  const irreducible: Array<GapRef & { reason: string }> = []
  const unclosed: Array<GapRef & { why: string }> = []
  const arenas: string[] = []
  for (const task of tasks) {
    for (const node of task.dag.nodes) {
      if (node.route === 'agent') continue
      const res = resolveGapStep(node)
      if (res?.kind === 'closer') {
        closable.push({ taskId: task.id, node, blurb: res.closer.blurb })
        if (!arenas.includes(res.closer.arenaName)) arenas.push(res.closer.arenaName)
      } else if (res?.kind === 'irreducible') {
        irreducible.push({ taskId: task.id, node, reason: res.reason })
      } else {
        unclosed.push({
          taskId: task.id,
          node,
          why: node.route === 'person' ? 'needs a human' : 'manual form/portal — no API path',
        })
      }
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-4 sm:p-5">
      <p className="text-[10px] uppercase tracking-widest text-emerald-400/80">Current agent ceiling</p>
      <p className="mt-1 text-lg font-medium text-zinc-100">
        An agent can run {agentSteps} of {totalSteps} steps
        {approvalGates > 0 && (
          <span className="text-zinc-400">
            {' '}— {approvalGates} of them behind a human approval gate ⏸
          </span>
        )}
      </p>
      {gaps.length === 0 ? (
        <p className="mt-2 text-sm text-emerald-300/90">No gaps — every step of this process is agent-runnable today.</p>
      ) : (
        <details className="mt-2">
          <summary className="cursor-pointer select-none text-sm text-zinc-400 transition hover:text-emerald-300">
            {closable.length > 0 && <span className="mr-3">⚡ {closable.length} closable with today&rsquo;s market</span>}
            {irreducible.length > 0 && <span className="mr-3 text-red-300/80">{irreducible.length} human or computer use</span>}
            {unclosed.length > 0 && <span className="text-amber-300/90">{unclosed.length} no workaround yet</span>}
            <span className="ml-1 text-zinc-600">— details</span>
          </summary>
        <div className="mt-2 space-y-2.5 text-sm text-zinc-400">
          {closable.length > 0 && (
            <div>
              <p>
                <span className="text-emerald-300/90">
                  ⚡ Closable with today&rsquo;s market ({closable.length} — via {arenas.join(', ')}):
                </span>
              </p>
              <ul className="mt-1 space-y-1">
                {closable.map((g) => (
                  <li key={`${g.taskId}-${g.node.id}`}>
                    {g.node.label} <span className="text-zinc-500">({g.blurb})</span>
                    <ComputerUseChips taskId={g.taskId} nodeId={g.node.id} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {irreducible.length > 0 && (
            <div>
              <p>
                {/* Founder 2026-09-18: was "Temporarily human" — the section now lists ranked
                    computer-use attempts, so the old name undersold it. */}
                <span className="text-red-300/80">Human or computer use ({irreducible.length}):</span>{' '}
                <span className="text-zinc-500">
                  judgment or identity work — where judged computer-use agents could attempt the
                  mechanical part, they&rsquo;re listed with their verdict-backed scores.
                </span>
              </p>
              <ul className="mt-1 space-y-1">
                {irreducible.map((g) => (
                  <li key={`${g.taskId}-${g.node.id}`}>
                    {g.node.label} <span className="text-zinc-500">({g.reason})</span>
                    <ComputerUseChips taskId={g.taskId} nodeId={g.node.id} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {unclosed.length > 0 && (
            <div>
              <p>
                <span className="text-amber-300/90">No workaround yet ({unclosed.length}):</span>
              </p>
              <ul className="mt-1 space-y-1">
                {unclosed.map((g) => (
                  <li key={`${g.taskId}-${g.node.id}`}>
                    {g.node.label} <span className="text-zinc-500">({g.why})</span>
                    <ComputerUseChips taskId={g.taskId} nodeId={g.node.id} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        </details>
      )}
    </div>
  )
}
