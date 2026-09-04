import type { ProcessCeiling } from '@/lib/processes'
import { formatMinutes } from '@/lib/processes'

// The agent-ceiling verdict box: the single honest sentence for a process — how much an agent
// can run today, and exactly which steps still need a human or a manual portal.
export default function ProcessVerdict({ ceiling }: { ceiling: ProcessCeiling }) {
  const { agentSteps, totalSteps, agentMinutes, totalMinutes, approvalGates, gaps } = ceiling
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
      {gaps.length > 0 ? (
        <p className="mt-2 text-sm text-zinc-400">
          <span className="text-zinc-300">Gaps:</span>{' '}
          {gaps.map((g, i) => (
            <span key={`${g.label}-${i}`}>
              {i > 0 && '; '}
              {g.label}{' '}
              <span className={g.route === 'person' ? 'text-red-300/80' : 'text-amber-300/90'}>({g.why})</span>
            </span>
          ))}
        </p>
      ) : (
        <p className="mt-2 text-sm text-emerald-300/90">No gaps — every step of this process is agent-runnable today.</p>
      )}
    </div>
  )
}
