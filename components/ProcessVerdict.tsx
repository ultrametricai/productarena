import { splitGaps } from '@/lib/gapClosers'
import type { DagNode, ProcessCeiling } from '@/lib/processes'
import { formatMinutes } from '@/lib/processes'

// The agent-ceiling verdict box: the single honest sentence for a process — how much an agent
// can run today, and exactly which steps still need a human or a manual portal. The gaps split
// three ways (lib/gapClosers.ts): closable with today's market (an agentic vendor covers the
// step), irreducibly human (judgment/identity — no workaround is invented), and no workaround
// yet (still manual, market hasn't closed it).
export default function ProcessVerdict({ ceiling, nodes }: { ceiling: ProcessCeiling; nodes: DagNode[] }) {
  const { agentSteps, totalSteps, agentMinutes, totalMinutes, approvalGates, gaps } = ceiling
  const split = splitGaps(nodes)
  const irreducible = split.human.filter((g) => g.irreducible)
  const unclosed = split.human.filter((g) => !g.irreducible)
  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-4 sm:p-5">
      <p className="text-[10px] uppercase tracking-widest text-emerald-400/80">Agent ceiling</p>
      <p className="mt-1 text-lg font-medium text-zinc-100">
        An agent can run {agentSteps} of {totalSteps} steps
        <span className="text-zinc-400"> ({formatMinutes(agentMinutes)} of {formatMinutes(totalMinutes)})</span>
        {approvalGates > 0 && (
          <span className="text-zinc-400">
            {' '}— {approvalGates} of them behind a human approval gate ⏸
          </span>
        )}
      </p>
      {gaps.length === 0 ? (
        <p className="mt-2 text-sm text-emerald-300/90">No gaps — every step of this process is agent-runnable today.</p>
      ) : (
        <div className="mt-2 space-y-1.5 text-sm text-zinc-400">
          {split.closable.length > 0 && (
            <p>
              <span className="text-emerald-300/90">
                ⚡ Closable with today&rsquo;s market ({split.closable.length} — via {split.arenas.join(', ')}):
              </span>{' '}
              {split.closable.map((g, i) => (
                <span key={`${g.label}-${i}`}>
                  {i > 0 && '; '}
                  {g.label} <span className="text-zinc-500">({g.closer.blurb})</span>
                </span>
              ))}
            </p>
          )}
          {irreducible.length > 0 && (
            <p>
              <span className="text-red-300/80">Irreducibly human ({irreducible.length}):</span>{' '}
              {irreducible.map((g, i) => (
                <span key={`${g.label}-${i}`}>
                  {i > 0 && '; '}
                  {g.label} <span className="text-zinc-500">({g.why})</span>
                </span>
              ))}
            </p>
          )}
          {unclosed.length > 0 && (
            <p>
              <span className="text-amber-300/90">No workaround yet ({unclosed.length}):</span>{' '}
              {unclosed.map((g, i) => (
                <span key={`${g.label}-${i}`}>
                  {i > 0 && '; '}
                  {g.label} <span className="text-zinc-500">({g.why})</span>
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
