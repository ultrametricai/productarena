import GeoMark from '@/components/GeoMark'
import SurfaceChip from '@/components/SurfaceChip'
import { type CategoryData, stripPersonaPrefix } from '@/lib/data-helpers'
import { coverageMapFor } from '@/lib/storyCoverage'

// Server component: the inverse of the per-row "Covered by" chips in StoryVerdictsTable — each
// evidence SURFACE (docs area / API section / community source, clustered by
// lib/storyCoverage.ts) with every story it covers, most-covering first. Answers "which part of
// the product carries the ranking": e.g. the API reference alone covers 14 stories while the
// agent docs cover 6. Collapsed by default via native <details> (static-export safe, no client
// JS); story links target the verdicts table's #story-<id> anchors, which auto-expand the row.

export default function CoverageMapSection({ data, productId }: { data: CategoryData; productId: string }) {
  const surfaces = coverageMapFor(data, productId)
  // No covered stories at all (every verdict none/na) — no map to draw, absence stays absent.
  if (surfaces.length === 0) return null
  const actionOf = new Map(data.stories.map((s) => [s.id, stripPersonaPrefix(s.title)]))
  const covered = new Set(surfaces.flatMap((s) => s.storyIds))
  return (
    <details className="rounded-xl border border-zinc-800 p-4">
      <summary className="cursor-pointer select-none">
        <h2 className="font-display leading-[1.1] inline-flex flex-wrap items-center gap-2 text-lg font-semibold">
          <GeoMark
            seed="coverage-map"
            title="Coverage map — which docs area, API section, or community source covers which judged stories"
            size={18}
            className="text-zinc-500"
          />
          Coverage map
          <span className="font-sans text-xs font-normal text-zinc-500">
            {surfaces.length} {surfaces.length === 1 ? 'surface' : 'surfaces'} · {covered.size} covered{' '}
            {covered.size === 1 ? 'story' : 'stories'}
          </span>
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Where the cited evidence behind each covered verdict came from — derived from the same
          citations the verdicts table shows, no extra judging. Chips link to the evidence URL;
          story names jump to their verdict row.
        </p>
      </summary>
      <div className="mt-3 space-y-3">
        {surfaces.map((s) => (
          <div key={s.key} className="rounded-lg border border-zinc-800/70 p-3">
            <p className="flex flex-wrap items-center gap-2">
              <SurfaceChip surface={s} />
              <span
                className="font-mono text-xs tabular-nums text-zinc-400"
                title={`${s.storyIds.length} of this product's covered stories cite evidence from this surface`}
              >
                {s.storyIds.length} {s.storyIds.length === 1 ? 'story' : 'stories'}
              </span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {s.storyIds.map((id) => (
                <li key={id} className="min-w-0 text-xs text-zinc-400">
                  <a
                    href={`#story-${id}`}
                    title="Jump to this story's verdict row (opens with the full rationale and evidence)"
                    className="break-words underline decoration-zinc-800 underline-offset-2 transition hover:text-emerald-300"
                  >
                    {actionOf.get(id) ?? id}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  )
}
