import type { Metadata } from 'next'
import Link from 'next/link'
import GeoMark from '@/components/GeoMark'
import PersonaChip from '@/components/PersonaChip'
import { loadAll, stripPersonaPrefix } from '@/lib/data'
import { parseStoryPersona } from '@/lib/storyText'
import { adoptionNow } from '@/lib/diffusion'
import { collectGlobalStories } from '@/lib/globalStories'

// THE industry-stats page: every global story (capability comparable across ≥2 arenas — see
// lib/globalStories.ts) with its adoption share among all tracked products, sorted most-adopted
// first. Answers "what fraction of the software industry we track has an official MCP server /
// llms.txt / self-hosting / 2FA…" in one table; each row links to the /global/[story] page with
// the full per-product verdict list and the diffusion curve.
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Capability adoption across the industry — ProductArena',
  description:
    'How widely each cross-arena capability — official MCP servers, llms.txt, webhooks, self-hosting, 2FA and more — is adopted among every product we track, with evidence-backed verdicts.',
}

export default function GlobalIndexPage() {
  const categories = loadAll()
  const totalProducts = categories.reduce((n, c) => n + c.products.length, 0)
  const stories = collectGlobalStories(categories)
    .map((story) => ({ story, adoption: adoptionNow(story.cells) }))
    .sort(
      (a, b) =>
        b.adoption.pct - a.adoption.pct ||
        b.story.arenaCount - a.story.arenaCount ||
        a.story.id.localeCompare(b.story.id),
    )

  return (
    <div className="space-y-6">
      <div>
        {/* seed "global": same concept mark as the Explore menu's Capability adoption entry. */}
        <p className="flex items-center gap-2 text-sm uppercase tracking-widest text-emerald-400">
          <GeoMark seed="global" title="Capability adoption — cross-arena industry stats" size={16} className="text-zinc-500" />
          Global stories
        </p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">
          Capability adoption across the industry
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          {stories.length} capabilities that are meaningful for any software product, compared
          across all {categories.length} arenas and {totalProducts} tracked products. Adoption is
          the share of products whose evidence-backed verdict is full or partial — click through
          for every product&rsquo;s verdict and the month-by-month diffusion curve.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
              <th scope="col" className="px-3 py-2 font-normal">Capability</th>
              <th scope="col" className="hidden px-3 py-2 font-normal sm:table-cell">Arenas</th>
              <th scope="col" className="hidden px-3 py-2 font-normal sm:table-cell">Products</th>
              <th scope="col" className="px-3 py-2 font-normal">Adoption</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {stories.map(({ story, adoption }) => (
              <tr key={story.id} className="transition hover:bg-zinc-900/50">
                <td className="max-w-[420px] px-3 py-2">
                  {/* Action first, persona as a trailing chip (lib/storyText.ts) — the "As a
                      {persona}," frame would otherwise open every row of this table. */}
                  <Link href={`/global/${story.id}`} className="font-medium hover:text-emerald-300">
                    {stripPersonaPrefix(story.title)}
                  </Link>
                  <PersonaChip persona={parseStoryPersona(story.title).persona} className="ml-1.5" />
                </td>
                <td className="hidden px-3 py-2 font-mono tabular-nums text-zinc-400 sm:table-cell">{story.arenaCount}</td>
                <td className="hidden px-3 py-2 font-mono tabular-nums text-zinc-400 sm:table-cell">
                  {adoption.adopters}/{adoption.total}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {/* Tiny meter, same visual family as ScoreBar: emerald fill on a zinc track. */}
                    <div aria-hidden className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${adoption.pct}%` }} />
                    </div>
                    <span className="font-mono text-xs tabular-nums text-zinc-300">
                      {Number.isInteger(adoption.pct) ? adoption.pct : adoption.pct.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-500">
        Verdicts are judged per arena against public evidence (see{' '}
        <Link href="/methodology" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
          methodology
        </Link>
        ), so &ldquo;adoption&rdquo; here means &ldquo;we found evidence it works&rdquo;, not a
        vendor claim.
      </p>
    </div>
  )
}
