import Link from 'next/link'
import ProductLogoView from '@/components/ProductLogoView'
import { splitGaps } from '@/lib/gapClosers'
import { hasLogo } from '@/lib/logos'
import type { ProcessCeiling, ProcessTask } from '@/lib/processes'
import { computerUseOptions, temporarilyHumanSteps, type ComputerUseOption } from '@/lib/processRankings'

// The agent-ceiling verdict box: the single honest sentence for a process — how much an agent
// can run today, and exactly which steps still need a human or a manual portal. The gaps split
// three ways (lib/gapClosers.ts): closable with today's market (an agentic vendor covers the
// step), irreducibly human (judgment/identity — no workaround is invented), and no workaround
// yet (still manual, market hasn't closed it).
//
// Temporarily-human steps additionally surface the judged computer-use fleet
// (lib/processRankings.ts computerUseOptions — browser agents plus assistants with judged
// computer-use verdicts, scored on the step's committed story mapping) as "agents that could
// attempt it today". The step STAYS temporarily human — the row is honest capability evidence,
// never a claim the step is solved.

// Compact verdict trace for a chip tooltip: "82/100 from 4 judged stories — full: …; partial: …".
function citeSummary(o: ComputerUseOption): string {
  const byVerdict = (kind: string) => o.cites.filter((c) => c.verdict === kind).map((c) => c.storyTitle)
  const parts: string[] = []
  const full = byVerdict('full')
  const partial = byVerdict('partial')
  if (full.length > 0) parts.push(`full: ${full.join('; ')}`)
  if (partial.length > 0) parts.push(`partial: ${partial.join('; ')}`)
  const rest = o.cites.length - full.length - partial.length
  if (rest > 0) parts.push(`${rest} not delivered`)
  return `${o.name} (${o.arenaName}) — ${o.score.toFixed(0)}/100 on this step's mapped computer-use stories · ${parts.join(' · ')}`
}

function ComputerUseChips({ taskId, nodeId }: { taskId: string; nodeId: string }) {
  const options = computerUseOptions(taskId, nodeId)
  if (options.length === 0) return null
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1.5">
      <span
        className="text-[10px] uppercase tracking-wide text-zinc-500"
        title="Judged computer-use agents (browser agents + assistants with judged computer-use verdicts) ranked by their verdicts on this step's mapped stories. The step still needs a human — this is who could attempt the mechanical part."
      >
        🖥 could attempt it today:
      </span>
      {options.map((o) => (
        <Link
          key={`${o.arenaId}-${o.productId}`}
          href={`/arena/${o.arenaId}/product/${o.productId}`}
          title={citeSummary(o)}
          className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900/60 py-0.5 pl-0.5 pr-2 text-[11px] text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
        >
          <ProductLogoView product={{ id: o.productId, name: o.name }} size={14} hasLogo={hasLogo(o.productId)} />
          <span className="truncate">{o.name}</span>
          <span className="font-mono text-[10px] tabular-nums text-emerald-400/80">{o.score.toFixed(0)}</span>
        </Link>
      ))}
      <span className="text-[10px] text-zinc-600">assisted, still human-owned</span>
    </span>
  )
}

export default function ProcessVerdict({ ceiling, tasks }: { ceiling: ProcessCeiling; tasks: ProcessTask[] }) {
  const { agentSteps, totalSteps, approvalGates, gaps } = ceiling
  const nodes = tasks.flatMap((t) => t.dag.nodes)
  const split = splitGaps(nodes)
  const unclosed = split.human.filter((g) => !g.irreducible)
  // The irreducible set with node identity (splitGaps carries only labels) so each step can
  // look up its committed computer-use story mapping.
  const irreducible = temporarilyHumanSteps(tasks)
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
            <div>
              <p>
                <span className="text-red-300/80">Temporarily human ({irreducible.length}):</span>{' '}
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
