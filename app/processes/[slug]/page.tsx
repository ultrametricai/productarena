import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArtifactChips from '@/components/ArtifactChips'
import DoViaAfk from '@/components/DoViaAfk'
import GeoSwitcher from '@/components/GeoSwitcher'
import IconChip from '@/components/IconChip'
import JurisdictionToggle from '@/components/JurisdictionToggle'
import ProcessGeoBanner from '@/components/ProcessGeoBanner'
import MineLink from '@/components/MineLink'
import ProcessDag from '@/components/ProcessDag'
import ProcessGeoNotes from '@/components/ProcessGeoNotes'
import ProcessLeaderboard from '@/components/ProcessLeaderboard'
import ProcessLensBanner from '@/components/ProcessLensBanner'
import ProcessVendorPicker from '@/components/ProcessVendorPicker'
import ProductLogoView from '@/components/ProductLogoView'
import UrgencyChip from '@/components/UrgencyChip'
import { modulesForProcess } from '@/lib/businessLogicMap'
import { hasLogo } from '@/lib/logos'
import { buildProcessCheckSteps } from '@/lib/processCheckData'
import { artifactChipRows } from '@/lib/processDeps'
import { phaseIcon, phaseTooltip, processIcon } from '@/lib/processIcons'
import { processManifestPath, processManifestUrl } from '@/lib/processManifest'
import {
  CADENCE_META, findProcessBySlug, jurisdictionStepViews, knownCostUsd, loadProcesses, processSlug,
  slugAliasFor, taskCeiling,
} from '@/lib/processes'
import { SITE_URL } from '@/lib/site'

// One founder process: the DAG as it really runs, with the market resolved live from arena
// leaderboards per step. Founder 2026-09-30: the page slimmed — the vendor selector moved to
// the top ('Select vendor for process test'), and the bottom 'Agent ceiling' verdict box and
// 'Simulate this process' section are gone from process pages (chain pages keep both).
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
  if (!task) return { title: 'Process — Ultrametric' }
  const ceiling = taskCeiling(task)
  return {
    title: `${task.title} — Processes — Ultrametric`,
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
  const alias = slugAliasFor(task, slug)
  const canonicalSlug = processSlug(task.title)
  const mineHref = `/processes/${canonicalSlug}/mine`
  // Same pre-serialized rows as /mine — the client-side lens/"yours" chips hydrate over them;
  // the static HTML is unchanged for readers without a click or a stack (server lens and stack
  // snapshots are both '{}').
  const checkStepList = buildProcessCheckSteps(task)
  const checkSteps = Object.fromEntries(checkStepList.map((s) => [s.nodeId, s]))
  // Jurisdiction-conditional steps (stripped from every default surface by loadProcesses) —
  // serialized for the client-side toggle; [] for the many processes that don't branch.
  const jurisSteps = jurisdictionStepViews(task.id)
  // Sum of the DATED per-step government fees only (depth wave pt 1, lib/processes.ts) —
  // derived, never hand-stored; vendor prices deliberately excluded so the headline never
  // implies a completeness the curation doesn't claim. 0 for most processes → no chip.
  const knownFees = knownCostUsd(task.dag.nodes)
  // Open business-logic modules serving this process (processes/business-logic-map.json).
  const openModules = modulesForProcess(task.id)

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
          <IconChip icon={processIcon(task.id)} title={`${task.title} — ${task.phase} ${task.kind === 'situation' ? 'situation' : 'process'}`} />
          {task.title}
          {task.region === 'us' && (
            <span
              aria-label="US-specific process"
              // geoScope (founder GEO ask 2026-09-28) sharpens the flag's story: state-level
              // work names the state as the counterparty, federal work names the agencies.
              title={task.geoScope === 'us-state'
                ? 'US state-level: the counterparty here is a US state (Delaware filings, state portals, state registrations)'
                : 'US-specific: this flow is written around US federal law and agencies (IRS, USPTO, SEC, immigration)'}
              className="text-xl"
            >🇺🇸</span>
          )}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {/* Situations (founder 2026-10-01) lead the chip row with their honest clock. */}
          {task.urgency && <UrgencyChip tier={task.urgency} />}
          {/* The complexity chip ('simple'/…) removed (founder 2026-10-02) — the field stays
              corpus data for sorting; the chip told a reader nothing actionable. */}
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
          {knownFees > 0 && (
            <span
              title="Sum of this process's per-step government fees that carry a published, dated source (each step's cost chip links to its fee schedule). Vendor prices are excluded — this is the known government minimum, not a total cost; fees change, each chip carries its as-of date."
              className="rounded-full border border-zinc-800 px-2 py-0.5 text-zinc-500"
            >
              Known government fees: ${knownFees.toLocaleString('en-US')}
            </span>
          )}
          {/* Admin-only (session allowlist or the pa-admin localStorage switch) — renders nothing
              for everyone else. The manifest it hands off is public regardless. */}
          <DoViaAfk manifestUrl={processManifestUrl(slug)} />
        </div>
        {/* The trigger — the event that puts a founder in this situation — leads the prose
            (founder 2026-10-01), ahead of the description, in the header. */}
        {task.kind === 'situation' && task.trigger && (
          <p className="mt-3 max-w-2xl text-sm text-zinc-300">
            <span className="font-semibold text-amber-300">Trigger:</span> {task.trigger}
          </p>
        )}
        <p className="mt-3 max-w-2xl text-zinc-400">{task.description}</p>
        {/* supportReason no longer renders as a second description line (founder 2026-10-02) —
            it stays corpus data (the ceiling chip's tooltip territory, and the honesty record). */}
        {/* The typed-I/O layer (founder depth wave part 2, 2026-10-01): what this process Needs
            and Produces as registry artifacts (processes/artifacts.json), each Needs chip
            linking to the canonical producer process — contextNeeded prose below the DAG stays
            the human context; these chips are the machine truth the cross-process dependency
            graph (lib/processDeps.ts) is built from. */}
        <ArtifactChips rows={artifactChipRows(task)} />
        {/* Business-logic ↔ process wiring (founder 2026-10-02): the open lib/openstartup
            modules that serve this process, from the committed registry
            processes/business-logic-map.json — a muted line of chips deep-linking to the
            module's section in business-logic/README.md on GitHub (the modules are a repo
            library by design, no site pages). Renders nothing for the many unmapped tasks. */}
        {openModules.length > 0 && (
          <p className="mt-3 flex max-w-2xl flex-wrap items-center gap-1.5 text-xs text-zinc-500">
            <span title="Open-source business-logic modules (lib/openstartup/ in the repo) whose cited, tested math serves this process — cap tables, deadlines, tax mechanics, and friends. Each chip opens the module's documentation.">
              Open modules:
            </span>
            {openModules.map((m) => (
              <a
                key={m.id}
                href={m.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-800 px-2 py-0.5 text-zinc-400 transition hover:border-emerald-400/60 hover:text-emerald-300"
              >
                {m.label} ↗
              </a>
            ))}
          </p>
        )}
        {/* Situations routinely touch law (C&Ds, lawsuits, notices, breach statutes) — the
            posture banner is explicit, the same honest-banner idiom as ProcessGeoBanner:
            educational operating guidance, never legal advice; stated deadlines are nominal
            and carry their sources on the steps (the deadlines.ts needs-review doctrine). */}
        {task.kind === 'situation' && (
          <p className="mt-4 max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-400">
            This is a reactive situation guide — educational, not legal advice. Deadlines named
            in the steps are the nominal clocks stated by their linked sources; the real date
            can differ (service dates, statutory exceptions, your jurisdiction), so verify
            against the cited source and counsel before relying on one.
          </p>
        )}
        {/* GEO as a top-level driver (founder 2026-09-28: "make GEO a top-level process driver
            at the top of a particular process page … so we know how it works across the
            globe"). The switcher is global (?geo= + pa-geo, lib/geoPreference.ts); the banner
            below it renders the selected country's committed story — nothing for the US
            default, so the static HTML stays the one shared view and no judged number moves. */}
        <div className="mt-4">
          <GeoSwitcher />
        </div>
        <ProcessGeoBanner geoScope={task.geoScope} notes={task.geoNotes ?? []} />
        {/* Vendor selection at the TOP of the page (founder 2026-09-30: 'Select vendor for
            process test', no vendor selected by default) — the same lens the per-step "use"
            affordances and ?via= drive; picking one re-resolves the whole step-by-step below. */}
        <ProcessVendorPicker steps={checkStepList} lensKey={task.id} />
      </section>

      {/* Founder 2026-09-18: the process ITSELF leads — who covers it, then the step-by-step
          flow with per-step vendors. The agent-ceiling gap analysis moved below the steps and
          collapsed (it repeated every step's computer-use chips at the top of the page). */}
      <ProcessLeaderboard task={task} mineHref={mineHref} />

      {/* Founder ask: "Check my process" — the personalized run (your vendor per step vs the
          best, upgrade flags) lives at its own noindex route so this shared SEO page stays the
          one static version for everyone; the /mine page handles sign-up and stack setup. */}
      <p className="text-sm">
        {/* Signed-out clicks route through sign-up with a deep link back to THIS process's
            personalized run (founder 2026-09-23) — components/MineLink.tsx. */}
        <MineLink
          mineHref={mineHref}
          className="inline-block rounded-lg border border-emerald-400/60 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-400/10"
          title="Run this process with the vendors you actually use — sign up, set your stack once, and see your step scores vs the market's best"
        >
          Check my process — run it with your stack →
        </MineLink>
      </p>

      <section>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">Step-by-step: what an agent can do vs you</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Route-coded block flow: <span className="text-emerald-300">emerald = agent</span>,{' '}
          <span className="text-amber-300">amber = manual form/portal</span>,{' '}
          <span className="text-sky-300">sky = human or computer use</span>,{' '}
          {/* Stale-copy fix (SSOT audit 2026-09-30): the '⏳ async' chip left the step blocks on
              2026-09-30 (it survives inside method sub-steps) — the legend advertises only what
              the diagram renders. */}
          <span className="text-violet-300">violet ✍ = signature, legally human</span>. ⏸ approval gate.
        </p>
        {/* Client-side lens banner (founder 2026-09-21: click a vendor → the process adapts to
            run via it). Renders nothing in the static HTML — hydrates in only for readers with
            a clicked vendor or an "I'm using" stack pick. */}
        <ProcessLensBanner steps={checkStepList} pageKey={task.id} />
        {/* The vendor picker itself sits at the top of the page now (founder 2026-09-30). */}
        <div className="mt-4 rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <div id="steps" className="scroll-mt-4" />
          <ProcessDag
            nodes={task.dag.nodes}
            edges={task.dag.edges}
            taskId={task.id}
            checkSteps={checkSteps}
            mineHref={mineHref}
            lensKey={task.id}
            manifestUrl={processManifestUrl(slug)}
            usScoped={task.geoScope !== 'global'}
          />
        </div>
        {/* Jurisdiction-conditional steps (founder 2026-09-25) — only processes that genuinely
            branch by jurisdiction get the control. Client-side over the same static HTML: the
            default (Delaware-only) page is byte-identical and every judged number stays the
            default's; toggled-on steps render below the DAG with a recomputed, honestly
            labelled ceiling (components/JurisdictionToggle.tsx). */}
        {jurisSteps.length > 0 && (
          <JurisdictionToggle
            steps={jurisSteps}
            base={{ agentSteps: ceiling.agentSteps, totalSteps: ceiling.totalSteps, pct: ceiling.pct }}
          />
        )}
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

      {/* The GEO dimension (founder 2026-09-28, expanded 2026-09-29): per-country analogs of a
          US-scoped process — or the local flavor of a flavored global one — curated in the
          corpus (geoNotes); renders nothing for the many processes without. */}
      <ProcessGeoNotes notes={task.geoNotes ?? []} geoScope={task.geoScope} />

      {/* The 'Agent ceiling' verdict box and the 'Simulate this process' section are gone from
          process pages (founder 2026-09-30) — the per-step route badges and the leaderboard
          carry the story here; chain pages keep both (ProcessVerdict/ProcessSimulator live on). */}

      {/* Public, ungated — the manifest is just the published corpus reshaped for executors. */}
      <section className="border-t border-zinc-800 pt-4 text-xs text-zinc-500">
        <span className="text-[10px] uppercase tracking-widest text-zinc-400">For agents</span>{' '}
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
