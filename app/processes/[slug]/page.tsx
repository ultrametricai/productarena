import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import DoViaAfk from '@/components/DoViaAfk'
import IconChip from '@/components/IconChip'
import ProcessDag from '@/components/ProcessDag'
import ProcessLeaderboard from '@/components/ProcessLeaderboard'
import ProcessSimulator from '@/components/ProcessSimulator'
import ProcessVerdict from '@/components/ProcessVerdict'
import ProductLogoView from '@/components/ProductLogoView'
import { hasLogo } from '@/lib/logos'
import { phaseIcon, phaseTooltip, processIcon } from '@/lib/processIcons'
import { processManifestPath, processManifestUrl } from '@/lib/processManifest'
import {
  buildSimSteps, CADENCE_META, findProcessBySlug, loadProcesses, processSlug, slugAliasFor, taskCeiling, vendorRoles,
} from '@/lib/processes'
import { SITE_URL } from '@/lib/site'

// One founder process: the DAG as it really runs, the market options per vendor role (resolved
// live from arena leaderboards), the agent-ceiling verdict, and a simulated dry run.
//
// Renamed processes (founder rule: vendor-neutral names — "Send an invoice", not "Send Stripe
// invoice") also prerender their old vendor-flavored slugs (slugAliases): static export has no
// server redirects, so the alias page is the same full page plus a canonical link and a pointer
// line — old shared/indexed links keep working and keep being useful.

export function generateStaticParams() {
  return loadProcesses().flatMap((t) => [
    { slug: processSlug(t.title) },
    ...(t.slugAliases ?? []).map((a) => ({ slug: a.slug })),
  ])
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
    // Alias slugs point search engines at the one canonical page.
    alternates: { canonical: `${SITE_URL}/processes/${processSlug(task.title)}` },
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
  const alias = slugAliasFor(task, slug)
  const canonicalSlug = processSlug(task.title)

  return (
    <div className="space-y-10">
      <section>
        {alias && (
          <p className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-400">
            &ldquo;{alias.label}&rdquo; is an earlier name for this work — it now lives in this
            process, with the specifics (vendors, jurisdictions) as market options and steps.{' '}
            <Link
              href={`/processes/${canonicalSlug}`}
              className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 transition hover:text-emerald-200"
            >
              {task.title} →
            </Link>
          </p>
        )}
        <p className="text-[10px] uppercase tracking-widest text-zinc-400">
          <Link href="/processes" className="hover:text-emerald-300">Processes</Link>
          <span className="mx-1 text-zinc-600">/</span>
          <IconChip icon={phaseIcon(task.phase)} title={phaseTooltip(task.phase)} className="mr-1" />
          {task.phase}
        </p>
        <h1 className="font-display leading-[1.1] mt-1 flex items-center gap-2.5 text-3xl font-bold tracking-tight">
          <IconChip icon={processIcon(task.id)} title={`${task.title} — ${task.phase} process`} />
          {task.title}
          {task.region === 'us' && (
            <span aria-label="US-specific process" title="US-specific: this flow is written around US law and agencies (IRS, Delaware, state filings)" className="text-xl">🇺🇸</span>
          )}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-300">
            {task.complexity.replace('_', ' ')}
          </span>
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-300">
            {SUPPORT_LABELS[task.supportLevel] ?? task.supportLevel}
          </span>
          {/* How often this really recurs in a running company — links to the rhythm board. */}
          <Link
            href="/processes/operating-rhythm"
            title={`${CADENCE_META[task.cadence].label} — ${CADENCE_META[task.cadence].blurb} See the full operating rhythm.`}
            className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
          >
            🔁 {CADENCE_META[task.cadence].label.toLowerCase()}
          </Link>
          {task.hasAsyncSteps && (
            <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-zinc-500">⏳ has async waits</span>
          )}
          {/* Admin-only (session allowlist or the pa-admin localStorage switch) — renders nothing
              for everyone else. The manifest it hands off is public regardless. */}
          <DoViaAfk manifestUrl={processManifestUrl(slug)} />
        </div>
        <p className="mt-3 max-w-2xl text-zinc-400">{task.description}</p>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">{task.supportReason}</p>
      </section>

      {/* Founder 2026-09-18: the process ITSELF leads — who covers it, then the step-by-step
          flow with per-step vendors. The agent-ceiling gap analysis moved below the steps and
          collapsed (it repeated every step's computer-use chips at the top of the page). */}
      <ProcessLeaderboard task={task} />

      {/* Founder ask: "Check my process" — the personalized run (your vendor per step vs the
          best, upgrade flags) lives at its own noindex route so this shared SEO page stays the
          one static version for everyone; the /mine page handles sign-up and stack setup. */}
      <p className="text-sm">
        <Link
          href={`/processes/${canonicalSlug}/mine`}
          className="inline-block rounded-lg border border-emerald-400/60 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-400/10"
          title="Run this process with the vendors you actually use — sign up, set your stack once, and see your step scores vs the market's best"
        >
          Check my process — run it with your stack →
        </Link>
      </p>

      <section>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">Step-by-step: what an agent can do vs you</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Route-coded block flow: <span className="text-emerald-300">emerald = agent</span>,{' '}
          <span className="text-amber-300">amber = manual form/portal</span>,{' '}
          <span className="text-red-300/90">red = needs a human</span>. ⏸ approval gate · ⏳ async wait.
        </p>
        <div className="mt-4 rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <div id="steps" className="scroll-mt-4" />
          <ProcessDag nodes={task.dag.nodes} edges={task.dag.edges} taskId={task.id} />
        </div>
        {task.contextNeeded.length > 0 && (
          <p className="mt-3 text-xs text-zinc-500">
            Context the agent needs first:{' '}
            {task.contextNeeded.map((c, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                <span className="whitespace-nowrap">
                  <span className="font-mono">{c.query ?? c.tool}</span>
                  {c.tier === 'user_input' && <span className="text-amber-400/80"> (from the founder)</span>}
                </span>
              </span>
            ))}
          </p>
        )}
      </section>

      <ProcessVerdict ceiling={ceiling} tasks={[task]} />

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
                    <li key={o.id} className="flex items-center justify-between gap-3">
                      <Link
                        href={`/arena/${role.arenaId}/product/${o.id}`}
                        className={`inline-flex min-w-0 items-center gap-2 hover:text-emerald-300 ${o.id === role.defaultProductId ? 'font-medium text-zinc-100' : 'text-zinc-400'}`}
                      >
                        <ProductLogoView product={{ id: o.id, name: o.name }} size={18} hasLogo={hasLogo(o.id)} />
                        <span className="truncate">{o.name}</span>
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

      {/* Public, ungated — the manifest is just the published corpus reshaped for executors. */}
      <section className="border-t border-zinc-800 pt-4 text-xs text-zinc-500">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600">For agents</span>{' '}
        <Link
          href={processManifestPath(slug)}
          className="text-zinc-400 hover:text-emerald-300"
          title="Versioned machine-readable run plan for this process: steps typed api / computer-use / human, vendor options with agent-readiness and MCP endpoints, approval gates"
        >
          Process manifest (JSON)
        </Link>
        <span className="mx-1.5 text-zinc-700">·</span>
        <Link href="/llms.txt" className="text-zinc-400 hover:text-emerald-300">/llms.txt</Link>
      </section>
    </div>
  )
}
