import Link from 'next/link'
import GeoMark from '@/components/GeoMark'
import ProductLogo from '@/components/ProductLogo'
import type { CategoryData } from '@/lib/data'
import { allPersonaStacks } from '@/lib/personaStacks'

// "Best by user type": one card per persona declared on this category, showing which product
// scores highest on persona-weighted coverage (see lib/personaStacks.ts) over just that
// persona's stories — an honest v1 answer to "what should a {persona} actually pick here?"
// distinct from the overall Arena-Score leaderboard, which blends every persona together.
export default function PersonaStacksSection({ data }: { data: CategoryData }) {
  const results = allPersonaStacks(data).filter((r) => r.winner !== null)
  if (results.length === 0) return null
  const productById = new Map(data.products.map((p) => [p.id, p]))

  return (
    <div>
      {/* seed "icp": same concept mark as the Explore menu's ICP lenses entry — buyer-persona
          views share one mark. */}
      <h2 className="font-display leading-[1.1] mb-1 flex items-center gap-2 text-lg font-semibold">
        <GeoMark seed="icp" title="Best by user type — persona-weighted winners" size={18} className="text-zinc-500" />
        Best by user type
      </h2>
      <p className="mb-4 text-sm text-zinc-400">
        Per persona, the product with the highest persona-weighted coverage over just that persona&apos;s stories —
        not the same ranking as the overall PA Score leaderboard above.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((r) => {
          const winner = productById.get(r.winner!.productId)!
          const runnerUp = r.runnerUp ? productById.get(r.runnerUp.productId) : null
          return (
            <div key={r.persona} className="rounded-xl border border-zinc-800 p-5">
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Best for {r.persona}</p>
              <Link
                href={`/arena/${data.category.id}/product/${winner.id}`}
                className="mt-2 flex items-center gap-3 hover:text-emerald-300"
              >
                <ProductLogo product={winner} size={32} />
                <div>
                  <p className="font-semibold">{winner.name}</p>
                  <p className="font-mono text-xs tabular-nums text-emerald-300">{r.winner!.score.toFixed(0)}/100</p>
                </div>
              </Link>
              {runnerUp && (
                <p className="mt-3 text-xs text-zinc-500">
                  Runner-up: {runnerUp.name} ({r.runnerUp!.score.toFixed(0)}/100)
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-500">
                {r.storyCount} {r.persona} {r.storyCount === 1 ? 'story' : 'stories'} scored
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
