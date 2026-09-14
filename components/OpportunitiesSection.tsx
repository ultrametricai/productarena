import GeoMark from '@/components/GeoMark'
import ThemeIcon from '@/components/ThemeIcon'
import VerdictBadge from '@/components/VerdictBadge'
import Link from 'next/link'
import type { CategoryData } from '@/lib/data-helpers'
import { AGENTIC_BOOST, OPPORTUNITY_CAP, opportunitiesFor, type Opportunity, type ScoreLever } from '@/lib/opportunities'

// Server component: the product's ranked improvement list, derived purely from its OWN judged
// verdicts (lib/opportunities.ts) — every none/partial story ordered by score headroom, with the
// judge's own "missing for 10" clause as the one-line why. Collapsed by default via native
// <details> (static-export safe, no client JS), same pattern as CoverageMapSection. This is the
// vendor's to-do list, framed honestly: it says what would move THIS product's scores on OUR
// stories, nothing about roadmaps or market fit. Story links target the verdicts table's
// #story-<id> anchors, which auto-expand the row with the full rationale and evidence.

// Where closing the gap lands, in plain words — the REQUIRED tooltip for each lever chip.
const LEVER_TITLES: Record<ScoreLever, string> = {
  'agent-ready': 'Closing this moves the agent-ready index directly (and the PA Score through it)',
  'Built-in AI': 'Closing this moves the Built-in AI index directly (and the PA Score through it)',
  'API quality': 'Closing this moves the API quality index directly (and the PA Score through it)',
  'PA Score': 'Closing this moves the PA Score blend via its theme, plus the coverage score',
}

// The index-feeding levers get the emerald treatment — they're the agentic axes this site is
// about; plain PA Score levers stay zinc.
const LEVER_STYLES: Record<ScoreLever, string> = {
  'agent-ready': 'border-emerald-400/40 bg-emerald-400/5 text-emerald-300',
  'Built-in AI': 'border-emerald-400/40 bg-emerald-400/5 text-emerald-300',
  'API quality': 'border-emerald-400/40 bg-emerald-400/5 text-emerald-300',
  'PA Score': 'border-zinc-700 bg-zinc-900 text-zinc-400',
}

function impactTitle(o: Opportunity): string {
  const boost = o.scoreLever === 'PA Score' ? '' : ` × ${AGENTIC_BOOST} agentic boost`
  return `Impact = story weight × (10 − judged quality ${o.quality})${boost} — the score headroom this story represents`
}

export default function OpportunitiesSection({
  data,
  productId,
  productName,
}: {
  data: CategoryData
  productId: string
  productName: string
}) {
  const report = opportunitiesFor(data, productId)
  // Nothing judged none/partial — no honest opportunity list to show (rare, and good news).
  if (report.total === 0) return null
  return (
    <details className="rounded-xl border border-zinc-800 p-4">
      <summary className="cursor-pointer select-none">
        <h2 className="font-display leading-[1.1] inline-flex flex-wrap items-center gap-2 text-lg font-semibold">
          <GeoMark
            seed="opportunities"
            title="Opportunities — the stories that would move this product's scores, from its own judged verdicts"
            size={18}
            className="text-zinc-500"
          />
          Opportunities
          <span className="font-sans text-xs font-normal text-zinc-500">
            {report.truncated ? `top ${OPPORTUNITY_CAP} of ${report.total}` : `${report.total}`}{' '}
            {report.total === 1 && !report.truncated ? 'story' : 'stories'} with headroom
          </span>
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          What would move {productName}&rsquo;s scores — derived from its own judged verdicts, biggest
          headroom first. Each line quotes what the judge found missing; shipping it (or evidencing
          it publicly) is the fix.
        </p>
      </summary>
      <ol className="mt-3 space-y-3">
        {report.opportunities.map((o) => (
          <li key={o.storyId} className="rounded-lg border border-zinc-800/70 p-3">
            <p className="flex flex-wrap items-center gap-2">
              <ThemeIcon theme={o.theme} />
              <a
                href={`#story-${o.storyId}`}
                title="Jump to this story's verdict row (opens with the full rationale and evidence)"
                className="min-w-0 break-words text-sm font-medium underline decoration-zinc-800 underline-offset-2 transition hover:text-emerald-300"
              >
                {o.title}
              </a>
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-2">
              <VerdictBadge verdict={o.verdict} href={`#story-${o.storyId}`} hrefTitle="jump to the judged row below" />
              {o.verdict === 'partial' && (
                <span
                  className="font-mono text-xs tabular-nums text-zinc-400"
                  title={`Judged quality ${o.quality}/10 — the headroom is 10 − quality`}
                >
                  q{o.quality}/10
                </span>
              )}
              <span
                title={LEVER_TITLES[o.scoreLever]}
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${LEVER_STYLES[o.scoreLever]}`}
              >
                moves {o.scoreLever}
              </span>
              <span
                className="ml-auto font-mono text-xs tabular-nums text-zinc-500"
                title={impactTitle(o)}
              >
                impact {o.impact}
              </span>
            </p>
            <p className="mt-1.5 text-xs text-zinc-400">{o.why}</p>
          </li>
        ))}
      </ol>
      {report.truncated && (
        <p className="mt-2 text-xs text-zinc-500">
          Showing the top {OPPORTUNITY_CAP} of {report.total} — every none/partial verdict in the{' '}
          <a href="#story-verdicts" className="underline decoration-zinc-800 underline-offset-2 hover:text-emerald-300">
            story verdicts table
          </a>{' '}
          is headroom.
        </p>
      )}
      <p className="mt-3 border-t border-zinc-800/70 pt-3 text-xs text-zinc-500">
        Think a verdict is wrong? Every verdicts-table row has a Flag link — see the{' '}
        <Link href="/methodology" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
          methodology
        </Link>
        .
      </p>
    </details>
  )
}
