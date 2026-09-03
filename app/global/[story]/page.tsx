import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import VerdictBadge from '@/components/VerdictBadge'
import { loadAll, stripPersonaPrefix } from '@/lib/data'
import { collectGlobalStories, findGlobalStory } from '@/lib/globalStories'

// Cross-arena comparison page for one global story (scope: 'global', present in ≥2 arenas —
// see lib/globalStories.ts): every ranked product's verdict on the same capability, across
// every arena that carries it. This is the "2FA across all software" view — the canonical lens
// stories (official CLI, MCP server, webhooks, self-hosting…) span all arenas; a non-canonical
// id qualifies once two arenas author it independently. Fully static: params come from the
// bundled data, and unknown ids 404 (dynamicParams = false).

export function generateStaticParams() {
  return collectGlobalStories(loadAll()).map((s) => ({ story: s.id }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ story: string }>
}): Promise<Metadata> {
  const { story } = await params
  const entry = findGlobalStory(loadAll(), story)
  return {
    title: `${entry ? stripPersonaPrefix(entry.title) : story} — across all software — ProductArena`,
    description: entry
      ? `Every product's evidence-backed verdict on "${stripPersonaPrefix(entry.title)}" across ${entry.arenaCount} arenas.`
      : undefined,
  }
}

export default async function GlobalStoryPage({
  params,
}: {
  params: Promise<{ story: string }>
}) {
  const { story } = await params
  const categories = loadAll()
  const entry = findGlobalStory(categories, story)
  if (!entry) notFound()
  const supported = entry.cells.filter((c) => c.verdict === 'full' || c.verdict === 'partial').length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">Global story</p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">
          {stripPersonaPrefix(entry.title)}
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          A global story is meaningful for any software product, so it can be compared across the
          whole site — every product&rsquo;s verdict on{' '}
          <span className="font-mono text-sm text-zinc-300">{entry.id}</span> across all{' '}
          {entry.arenaCount} arenas that carry it, judged from public evidence.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {supported}/{entry.cells.length} products pass (full or partial) · click a verdict for
          the product&rsquo;s rationale and evidence
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        {/* Arena is the one column that can go below sm — the verdict is this page's whole
            point, so it must stay on-screen at phone widths instead of behind a sideways
            scroll. min-w only applies once the Arena column is back. */}
        <table className="w-full border-collapse text-sm sm:min-w-[640px]">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-widest text-zinc-400">
              <th scope="col" className="px-3 py-2 font-normal">Product</th>
              <th scope="col" className="hidden px-3 py-2 font-normal sm:table-cell">Arena</th>
              <th scope="col" className="px-3 py-2 font-normal">Verdict</th>
              <th scope="col" className="px-3 py-2 font-normal">Quality</th>
              <th scope="col" className="px-3 py-2 font-normal">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {entry.cells.map((cell) => {
              const href = `/arena/${cell.categoryId}/product/${cell.productId}#story-${entry.id}`
              return (
                <tr key={`${cell.categoryId}:${cell.productId}`} className="transition hover:bg-zinc-900/50">
                  <td className="px-3 py-2">
                    <Link href={href} className="font-medium hover:text-emerald-300">
                      {cell.productName}
                    </Link>
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-2 text-xs text-zinc-400 sm:table-cell">
                    <Link href={`/arena/${cell.categoryId}`} className="hover:text-emerald-300">
                      {cell.categoryName}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={href} aria-label={`${cell.productName} verdict details`}>
                      <VerdictBadge verdict={cell.verdict} />
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-zinc-400">
                    {cell.verdict === 'none' || cell.verdict === 'na' ? (
                      <span className="font-sans text-xs italic text-zinc-500">—</span>
                    ) : (
                      <>{cell.quality}/10</>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Link href={href} className="font-mono text-xs tabular-nums text-zinc-300 underline decoration-zinc-800 hover:text-emerald-300">
                      {cell.evidenceCount} {cell.evidenceCount === 1 ? 'source' : 'sources'}
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-500">
        Verdicts are judged per arena against that arena&rsquo;s evidence packs, so the same tier
        can rest on different evidence depth across arenas — follow a row to the product page for
        the full rationale.
      </p>
    </div>
  )
}
