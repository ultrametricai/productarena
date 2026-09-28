import type { Metadata } from 'next'
import Link from 'next/link'
import VirtualStartup from '@/components/VirtualStartup'
import {
  buildSimSteps, CADENCE_META, loadChains, loadProcesses, processSlug, taskCeiling, vendorRoles,
  type ProcessTask,
} from '@/lib/processes'
import { stepRanking } from '@/lib/processRankings'
import {
  buildEventExamples, buildYearCandidates, unionTaskIds, VS_CHAIN_IDS,
  type RouteMix, type VirtualTaskPayload, type VsChain, type YearTaskSource,
} from '@/lib/virtualStartup'
// v3 run layer (vendor picks → outcomes, personas, seeded events, scorecard): serialized
// canonical access verdicts, published-pricing headlines, and the corpus risk axis — see
// lib/virtualStartupRun.ts for the client-side model and its honesty rules.
import { buildVsAccess, buildVsPricing, buildVsTaskRisks } from '@/lib/virtualStartupData'

// Virtual Startup (founder ask 2026-09-23): a synthetic company run through the REAL process
// corpus. This page is fully static: it precomputes, at build time, the payload for every task
// any decision combo can reach (steps via the same buildSimSteps the process pages use, top
// judged vendor per step via lib/processRankings.ts stepRanking) plus the union vendor roles;
// components/VirtualStartup.tsx assembles the chosen journey client-side, deterministically.
// All synthetic artifacts are generated client-side from a decision-combo seed and always carry
// the SIMULATED label — see lib/virtualStartup.ts for the honesty contract.

export const metadata: Metadata = {
  title: 'Virtual Startup — Ultrametric',
  description:
    'Pick the starting decisions — or a one-tap example company (software, hardware, biotech) or YC batch mode — and watch a simulated startup run the real founder-process corpus: every step routed agent / manual / human, the top judged vendor per step, clearly-labeled synthetic artifacts, and the first-30-days / first-90-days / year-one operating rhythm the company then runs.',
}

// DAG route mix of one corpus process — the year view's per-row honesty payload.
function routeMix(task: ProcessTask): RouteMix {
  const mix: RouteMix = { agent: 0, form: 0, person: 0, legalSignature: 0 }
  for (const n of task.dag.nodes) {
    mix[n.route] += 1
    if (n.legalSignature) mix.legalSignature += 1
  }
  return mix
}

export default function VirtualStartupPage() {
  const chains: VsChain[] = VS_CHAIN_IDS.map((id) => {
    const chain = loadChains().find((c) => c.id === id)
    // Fail the build loudly if the journey references a chain the corpus no longer has.
    if (!chain) throw new Error(`virtual-startup: chain "${id}" missing from data/process-chains.json`)
    return { id: chain.id, name: chain.name, taskIds: chain.taskIds }
  })

  const byId = new Map(loadProcesses().map((t) => [t.id, t]))
  const tasks: Record<string, VirtualTaskPayload> = {}
  const unionTasks = unionTaskIds(chains).map((id) => {
    const task = byId.get(id)
    if (!task) throw new Error(`virtual-startup: task "${id}" missing from data/processes.json`)
    return task
  })
  for (const task of unionTasks) {
    tasks[task.id] = {
      id: task.id,
      title: task.title,
      slug: processSlug(task.title),
      phase: task.phase,
      description: task.description,
      steps: buildSimSteps([task]),
      // The step's top JUDGED vendor (story-derived ranking over real verdicts) — null where no
      // committed mapping/judged ranking exists, and the UI shows nothing rather than a guess.
      tops: task.dag.nodes.map((node) => {
        const ranking = stepRanking(task.id, node)
        const top = ranking?.vendors[0]
        return top
          ? { productId: top.productId, name: top.name, score: top.score, arenaId: ranking.arenaId, arenaName: ranking.arenaName }
          : null
      }),
    }
  }

  // Year-one operating rhythm candidates: the whole corpus reshaped (cadence labels from the
  // same CADENCE_META /processes/operating-rhythm uses), selected/gated by lib/virtualStartup's
  // buildYearCandidates — the month-end-close + tax-season chains always, journey-gated
  // recurring processes otherwise.
  const yearSources: YearTaskSource[] = loadProcesses().map((t) => ({
    taskId: t.id,
    title: t.title,
    slug: processSlug(t.title),
    cadence: t.cadence,
    cadenceLabel: CADENCE_META[t.cadence].label,
    totalSteps: t.dag.nodes.length,
    routes: routeMix(t),
    ceilingPct: taskCeiling(t).pct,
  }))
  const allChains: VsChain[] = loadChains().map(({ id, name, taskIds }) => ({ id, name, taskIds }))
  const yearCandidates = buildYearCandidates(allChains, yearSources)
  // Event-driven examples for the rhythm views — real corpus processes that run when triggered
  // (no months, no runs/yr), gated per decision combo client-side.
  const eventExamples = buildEventExamples(yearSources)

  const roles = vendorRoles(unionTasks)

  return (
    <div className="space-y-10">
      <section className="mx-auto max-w-3xl text-center">
        {/* No breadcrumb eyebrow (founder 2026-09-28) — the title stands alone; /processes is
            linked from the outro below. */}
        <h1 className="font-display leading-[1.1] text-3xl font-bold tracking-tight">Virtual Startup</h1>
        {/* One-line hero (founder 2026-09-28: terminal above the fold; same day: no loud
            "simulated" chips up top) — generated artifacts keep their tags inside the terminal,
            and the fuller explanation lives in the setup band's "full setup guide" expand. */}
        <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-400">
          A virtual company runs the real founder-process corpus — every step routed agent /
          manual / human, vendors from the judged rankings, time estimates the corpus&apos;s own.
        </p>
      </section>

      <VirtualStartup
        chains={chains}
        tasks={tasks}
        roles={roles}
        yearCandidates={yearCandidates}
        eventExamples={eventExamples}
        access={buildVsAccess(roles)}
        pricing={buildVsPricing(roles)}
        taskRisks={buildVsTaskRisks()}
      />

      <section className="mx-auto max-w-3xl text-center text-sm text-zinc-500">
        <p>
          Every process here has its own page with the full step-by-step, evidence and simulator —{' '}
          <Link href="/processes" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            browse all processes →
          </Link>
        </p>
        <p className="mt-2">
          The equity artifacts (founder split, SAFE round, cap table) are simulated — run the real math on your own
          numbers:{' '}
          <Link href="/tools/cap-table" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            model this on the cap-table tool →
          </Link>
        </p>
      </section>
    </div>
  )
}
