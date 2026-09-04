import type { Metadata } from 'next'
import Link from 'next/link'
import CeilingBar from '@/components/CeilingBar'
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

      {/* Site-wide agent ceiling + the biggest gaps across the market */}
      <section className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-5">
          <p className="text-[10px] uppercase tracking-widest text-emerald-400/80">Site-wide agent ceiling</p>
          <p className="mt-2 font-display text-4xl font-bold text-emerald-300">{site.pct}%</p>
          <p className="mt-1 text-sm text-zinc-400">
            {site.agentSteps} of {site.totalSteps} steps across {tasks.length} processes are
            agent-runnable today — {site.approvalGates} of those behind a human approval gate ⏸.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            By time: {formatMinutes(site.agentMinutes)} of {formatMinutes(site.totalMinutes)} of estimated work.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 p-5">
          <p className="text-[10px] uppercase tracking-widest text-zinc-400">Still human / manual across the market</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {themes.map((t) => (
              <li key={t.id} className="flex items-baseline justify-between gap-3">
                <span className="text-zinc-300">{t.label}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-500">{t.count} steps</span>
              </li>
            ))}
          </ul>
        </div>
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

      {/* Full corpus grouped by phase */}
      <section className="space-y-8">
        <div>
          <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">All processes</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {tasks.length} founder processes, grouped by company phase. The bar is each
            process&rsquo;s agent ceiling; vendor chips link to the arena that ranks the market.
          </p>
        </div>
        {phases.map((phase) => (
          <div key={phase}>
            <h3 className="text-[10px] uppercase tracking-widest text-zinc-400">
              {phase} <span className="text-zinc-600">· {byPhase.get(phase)!.length}</span>
            </h3>
            <div className="mt-2 divide-y divide-zinc-800/70 rounded-2xl border border-zinc-800">
              {byPhase.get(phase)!.map((t) => {
                const ceiling = taskCeiling(t)
                const mappedVendors = [...new Set(t.vendors)]
                return (
                  <div key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition hover:bg-zinc-900/50">
                    <Link
                      href={`/processes/${processSlug(t.title)}`}
                      className="min-w-[180px] flex-1 font-medium hover:text-emerald-300"
                    >
                      {t.title}
                    </Link>
                    <CeilingBar pct={ceiling.pct} />
                    <span className="hidden w-24 text-xs text-zinc-500 sm:inline">{complexityLabel(t.complexity)}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {mappedVendors.map((v) =>
                        VENDOR_ARENA[v] ? (
                          <Link
                            key={v}
                            href={`/arena/${VENDOR_ARENA[v]}`}
                            className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
                          >
                            {vendorLabel(v)}
                          </Link>
                        ) : (
                          <span key={v} className="rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-500">
                            {vendorLabel(v)}
                          </span>
                        ),
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
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
