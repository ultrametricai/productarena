import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CeilingBar from '@/components/CeilingBar'
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

      <ProcessVerdict ceiling={ceiling} />

      <section className="space-y-6">
        {tasks.map((task, i) => {
          const tc = taskCeiling(task)
          return (
            <div key={`${task.id}-${i}`} className="rounded-2xl border border-zinc-800 p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  <span className="mr-2 font-mono text-sm text-zinc-500">{i + 1}.</span>
                  <Link href={`/processes/${processSlug(task.title)}`} className="hover:text-emerald-300">
                    {task.title}
                  </Link>
                </h2>
                <CeilingBar pct={tc.pct} />
              </div>
              <p className="mt-1 text-sm text-zinc-500">{task.description}</p>
              <div className="mt-4">
                <ProcessDag nodes={task.dag.nodes} />
              </div>
            </div>
          )
        })}
      </section>

      <ProcessSimulator steps={simSteps} roles={roles} multiTask />
    </div>
  )
}
