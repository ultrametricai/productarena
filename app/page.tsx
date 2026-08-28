import Link from 'next/link'
import AgenticBadge from '@/components/AgenticBadge'
import ProductLogo from '@/components/ProductLogo'
import ScoreBar from '@/components/ScoreBar'
import { loadAll } from '@/lib/data'

export default function Home() {
  const categories = loadAll()
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">The Arenas</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Product Arena</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Evidence-graded head-to-head rankings across categories. Pick an arena to see who wins.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((data) => {
          const { leaderboard } = data.rankings
          const leaderEntry = leaderboard[0]
          const leader = data.products.find((p) => p.id === leaderEntry.productId)!
          const agenticLeaderEntry = [...leaderboard].sort(
            (x, y) => (y.agenticness ?? -1) - (x.agenticness ?? -1),
          )[0]
          const agenticLeader = data.products.find((p) => p.id === agenticLeaderEntry.productId)!
          return (
            <Link
              key={data.category.id}
              href={`/arena/${data.category.id}`}
              className="group rounded-xl border border-zinc-800 p-5 transition hover:border-amber-400/60"
            >
              <div className="flex -space-x-3">
                {data.products.slice(0, 6).map((p) => (
                  <div key={p.id} className="rounded-lg ring-2 ring-zinc-950">
                    <ProductLogo product={p} size={40} />
                  </div>
                ))}
              </div>
              <h2 className="mt-4 text-xl font-semibold group-hover:text-amber-300">{data.category.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">{data.category.description}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-widest text-zinc-600">Leader</p>
                  <p className="font-medium">{leader.name}</p>
                </div>
                <ScoreBar score={leaderEntry.score} className="max-w-[140px]" />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-widest text-zinc-600">Most agentic</p>
                  <p className="font-medium">{agenticLeader.name}</p>
                </div>
                <AgenticBadge value={agenticLeaderEntry.agenticness} />
              </div>
              <p className="mt-4 text-xs text-zinc-600">
                {data.stories.length} stories · {data.verdicts.length} judged cells
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
