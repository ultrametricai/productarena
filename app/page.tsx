import type { Metadata } from 'next'
import Link from 'next/link'
import AgenticBadge from '@/components/AgenticBadge'
import AgenticIndexTable from '@/components/AgenticIndexTable'
import AiEraBadge from '@/components/AiEraBadge'
import AiNativeIndexTable from '@/components/AiNativeIndexTable'
import ProductLogo from '@/components/ProductLogo'
import ScoreBar from '@/components/ScoreBar'
import { loadAll } from '@/lib/data'

export const metadata: Metadata = {
  title: 'INIT — which products are most AI-friendly?',
  description:
    "Two evidence-graded rankings across every arena: most agentic (best for AI agents — sorted by agent-ready) and most AI-native (best for humans working with AI — sorted by agentic-app). No opinion, every score traces back to cited evidence.",
}

const RANKINGS_PREVIEW_LIMIT = 12

export default function Home() {
  const categories = loadAll()
  const totalProducts = categories.reduce((sum, data) => sum + data.products.length, 0)

  return (
    <div className="space-y-12">
      <section>
        <p className="text-sm uppercase tracking-widest text-amber-400">INIT</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">The Agentic Index</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          All {totalProducts} products across {categories.length} arenas, ranked two ways: how friendly they are to
          AI agents, and how AI-native they are for the humans using them — identical canonical stories, identical
          judge, identical evidence rules.
        </p>
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
                    <p className="text-xs uppercase tracking-widest text-zinc-600">INIT Score leader</p>
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

      <section>
        <h2 className="text-xl font-semibold tracking-tight">Global rankings</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Every product, every arena, ranked two ways — top {RANKINGS_PREVIEW_LIMIT} shown below; each has a full
          {` ${totalProducts}`}-row ranking.
        </p>

        <div id="most-agentic" className="mt-6">
          <h3 className="text-lg font-semibold tracking-tight">Most agentic — best for AI agents</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Ranked by AGENTREADYNESS: can an agent reach the product at all (API/CLI/MCP/webhooks/SDKs/docs)?
          </p>
          <div className="mt-4">
            <AgenticIndexTable categories={categories} limit={RANKINGS_PREVIEW_LIMIT} />
          </div>
          <Link
            href="/rankings/agentic"
            className="mt-2 inline-block text-sm text-amber-400 underline decoration-amber-400/40 hover:text-amber-300"
          >
            Full ranking →
          </Link>
        </div>

        <div id="most-ai-native" className="mt-8">
          <h3 className="text-lg font-semibold tracking-tight">Most AI-native — best for humans working with AI</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Ranked by AGENTIC: does the product act agentically on its own behalf (built-in assistant, autonomous
            automation, natural-language commands)?
          </p>
          <div className="mt-4">
            <AiNativeIndexTable categories={categories} limit={RANKINGS_PREVIEW_LIMIT} />
          </div>
          <Link
            href="/rankings/ai-native"
            className="mt-2 inline-block text-sm text-amber-400 underline decoration-amber-400/40 hover:text-amber-300"
          >
            Full ranking →
          </Link>
        </div>
      </section>
    </div>
  )
}
