import type { Metadata } from 'next'
import Link from 'next/link'
import CeilingBar from '@/components/CeilingBar'
import ProcessesTable, { type ProcessRow } from '@/components/ProcessesTable'
import {
  chainTasks, computeCeiling, formatMinutes, gapThemes, loadChains, loadProcesses,
  phaseRank, processSlug, siteCeiling, taskCeiling, VENDOR_ARENA, vendorLabel,
} from '@/lib/processes'

export const metadata: Metadata = {
  title: 'Processes — ProductArena',
  description:
    'Startup operations in the open — every founder process, the software that runs it, and the best an agent can do today. Agent ceilings, human/manual gaps, and simulated dry runs over real market options.',
}

const ROUTE_DOT: Record<string, string> = {
  agent: 'bg-emerald-400',
  form: 'bg-amber-400',
  person: 'bg-red-400/70',
}

function complexityLabel(c: string): string {
  return c.replace('_', ' ')
}

export default function ProcessesPage() {
  const tasks = loadProcesses()
  const chains = loadChains()
  const site = siteCeiling(tasks)
  const themes = gapThemes(tasks).slice(0, 5)

  const byPhase = new Map<string, typeof tasks>()
  for (const t of tasks) {
    const list = byPhase.get(t.phase) ?? []
    list.push(t)
    byPhase.set(t.phase, list)
  }
  const phases = [...byPhase.keys()].sort((a, b) => phaseRank(a) - phaseRank(b) || a.localeCompare(b))

  const tableRows: ProcessRow[] = tasks.map((t) => {
    const c = taskCeiling(t)
    return {
      slug: processSlug(t.title),
      title: t.title,
      phase: t.phase,
      pct: c.pct,
      agentSteps: c.agentSteps,
      totalSteps: c.totalSteps,
      minutes: c.totalMinutes,
      complexity: t.complexity,
      vendors: [...new Set(t.vendors)].map((v) => ({ label: vendorLabel(v), arena: VENDOR_ARENA[v] ?? null })),
    }
  })

  return (
    <div className="space-y-12">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">Processes</h1>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
          Startup operations in the open — every process, the software that runs it, and the best
          an agent can do today. Each step is routed honestly: agent-runnable via a recorded API
          call, a manual form with no API path, or genuinely human. The gaps are the finding.
        </p>
      </section>

      {/* Curated chains — typical multi-process runs */}
      <section>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">Chained runs</h2>
        <p className="mt-1 text-sm text-zinc-400">
          How the processes actually chain together in a company&rsquo;s life — each with a combined
          ceiling and a chain-level simulator.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chains.map((chain) => {
            const cTasks = chainTasks(chain)
            const ceiling = computeCeiling(cTasks.flatMap((t) => t.dag.nodes))
            return (
              <Link
                key={chain.id}
                href={`/processes/chains/${chain.id}`}
                className="group rounded-2xl border border-zinc-800 p-4 transition hover:border-emerald-400/40"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-medium group-hover:text-emerald-300">{chain.name}</h3>
                  <CeilingBar pct={ceiling.pct} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">{chain.tagline}</p>
                <ol className="mt-3 space-y-1.5">
                  {cTasks.map((t, i) => (
                    <li key={`${t.id}-${i}`} className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="flex shrink-0 gap-0.5">
                        {t.dag.nodes.map((n, j) => (
                          <span key={j} aria-hidden className={`h-1.5 w-1.5 rounded-full ${ROUTE_DOT[n.route]}`} />
                        ))}
                      </span>
                      <span className="truncate">{t.title}</span>
                    </li>
                  ))}
                </ol>
              </Link>
            )
          })}
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
