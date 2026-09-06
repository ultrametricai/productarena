import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProcessDag from '@/components/ProcessDag'
import ProcessSimulator from '@/components/ProcessSimulator'
import ProcessVerdict from '@/components/ProcessVerdict'
import {
  buildSimSteps, chainTasks, computeCeiling, loadChains, processSlug, taskCeiling, vendorRoles,
} from '@/lib/processes'

// A chained run: several corpus processes as one story — combined DAG (sectioned per process),
// combined agent ceiling + gaps, and a chain-level simulated dry run with one concatenated
// transcript across every step.

export function generateStaticParams() {
  return loadChains().map((c) => ({ chain: c.id }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chain: string }>
}): Promise<Metadata> {
  const { chain } = await params
  const def = loadChains().find((c) => c.id === chain)
  return {
    title: `${def ? def.name : chain} — Process chains — ProductArena`,
    description: def?.tagline,
  }
}

export default async function ChainPage({ params }: { params: Promise<{ chain: string }> }) {
  const { chain } = await params
  const def = loadChains().find((c) => c.id === chain)
  if (!def) notFound()

  const tasks = chainTasks(def)
  const ceiling = computeCeiling(tasks.flatMap((t) => t.dag.nodes))
  const roles = vendorRoles(tasks)
  const simSteps = buildSimSteps(tasks)

  return (
    <div className="space-y-10">
      <section>
        <p className="text-[10px] uppercase tracking-widest text-zinc-400">
          <Link href="/processes" className="hover:text-emerald-300">Processes</Link>
          <span className="mx-1 text-zinc-600">/</span>
          chained run
        </p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">{def.name}</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">{def.tagline}</p>
        <p className="mt-2 text-sm text-zinc-500">
          {tasks.length} processes · {ceiling.totalSteps} steps end to end
        </p>
      </section>

      <ProcessVerdict ceiling={ceiling} nodes={tasks.flatMap((t) => t.dag.nodes)} />

      <section>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">The full run</h2>
        <p className="mt-1 text-sm text-zinc-400">
          One continuous flow, sectioned per process. Route-coded blocks:{' '}
          <span className="text-emerald-300">emerald = agent</span>,{' '}
          <span className="text-amber-300">amber = manual form/portal</span>,{' '}
          <span className="text-red-300/90">red = needs a human</span>. ⏸ approval gate · ⏳ async wait.
        </p>
        <div className="mt-4 rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <ProcessDag
            sections={tasks.map((task, i) => ({
              key: `${task.id}-${i}`,
              kicker: `process ${i + 1} of ${tasks.length}`,
              title: task.title,
              href: `/processes/${processSlug(task.title)}`,
              meta: task.description,
              pct: taskCeiling(task).pct,
              nodes: task.dag.nodes,
              edges: task.dag.edges,
            }))}
          />
        </div>
      </section>

      <ProcessSimulator steps={simSteps} roles={roles} multiTask />
    </div>
  )
}
