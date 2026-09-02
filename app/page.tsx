import type { Metadata } from 'next'
import Link from 'next/link'
import AgenticBadge from '@/components/AgenticBadge'
import AgenticIndexTable from '@/components/AgenticIndexTable'
import AiEraBadge from '@/components/AiEraBadge'
import AiNativeIndexTable from '@/components/AiNativeIndexTable'
import InitIndexTable from '@/components/InitIndexTable'
import ProductLogo from '@/components/ProductLogo'
import ScoreBar from '@/components/ScoreBar'
import { battleSlug, leadingBattle, loadAll } from '@/lib/data'
import { REPO } from '@/lib/site'

export const metadata: Metadata = {
  title: 'INIT — which software is most AI-friendly?',
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
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Arenas</h2>
          <a
            href={`https://github.com/${REPO}/issues/new?template=request-a-product.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-amber-400 underline decoration-amber-400/40 hover:text-amber-300"
          >
            Submit a product →
          </a>
        </div>
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
                    <p className="text-xs uppercase tracking-widest text-zinc-400">INIT Score leader</p>
                    <p className="font-medium">{leader.name}</p>
                  </div>
                  <AiEraBadge value={leaderEntry.aiEra} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400">coverage</span>
                  <ScoreBar score={leaderEntry.score} className="max-w-[140px]" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-400">Most agent-ready</p>
                    <p className="font-medium">{agentReadyLeader.name}</p>
                  </div>
                  <AgenticBadge kind="agent-ready" value={agentReadyLeaderEntry.agentReady} size="sm" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-400">Most agentic</p>
                    <p className="font-medium">{agenticAppLeader.name}</p>
                  </div>
                  <AgenticBadge kind="agentic-app" value={agenticAppLeaderEntry.agenticApp} size="sm" />
                </div>
                <p className="mt-4 text-xs text-zinc-400">
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
          Every product, every arena, ranked three ways — top {RANKINGS_PREVIEW_LIMIT} shown below; each has a full
          {` ${totalProducts}`}-row ranking.
        </p>

        <div id="most-init" className="mt-6">
          <h3 className="text-lg font-semibold tracking-tight">Highest INIT Score</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Ranked by the blended INIT Score: agent-ready, API quality, openness, agentic app, and automation.
          </p>
          <div className="mt-4">
            <InitIndexTable categories={categories} limit={RANKINGS_PREVIEW_LIMIT} />
          </div>
          <Link
            href="/rankings/init"
            className="mt-2 inline-block text-sm text-amber-400 underline decoration-amber-400/40 hover:text-amber-300"
          >
            Full ranking →
          </Link>
        </div>

        <div id="most-agentic" className="mt-8">
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

      <section>
        <h2 className="text-xl font-semibold tracking-tight">Leading battles</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Every arena&rsquo;s #1 vs #2, evidence-tested round by round — see every battle on its own{' '}
          <code className="text-xs text-zinc-400">/vs/</code> page.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((data) => {
            const battle = leadingBattle(data)
            if (!battle) return null
            const a = data.products.find((p) => p.id === battle.a)!
            const b = data.products.find((p) => p.id === battle.b)!
            const aEntry = data.rankings.leaderboard.find((e) => e.productId === a.id)!
            const bEntry = data.rankings.leaderboard.find((e) => e.productId === b.id)!
            const winnerName = battle.winner === 'draw' ? null : battle.winner === a.id ? a.name : b.name
            return (
              <Link
                key={data.category.id}
                href={`/vs/${battleSlug(battle.a, battle.b)}`}
                className="group rounded-xl border border-zinc-800 p-4 transition hover:border-amber-400/60"
              >
                <p className="text-xs uppercase tracking-widest text-zinc-400">{data.category.name}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ProductLogo product={a} size={28} />
                    <span className="text-sm font-medium group-hover:text-amber-300">{a.name}</span>
                  </div>
                  <AiEraBadge value={aEntry.aiEra} size="sm" />
                </div>
                <p className="my-1 text-center text-[10px] uppercase tracking-widest text-zinc-500">vs</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ProductLogo product={b} size={28} />
                    <span className="text-sm font-medium group-hover:text-amber-300">{b.name}</span>
                  </div>
                  <AiEraBadge value={bEntry.aiEra} size="sm" />
                </div>
                <p className="mt-3 text-center text-xs text-amber-300">
                  {winnerName ? `${winnerName} wins` : 'Draw'} · {battle.record.aWins}–{battle.record.bWins}
                  {battle.record.draws > 0 ? ` (${battle.record.draws} drawn)` : ''}
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
