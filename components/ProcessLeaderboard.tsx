import Link from 'next/link'
import ProcessDagStrip from '@/components/ProcessDagStrip'
import ProcessYourVendor from '@/components/ProcessYourVendor'
import ProductLogoView from '@/components/ProductLogoView'
import { hasLogo } from '@/lib/logos'
import type { ProcessTask } from '@/lib/processes'
import { processLeaderboard } from '@/lib/processRankings'

// "Who covers this process best" — the process-level, story-derived ranking (founder ask:
// don't assume the user has a vendor; look at what stories the vendors support for the process
// and its steps). Server component, static: everything derives from the committed step→story
// mapping (data/process-step-stories.json) × the judged verdicts, via lib/processRankings.ts.
//
// Two views of the same numbers:
//   - the single-vendor leaderboard: processScore = sum of a vendor's step scores over the
//     process's rankable steps (steps it can't serve count 0), normalized 0–100 — literally
//     coverage × step quality;
//   - the best-vendor-per-step chain: the top-ranked vendor of each rankable step.
// Each leaderboard row expands to its per-step scores; the full verdict citations behind every
// step score live in the step blocks of the diagram below ("how these are ranked").

// How many leaderboard rows to show — same legibility cap as the per-step chip roster.
const LEADERBOARD_CAP = 8

export default function ProcessLeaderboard({ task, mineHref }: { task: ProcessTask; mineHref?: string }) {
  const lb = processLeaderboard(task)
  if (lb.entries.length === 0 || lb.rankableSteps === 0) return null
  const entries = lb.entries.slice(0, LEADERBOARD_CAP)

  return (
    <section>
      <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">
        Who covers this process best
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        No vendor assumed — every vendor of the covering arenas, scored per step from its judged
        verdicts on the stories mapped to that step, then aggregated: coverage × step quality
        over the {lb.rankableSteps} rankable of {lb.totalSteps} steps. Expand a row for the
        per-step trail; the verdict citations behind each step score are in the diagram below.
      </p>

      {/* The process at a glance (founder 2026-09-23): the SAME Kahn layers as the full vertical
          diagram, compressed to a horizontal dot strip — scan the shape, then click through to
          #steps. Process pages only: this component never renders on chain pages. */}
      <ProcessDagStrip nodes={task.dag.nodes} edges={task.dag.edges} />

      {/* Client-side "you run X" banner (founder 2026-09-21): hydrates in only for readers whose
          "I'm using" stack matches a covering arena — built from the FULL entry list so the
          reader's pick is found wherever it ranks; the static HTML is unchanged. */}
      {mineHref && (
        <ProcessYourVendor
          entries={lb.entries.map((e, i) => ({
            productId: e.productId,
            name: e.name,
            arenaId: e.arenaId,
            hasLogo: hasLogo(e.productId),
            rank: i + 1,
            processScore: e.processScore,
            stepsServed: e.stepsServed,
          }))}
          rankableSteps={lb.rankableSteps}
          mineHref={mineHref}
        />
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800">
        {entries.map((e, i) => (
          <details key={`${e.arenaId}-${e.productId}`} className="group border-b border-zinc-800/70 last:border-b-0">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 transition hover:bg-zinc-900/60 [&::-webkit-details-marker]:hidden">
              <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-zinc-500">{i + 1}</span>
              <span className="flex min-w-0 grow items-center gap-2">
                <ProductLogoView product={{ id: e.productId, name: e.name }} size={18} hasLogo={hasLogo(e.productId)} />
                <Link
                  href={`/arena/${e.arenaId}/product/${e.productId}`}
                  className="truncate text-sm font-medium text-zinc-100 transition hover:text-emerald-300"
                >
                  {e.name}
                </Link>
                <Link
                  href={`/arena/${e.arenaId}`}
                  className="hidden truncate text-[11px] text-zinc-500 transition hover:text-emerald-300 sm:inline"
                >
                  {e.arenaName}
                </Link>
              </span>
              <span
                className="shrink-0 text-[11px] text-zinc-500"
                title={`Serves ${e.stepsServed} of the ${lb.rankableSteps} rankable steps, averaging ${e.avgStepScore.toFixed(0)}/100 on the steps it serves`}
              >
                {e.stepsServed}/{lb.rankableSteps} steps · avg {e.avgStepScore.toFixed(0)}
              </span>
              <span
                className="w-12 shrink-0 text-right font-mono text-sm tabular-nums text-emerald-400"
                title="Process score: sum of step scores over ALL rankable steps (unserved steps count 0), 0-100 — coverage × step quality"
              >
                {e.processScore.toFixed(0)}
              </span>
              <span aria-hidden className="shrink-0 text-[9px] text-zinc-600 transition-transform group-open:rotate-90">▶</span>
            </summary>
            <ul className="space-y-0.5 border-t border-zinc-800/50 bg-zinc-900/40 px-4 py-2 pl-12 text-[11px] text-zinc-400">
              {e.steps.map((s) => (
                <li key={s.nodeId} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate">{s.label}</span>
                  <span
                    className="shrink-0 font-mono tabular-nums text-emerald-400/80"
                    title={`Step score from judged verdicts on the ${s.storyCount} stories mapped to this step — expand the step block below for the citations`}
                  >
                    {s.score.toFixed(0)}
                    <span className="text-zinc-600">/100 · {s.storyCount} stories</span>
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      {/* The mixed-fleet answer: the best vendor for each step, in run order. */}
      <p className="mt-3 text-[11px] text-zinc-500">
        <span className="mr-1.5 text-[10px] uppercase tracking-wide" title="The top-ranked vendor of each rankable step — the best mixed-vendor chain through this process">
          best per step:
        </span>
        {lb.bestPerStep.map((s, i) => (
          <span key={s.nodeId} className="whitespace-nowrap">
            {i > 0 && <span className="mx-1.5 text-zinc-700">→</span>}
            <span className="text-zinc-400">{s.label}:</span>{' '}
            <Link
              href={`/arena/${s.arenaId}/product/${s.top.productId}`}
              title={`${s.top.name} — ${s.top.score.toFixed(0)}/100 on this step's ${s.storyCount} mapped ${s.arenaName} stories`}
              className="text-zinc-300 transition hover:text-emerald-300"
            >
              {s.top.name}
            </Link>{' '}
            <span className="font-mono text-[10px] tabular-nums text-emerald-400/80">{s.top.score.toFixed(0)}</span>
          </span>
        ))}
      </p>
    </section>
  )
}
