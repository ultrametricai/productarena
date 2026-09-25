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

// Virtual Startup (founder ask 2026-09-23): a synthetic company run through the REAL process
// corpus. This page is fully static: it precomputes, at build time, the payload for every task
// any decision combo can reach (steps via the same buildSimSteps the process pages use, top
// judged vendor per step via lib/processRankings.ts stepRanking) plus the union vendor roles;
// components/VirtualStartup.tsx assembles the chosen journey client-side, deterministically.
// All synthetic artifacts are generated client-side from a decision-combo seed and always carry
// the SIMULATED label — see lib/virtualStartup.ts for the honesty contract.

export const metadata: Metadata = {
  title: 'Virtual Startup Simulator — ProductArena',
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

  return (
    <div className="space-y-10">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-[10px] uppercase tracking-widest text-zinc-400">
          <Link href="/processes" className="hover:text-emerald-300">Processes</Link>
          <span className="mx-1 text-zinc-600">/</span>
          virtual startup
        </p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">Virtual Startup Simulator</h1>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
          A simulated company starts its journey. Pick the starting decisions and watch what
          actually has to happen, in time order — every step is a real corpus process routed
          agent / manual form / human (legal signatures flagged), vendors come from the judged
          rankings, and time estimates are the corpus&apos;s own. When the launch lands, the
          year-one operating rhythm shows the recurring runs the company owns from then on.
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-xs text-zinc-500">
          The company itself is synthetic: every generated artifact — the name, the EIN, the first
          invoice — is deterministic demo data and carries a visible{' '}
          <span className="rounded border border-fuchsia-400/50 px-1 py-px text-[9px] uppercase tracking-widest text-fuchsia-300">simulated</span>{' '}
          tag. Nothing simulated is a judged fact.
        </p>
      </section>

      <VirtualStartup
        chains={chains}
        tasks={tasks}
        roles={vendorRoles(unionTasks)}
        yearCandidates={yearCandidates}
        eventExamples={eventExamples}
      />

      <section className="mx-auto max-w-3xl text-center text-sm text-zinc-500">
        <p>
          Every process here has its own page with the full step-by-step, evidence and simulator —{' '}
          <Link href="/processes" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            browse all processes →
          </Link>
        </p>
      </section>
    </div>
  )
}
