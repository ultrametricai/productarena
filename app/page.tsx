import Link from 'next/link'
import AgenticBadge from '@/components/AgenticBadge'
import AgenticIndexTable from '@/components/AgenticIndexTable'
import AiEraBadge from '@/components/AiEraBadge'
import ProductLogo from '@/components/ProductLogo'
import ScoreBar from '@/components/ScoreBar'
import { loadAll } from '@/lib/data'

export default function Home() {
  const categories = loadAll()
  const totalProducts = categories.reduce((sum, data) => sum + data.products.length, 0)

  return (
    <div className="space-y-12">
      <section>
        <p className="text-sm uppercase tracking-widest text-amber-400">AIness</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">The Agentic Index</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          All {totalProducts} products across {categories.length} arenas, ranked by how friendly they are to AI
          agents — identical canonical stories, identical judge, identical evidence rules.
        </p>
        <div className="mt-5">
          <AgenticIndexTable categories={categories} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">Arenas</h2>
        <p className="mt-1 text-sm text-zinc-500">Pick an arena to see the full head-to-head leaderboard.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {categories.map((data) => {
            const { leaderboard } = data.rankings
            const leaderEntry = leaderboard[0]
            const leader = data.products.find((p) => p.id === leaderEntry.productId)!
            const agentReadyLeaderEntry = [...leaderboard].sort(
              (x, y) => (y.agentReady ?? -1) - (x.agentReady ?? -1),
            )[0]
            const agentReadyLeader = data.products.find((p) => p.id === agentReadyLeaderEntry.productId)!
            const agenticAppLeaderEntry = [...leaderboard].sort(
              (x, y) => (y.agenticApp ?? -1) - (x.agenticApp ?? -1),
            )[0]
            const agenticAppLeader = data.products.find((p) => p.id === agenticAppLeaderEntry.productId)!
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
                <h3 className="mt-4 text-xl font-semibold group-hover:text-amber-300">{data.category.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{data.category.description}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-600">AI-Era leader</p>
                    <p className="font-medium">{leader.name}</p>
                  </div>
                  <AiEraBadge value={leaderEntry.aiEra} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">coverage</span>
                  <ScoreBar score={leaderEntry.score} className="max-w-[140px]" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-600">Most agent-ready</p>
                    <p className="font-medium">{agentReadyLeader.name}</p>
                  </div>
                  <AgenticBadge kind="agent-ready" value={agentReadyLeaderEntry.agentReady} size="sm" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-600">Most agentic</p>
                    <p className="font-medium">{agenticAppLeader.name}</p>
                  </div>
                  <AgenticBadge kind="agentic-app" value={agenticAppLeaderEntry.agenticApp} size="sm" />
                </div>
                <p className="mt-4 text-xs text-zinc-600">
                  {data.stories.length} stories · {data.verdicts.length} judged cells
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
