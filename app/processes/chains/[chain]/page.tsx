import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import DoViaAfk from '@/components/DoViaAfk'
import IconChip from '@/components/IconChip'
import ProcessDag from '@/components/ProcessDag'
import ProcessLensBanner from '@/components/ProcessLensBanner'
import ProcessSimulator from '@/components/ProcessSimulator'
import ProcessVerdict from '@/components/ProcessVerdict'
import { buildProcessCheckSteps } from '@/lib/processCheckData'
import { chainIcon, processIcon } from '@/lib/processIcons'
import { chainManifestPath, chainManifestUrl } from '@/lib/processManifest'
import {
  buildSimSteps, chainTasks, computeCeiling, loadChains, processSlug, taskCeiling, vendorRoles,
} from '@/lib/processes'

// An end-to-end playbook (a "chain" in the data): several corpus processes as one story —
// combined DAG (sectioned per process), combined agent ceiling + gaps, and a playbook-level
// simulated dry run with one concatenated transcript across every step.

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
    title: `${def ? def.name : chain} — End-to-end playbooks — ProductArena`,
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
  // Pre-serialized step rows per section task (lib/processCheckData.ts) — the same lens/stack
  // personalization contract as /processes/[slug]: static HTML unchanged, and a vendor clicked
  // in one section (lens pageKey = the chain id) applies to any later step whose arena matches.
  const checkStepsByTask = tasks.map((task) => buildProcessCheckSteps(task))

  return (
    <div className="space-y-10">
      <section>
        <p className="text-[10px] uppercase tracking-widest text-zinc-400">
          <Link href="/processes" className="hover:text-emerald-300">Processes</Link>
          <span className="mx-1 text-zinc-600">/</span>
          end-to-end playbook
        </p>
        <h1 className="font-display leading-[1.1] mt-1 flex items-center gap-2.5 text-3xl font-bold tracking-tight">
          <IconChip icon={chainIcon(def.id)} title={`${def.name} — end-to-end playbook`} />
          {def.name}
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">{def.tagline}</p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          {tasks.length} processes · {ceiling.totalSteps} steps end to end
          {/* Admin-only (session allowlist or the pa-admin localStorage switch) — renders nothing
              for everyone else. The manifest it hands off is public regardless. */}
          <DoViaAfk manifestUrl={chainManifestUrl(def.id)} />
        </p>
      </section>

      <ProcessVerdict ceiling={ceiling} tasks={tasks} />

      <section>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">The full run</h2>
        <p className="mt-1 text-sm text-zinc-400">
          One continuous flow, sectioned per process. Route-coded blocks:{' '}
          <span className="text-emerald-300">emerald = agent</span>,{' '}
          <span className="text-amber-300">amber = manual form/portal</span>,{' '}
          <span className="text-sky-300">sky = human or computer use</span>,{' '}
          <span className="text-violet-300">violet ✍ = signature, legally human</span>. ⏸ approval gate · ⏳ async wait.
        </p>
        {/* Client-side lens banner over the WHOLE chain — one clicked vendor flows across every
            section. Renders nothing in the static HTML. */}
        <ProcessLensBanner steps={checkStepsByTask.flat()} pageKey={def.id} />
        <div className="mt-4 rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <ProcessDag
            lensKey={def.id}
            sections={tasks.map((task, i) => ({
              key: `${task.id}-${i}`,
              kicker: `process ${i + 1} of ${tasks.length}`,
              title: task.title,
              icon: processIcon(task.id),
              iconTitle: `${task.title} — ${task.phase} process`,
              href: `/processes/${processSlug(task.title)}`,
              meta: task.description,
              pct: taskCeiling(task).pct,
              taskId: task.id,
              checkSteps: Object.fromEntries(checkStepsByTask[i].map((s) => [s.nodeId, s])),
              mineHref: `/processes/${processSlug(task.title)}/mine`,
              nodes: task.dag.nodes,
              edges: task.dag.edges,
            }))}
          />
        </div>
      </section>

      <ProcessSimulator steps={simSteps} roles={roles} multiTask />

      {/* Public, ungated — the manifest is just the published corpus reshaped for executors. */}
      <section className="border-t border-zinc-800 pt-4 text-xs text-zinc-500">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600">For agents</span>{' '}
        <Link
          href={chainManifestPath(def.id)}
          className="text-zinc-400 hover:text-emerald-300"
          title="Versioned machine-readable run plan for this whole playbook: every process's steps typed api / computer-use / human, vendor options with agent-readiness and MCP endpoints, approval gates"
        >
          Process manifest (JSON)
        </Link>
        <span className="mx-1.5 text-zinc-700">·</span>
        <Link href="/llms.txt" className="text-zinc-400 hover:text-emerald-300">/llms.txt</Link>
      </section>
    </div>
  )
}
