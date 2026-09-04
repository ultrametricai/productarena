import type { Metadata } from 'next'
import Link from 'next/link'
import AiEraBadge from '@/components/AiEraBadge'
import MegaTable from '@/components/MegaTable'
import ProductLogo from '@/components/ProductLogo'
import { battleSlug, leadingBattle, loadAll } from '@/lib/data'
import { buildMegaTableArenaOptions, buildMegaTableRows } from '@/lib/megaTable'

export const metadata: Metadata = {
  title: 'ProductArena — which software is most AI-friendly?',
  description:
    "One sortable table across every arena: every product judged on AGENTREADYNESS (can an agent reach it?), AGENTIC (does it act agentically for humans?), API quality, and popularity. No opinion, every score traces back to cited evidence.",
}

export default function Home() {
  const categories = loadAll()
  const megaRows = buildMegaTableRows(categories)
  const arenaOptions = buildMegaTableArenaOptions(categories)

  return (
    <div className="space-y-12">
      <section>
        {/* The homepage IS the table — no hero copy; the page title/description carry the
            positioning for search/social, and /methodology carries the full story. */}
        <h1 className="sr-only">ProductArena — evidence-based software rankings for the AI era</h1>
        <MegaTable rows={megaRows} arenas={arenaOptions} />
      </section>

      <section>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">Arenas</h2>
        <p className="mt-1 text-sm text-zinc-500">Pick an arena to see the full head-to-head leaderboard.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((data) => {
            const { leaderboard } = data.rankings
            const leaderEntry = leaderboard[0]
            const leader = data.products.find((p) => p.id === leaderEntry.productId)!
            return (
              <Link
                key={data.category.id}
                href={`/arena/${data.category.id}`}
                className="group rounded-xl border border-zinc-800 p-4 transition hover:border-emerald-400/60"
              >
                <div className="flex -space-x-3">
                  {data.products.slice(0, 5).map((p) => (
                    <div key={p.id} className="rounded-lg ring-2 ring-zinc-950">
                      <ProductLogo product={p} size={28} />
                    </div>
                  ))}
                </div>
                <h3 className="font-display leading-[1.1] mt-3 text-base font-semibold group-hover:text-emerald-300">
                  {data.category.name}
                </h3>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400">Arena Score leader</p>
                    <p className="truncate text-sm font-medium">{leader.name}</p>
                  </div>
                  <AiEraBadge value={leaderEntry.aiEra} size="sm" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">Leading battles</h2>
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
                className="group rounded-xl border border-zinc-800 p-4 transition hover:border-emerald-400/60"
              >
                <p className="text-xs uppercase tracking-widest text-zinc-400">{data.category.name}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ProductLogo product={a} size={28} />
                    <span className="text-sm font-medium group-hover:text-emerald-300">{a.name}</span>
                  </div>
                  <AiEraBadge value={aEntry.aiEra} size="sm" />
                </div>
                <p className="my-1 text-center text-[10px] uppercase tracking-widest text-zinc-500">vs</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ProductLogo product={b} size={28} />
                    <span className="text-sm font-medium group-hover:text-emerald-300">{b.name}</span>
                  </div>
                  <AiEraBadge value={bEntry.aiEra} size="sm" />
                </div>
                <p className="mt-3 text-center text-xs text-emerald-300">
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
