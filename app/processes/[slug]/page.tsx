import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProcessDag from '@/components/ProcessDag'
import ProcessSimulator from '@/components/ProcessSimulator'
import ProcessVerdict from '@/components/ProcessVerdict'
import {
  buildSimSteps, findProcessBySlug, loadProcesses, processSlug, taskCeiling, vendorRoles,
} from '@/lib/processes'

// One founder process: the DAG as it really runs, the market options per vendor role (resolved
// live from arena leaderboards), the agent-ceiling verdict, and a simulated dry run.

export function generateStaticParams() {
  return loadProcesses().map((t) => ({ slug: processSlug(t.title) }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const task = findProcessBySlug(slug)
  if (!task) return { title: 'Process — ProductArena' }
  const ceiling = taskCeiling(task)
  return {
    title: `${task.title} — Processes — ProductArena`,
    description: `${task.description} An agent can run ${ceiling.agentSteps} of ${ceiling.totalSteps} steps today.`,
  }
}

const SUPPORT_LABELS: Record<string, string> = {
  full: 'fully automatable',
  partial: 'partially automatable',
  manual_guide: 'guided manual',
}

export default async function ProcessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const task = findProcessBySlug(slug)
  if (!task) notFound()

  const ceiling = taskCeiling(task)
  const roles = vendorRoles([task])
  const simSteps = buildSimSteps([task])

  return (
    <div className="space-y-10">
      <section>
        <p className="text-[10px] uppercase tracking-widest text-zinc-400">
          <Link href="/processes" className="hover:text-emerald-300">Processes</Link>
          <span className="mx-1 text-zinc-600">/</span>
          {task.phase}
        </p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">{task.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-300">
            {task.complexity.replace('_', ' ')}
          </span>
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-300">
            {SUPPORT_LABELS[task.supportLevel] ?? task.supportLevel}
          </span>
          {task.hasAsyncSteps && (
            <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-zinc-500">⏳ has async waits</span>
          )}
        </div>
        <p className="mt-3 max-w-2xl text-zinc-400">{task.description}</p>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">{task.supportReason}</p>
      </section>

      <ProcessVerdict ceiling={ceiling} />

      <section>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">How it runs</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Route-coded step flow: <span className="text-emerald-300">emerald = agent</span>,{' '}
          <span className="text-amber-300">amber = manual form/portal</span>,{' '}
          <span className="text-red-300/90">red = needs a human</span>. ⏸ approval gate · ⏳ async wait.
        </p>
        <div className="mt-4 rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <ProcessDag nodes={task.dag.nodes} />
        </div>
        {task.contextNeeded.length > 0 && (
          <p className="mt-3 text-xs text-zinc-500">
            Context the agent needs first:{' '}
            {task.contextNeeded.map((c, i) => (
              <span key={i} className="whitespace-nowrap">
                {i > 0 && ' · '}
                <span className="font-mono">{c.query ?? c.tool}</span>
                {c.tier === 'user_input' && <span className="text-amber-400/80"> (from the founder)</span>}
              </span>
            ))}
          </p>
        )}
      </section>

      {roles.length > 0 && (
        <section>
          <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">The market options</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Each role resolves against its arena&rsquo;s live leaderboard — the default is the
            process&rsquo;s canonical vendor, alternatives ranked by agent-readiness.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {roles.map((role) => (
              <div key={role.arenaId} className="rounded-2xl border border-zinc-800 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <Link href={`/arena/${role.arenaId}`} className="text-sm font-medium hover:text-emerald-300">
                    {role.arenaName} →
                  </Link>
                  {role.stepCount > 0 && (
                    <span className="text-[11px] text-zinc-500">{role.stepCount} step{role.stepCount === 1 ? '' : 's'}</span>
                  )}
                </div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {role.alternatives.map((o) => (
                    <li key={o.id} className="flex items-baseline justify-between gap-3">
                      <Link
                        href={`/arena/${role.arenaId}/product/${o.id}`}
                        className={`hover:text-emerald-300 ${o.id === role.defaultProductId ? 'font-medium text-zinc-100' : 'text-zinc-400'}`}
                      >
                        {o.name}
                        {o.id === role.canonicalVendor && (
                          <span className="ml-1.5 rounded-full border border-emerald-400/40 px-1.5 py-px text-[10px] uppercase tracking-wide text-emerald-300">
                            default
                          </span>
                        )}
                      </Link>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-500">
                        {o.agentReady === null ? 'n/a' : (
                          <><span className="text-emerald-400">{o.agentReady.toFixed(0)}</span>/100 agent-ready</>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <ProcessSimulator steps={simSteps} roles={roles} />
    </div>
  )
}
