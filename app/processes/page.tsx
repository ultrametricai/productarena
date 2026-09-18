import type { Metadata } from 'next'
import Link from 'next/link'
import CeilingBar from '@/components/CeilingBar'
import IconChip from '@/components/IconChip'
import ProcessesTable, { type ProcessRow } from '@/components/ProcessesTable'
import { hasLogo } from '@/lib/logos'
import { crossArenaStepRankings, processLeaderboard, stepRanking } from '@/lib/processRankings'
import { chainIcon, processIcon } from '@/lib/processIcons'
import {
  chainTasks, computeCeiling, loadChains, loadProcesses,
  phaseRank, processSlug, taskCeiling, VENDOR_ARENA, vendorLabel, vendorProductId,
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

export default function ProcessesPage() {
  const tasks = loadProcesses()
  const chains = loadChains()

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
      icon: processIcon(t.id),
      phase: t.phase,
      pct: c.pct,
      agentSteps: c.agentSteps,
      totalSteps: c.totalSteps,
      complexity: t.complexity,
      // Founder 2026-09-18: no empty vendor cells — processes without hand-curated vendors
      // fall back to the top story-ranked options across their steps (same evidence-gated
      // rankings the process page shows; cross-arena entries included). Cap 4 for the cell.
      vendors: (t.vendors.length > 0
        ? [...new Set(t.vendors)].map((v) => {
            const id = vendorProductId(v)
            return { id, label: vendorLabel(v), arena: VENDOR_ARENA[v] ?? null, hasLogo: hasLogo(id) }
          })
        : derivedVendorsFor(t)),
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

      {/* Curated playbooks — several processes run back to back as one walkthrough */}
      <section>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">End-to-end playbooks</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Common startup journeys — several processes run back to back as one walkthrough, each
          with a combined agent ceiling and its own start-to-finish simulator.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <h3 className="flex min-w-0 items-center gap-1.5 font-medium group-hover:text-emerald-300">
                    <IconChip icon={chainIcon(chain.id)} title={`${chain.name} — end-to-end playbook`} />
                    <span className="min-w-0 truncate">{chain.name}</span>
                  </h3>
                  <CeilingBar pct={ceiling.pct} className="shrink-0" />
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
                      <IconChip icon={processIcon(t.id)} title={`${t.title} — ${t.phase} process`} />
                      <span className="min-w-0 truncate">{t.title}</span>
                      {t.region === 'us' && <span aria-label="US-specific process" title="US-specific: this flow is written around US law and agencies (IRS, Delaware, state filings)" className="shrink-0 text-xs">🇺🇸</span>}
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
// Founder 2026-09-18: the index table's vendor cell must never be empty. Processes without
// hand-curated vendors derive their cell from the story-ranked options across their steps —
// process leaderboard first (coverage × step quality), then cross-arena step winners — the
// same evidence-gated rankings the process page itself shows. Cap 4.
function derivedVendorsFor(t: import('@/lib/processes').ProcessTask) {
  const seen = new Set<string>()
  const out: { id: string; label: string; arena: string | null; hasLogo: boolean }[] = []
  const push = (id: string, label: string, arena: string | null) => {
    if (seen.has(id) || out.length >= 4) return
    seen.add(id)
    out.push({ id, label, arena, hasLogo: hasLogo(id) })
  }
  for (const e of processLeaderboard(t).entries) push(e.productId, e.name, e.arenaId)
  if (out.length < 4) {
    for (const node of t.dag.nodes) {
      const rankings = [stepRanking(t.id, node), ...crossArenaStepRankings(t.id, node)]
      for (const r of rankings) {
        if (!r) continue
        for (const v of r.vendors.slice(0, 2)) push(v.productId, v.name, v.arenaId)
      }
    }
  }
  return out
}


