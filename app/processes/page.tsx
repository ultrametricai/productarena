import type { Metadata } from 'next'
import Link from 'next/link'
import CeilingBar from '@/components/CeilingBar'
import IconChip from '@/components/IconChip'
import ProcessesTable from '@/components/ProcessesTable'
import { chainIcon, processIcon } from '@/lib/processIcons'
import { buildProcessRows } from '@/lib/processRows'
import { chainTasks, computeCeiling, loadChains } from '@/lib/processes'

export const metadata: Metadata = {
  title: 'Processes — ProductArena',
  description:
    'Startup operations in the open — every founder process, the software that runs it, and the best an agent can do today. Agent ceilings, human/manual gaps, and simulated dry runs over real market options.',
}

// Person steps read calm (sky), not negative red — founder 2026-09-21: a human step is
// "human or computer use", not an error state.
const ROUTE_DOT: Record<string, string> = {
  agent: 'bg-emerald-400',
  form: 'bg-amber-400',
  person: 'bg-sky-400/80',
}

export default function ProcessesPage() {
  const chains = loadChains()
  // Rows + phases now come from the shared builder (lib/processRows.ts) so the homepage's
  // process mode renders exactly this table.
  const { rows: tableRows, phases } = buildProcessRows()

  return (
    <div className="space-y-12">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">Processes</h1>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
          Startup operations in the open — every process, the software that runs it, and the best
          an agent can do today. Each step is routed: agent-runnable via a recorded API
          call, a manual form with no API path, or human-or-computer-use work — with the legally
          required signatures flagged as the true human floor. The gaps are the finding.
        </p>
      </section>

      {/* Curated playbooks — several processes run back to back as one walkthrough */}
      <section>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">End-to-end playbooks</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Common startup journeys — several processes run back to back as one walkthrough, each
          with a combined agent ceiling and its own start-to-finish simulator.
        </p>
        {/* Founder 2026-09-23: "this dots coloring is just not known by the user" — a visible
            legend for the per-step route dots, matching ROUTE_DOT + the legalSignature violet. */}
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5" title="An agent can run this step today via a recorded API/MCP/CLI path">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> agent-runnable
          </span>
          <span className="flex items-center gap-1.5" title="A form or portal a human fills in — no agent path recorded yet">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-400" /> manual form
          </span>
          <span className="flex items-center gap-1.5" title="A human decision or approval — deliberately not automated">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sky-400/80" /> human decision
          </span>
          <span className="flex items-center gap-1.5" title="Requires a legally binding signature — always stays with a person">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-violet-400/80" /> legal signature
          </span>
        </p>
        {/* Founder 2026-09-23: a table like the all-processes one below, not a card grid. */}
        <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
                <th scope="col" className="px-3 py-2 font-normal">Playbook</th>
                <th scope="col" className="hidden px-3 py-2 font-normal md:table-cell">Processes</th>
                <th scope="col" className="px-3 py-2 font-normal"><span title="Combined steps across every process in the playbook">Steps</span></th>
                <th scope="col" className="px-3 py-2 font-normal"><span title="Share of the playbook's steps an agent can run today">Agent ceiling</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {chains.map((chain) => {
                const cTasks = chainTasks(chain)
                const nodes = cTasks.flatMap((t) => t.dag.nodes)
                const ceiling = computeCeiling(nodes)
                // Whole-row click (founder 2026-09-23): the title Link stretches over the row
                // via the after:inset-0 overlay — tr is the containing block.
                return (
                  <tr key={chain.id} className="relative transition hover:bg-zinc-900/50">
                    <td className="max-w-[320px] px-3 py-2.5 align-top">
                      <Link
                        href={`/processes/chains/${chain.id}`}
                        className="flex items-center gap-1.5 font-medium hover:text-emerald-300 after:absolute after:inset-0 after:content-['']"
                      >
                        <IconChip icon={chainIcon(chain.id)} title={`${chain.name} — end-to-end playbook`} />
                        <span className="min-w-0 truncate">{chain.name}</span>
                      </Link>
                      <p className="mt-0.5 text-xs text-zinc-500">{chain.tagline}</p>
                    </td>
                    <td className="hidden px-3 py-2.5 align-top md:table-cell">
                      <span className="relative z-10 flex flex-wrap items-center gap-1 text-xs text-zinc-400">
                        {cTasks.map((t, i) => (
                          <IconChip key={`${t.id}-${i}`} icon={processIcon(t.id)} title={`${t.title} — ${t.phase} process`} />
                        ))}
                        <span className="text-zinc-500">{cTasks.length}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <span className="flex items-center gap-1.5 whitespace-nowrap font-mono text-xs tabular-nums text-zinc-400">
                        {nodes.length}
                        {/* relative z-10: keep the dots' hover titles above the row's
                            stretched-link overlay. */}
                        <span className="relative z-10 flex shrink-0 gap-0.5">
                          {nodes.slice(0, 24).map((n, j) => (
                            <span
                              key={j}
                              title={`${n.label} — ${n.legalSignature ? 'legal signature (stays with a person)' : n.route === 'agent' ? 'agent-runnable' : n.route === 'form' ? 'manual form' : 'human decision'}`}
                              className={`h-1.5 w-1.5 rounded-full ${n.legalSignature ? 'bg-violet-400/80' : ROUTE_DOT[n.route]}`}
                            />
                          ))}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <CeilingBar pct={ceiling.pct} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-3">
        <div>
          <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">All processes</h2>
          <p className="mt-1 text-sm text-zinc-400">
            One controller over the full corpus — sort by how automatable a process is, filter by
            phase or software, click through for the step-by-step and the simulator.
          </p>
        </div>
        <ProcessesTable rows={tableRows} phases={phases} />
      </section>

      <section className="mx-auto max-w-3xl text-center text-sm text-zinc-500">
        <p>
          Every mapped vendor traces to a live arena leaderboard — swap it for a rival on the
          process page and the simulator stays honest about whose API was actually recorded.{' '}
          <Link href="/" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            See all rankings →
          </Link>
        </p>
      </section>
    </div>
  )
}


