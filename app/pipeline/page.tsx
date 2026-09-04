import type { Metadata } from 'next'
import Link from 'next/link'
import { loadAll, stripPersonaPrefix } from '@/lib/data'
import {
  arenaPipelineStats,
  mostWantedUntested,
  nextUpArenas,
  sitePipelineTotals,
} from '@/lib/testingPipeline'

export const metadata: Metadata = {
  title: 'Testing pipeline — what we have NOT tested — ProductArena',
  description:
    'The transparency board: every arena’s untested cells, the share of verdicts backed by hands-on probes, the most-wanted untested product/story pairs, and which arenas are next.',
}

// The answer to "what have you NOT tested" — a static transparency board that leads with the
// gaps (see lib/testingPipeline.ts). Review sites bury this; we headline it: an untested cell
// is a zero-evidence none/na, i.e. "we found nothing either way and never probed it", and it
// already can't contribute to any score.
export const dynamic = 'force-static'

export default function PipelinePage() {
  const categories = loadAll()
  const stats = categories.map(arenaPipelineStats).sort((a, b) => b.untestedPct - a.untestedPct)
  const totals = sitePipelineTotals(stats)
  const mostWanted = mostWantedUntested(categories)
  const nextUp = nextUpArenas(new Set(categories.map((c) => c.category.id)))

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">Testing pipeline</p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">
          What we have <span className="text-emerald-400">not</span> tested
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Every ranking on this site is built from per-cell verdicts — and{' '}
          <span className="text-zinc-200 font-medium">
            {totals.untestedCells.toLocaleString()} of {totals.totalCells.toLocaleString()} cells
            ({totals.untestedPct}%)
          </span>{' '}
          are still untested: a zero-evidence none/na where we found nothing pro or con and never
          probed it. Those cells can&rsquo;t score — they read as unknown, never as 0 — and this
          page is the standing list of them. {totals.probedPct}% of all cells are backed by a
          hands-on probe.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'cells judged', value: totals.totalCells.toLocaleString(), sub: `${totals.arenas} arenas` },
          { label: 'still untested', value: `${totals.untestedPct}%`, sub: `${totals.untestedCells.toLocaleString()} zero-evidence cells` },
          { label: 'probed hands-on', value: `${totals.probedPct}%`, sub: `${totals.probedCells.toLocaleString()} cells cite a probe` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-zinc-800 p-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">{stat.label}</p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-emerald-400">{stat.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{stat.sub}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight">Most-wanted untested cells</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          The ten untested (product, story) pairs whose testing would move the most-read scores
          the most — heaviest stories on the most-watched products (capped at two per product so
          one giant can&rsquo;t fill the board). Have first-hand evidence for one? <Link href="/submit" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">Send it in</Link>.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
                <th scope="col" className="px-3 py-2 font-normal">Product</th>
                <th scope="col" className="px-3 py-2 font-normal">Untested story</th>
                <th scope="col" className="hidden px-3 py-2 font-normal sm:table-cell">Arena</th>
                <th scope="col" className="px-3 py-2 font-normal">Weight</th>
                <th scope="col" className="hidden px-3 py-2 font-normal md:table-cell">GitHub ★</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {mostWanted.map((cell) => (
                <tr key={`${cell.arenaId}:${cell.productId}:${cell.storyId}`} className="transition hover:bg-zinc-900/50">
                  <td className="whitespace-nowrap px-3 py-2">
                    <Link
                      href={`/arena/${cell.arenaId}/product/${cell.productId}#story-${cell.storyId}`}
                      className="font-medium hover:text-emerald-300"
                    >
                      {cell.productName}
                    </Link>
                  </td>
                  <td className="max-w-[380px] px-3 py-2 text-zinc-300">
                    {stripPersonaPrefix(cell.storyTitle)}
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-2 text-xs text-zinc-400 sm:table-cell">
                    <Link href={`/arena/${cell.arenaId}`} className="hover:text-emerald-300">
                      {cell.arenaName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-zinc-300">×{cell.weight}</td>
                  <td className="hidden px-3 py-2 font-mono tabular-nums text-zinc-400 md:table-cell">
                    {cell.stars === null ? <span className="font-sans text-xs italic text-zinc-600">no signal</span> : cell.stars.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight">Coverage per arena</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Sorted worst-first: the arenas with the largest untested share are where the rankings
          deserve the most skepticism — and the most contributed evidence.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
                <th scope="col" className="px-3 py-2 font-normal">Arena</th>
                <th scope="col" className="hidden px-3 py-2 font-normal sm:table-cell">Products</th>
                <th scope="col" className="px-3 py-2 font-normal">Cells</th>
                <th scope="col" className="px-3 py-2 font-normal">Untested</th>
                <th scope="col" className="px-3 py-2 font-normal">Probed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {stats.map((a) => (
                <tr key={a.arenaId} className="transition hover:bg-zinc-900/50">
                  <td className="whitespace-nowrap px-3 py-2">
                    <Link href={`/arena/${a.arenaId}`} className="font-medium hover:text-emerald-300">
                      {a.arenaName}
                    </Link>
                  </td>
                  <td className="hidden px-3 py-2 font-mono tabular-nums text-zinc-400 sm:table-cell">{a.products}</td>
                  <td className="px-3 py-2 font-mono tabular-nums text-zinc-400">{a.totalCells.toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono tabular-nums text-zinc-300">
                    {a.untestedCells.toLocaleString()} <span className="text-zinc-500">({a.untestedPct}%)</span>
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-zinc-300">{a.probedPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {nextUp.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">Next up</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Tier-1 arenas on the roadmap that haven&rsquo;t been through the evidence pipeline
            yet — the categories we think matter most in an agent-first world, in no particular
            order.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nextUp.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-zinc-800 p-4">
                <h3 className="font-medium">{entry.name}</h3>
                {entry.aiEraAngle && <p className="mt-1 text-xs text-zinc-400">{entry.aiEraAngle}</p>}
                {entry.candidateProducts && entry.candidateProducts.length > 0 && (
                  <p className="mt-2 truncate text-[10px] uppercase tracking-wide text-zinc-600">
                    {entry.candidateProducts.slice(0, 5).join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-zinc-500">
        Untested is a per-cell status: a none/na verdict that cites zero evidence (the same
        definition the tables use to render &ldquo;untested&rdquo; instead of 0 — see{' '}
        <Link href="/methodology" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
          methodology
        </Link>
        ). &ldquo;Probed&rdquo; is stricter than &ldquo;evidenced&rdquo;: only verdicts citing a
        hands-on probe count.
      </p>
    </div>
  )
}
