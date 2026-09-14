import type { Metadata } from 'next'
import WatchlistClient from '@/components/WatchlistClient'
import WatchlistGate from '@/components/WatchlistGate'
import { loadAll } from '@/lib/data'
import { loadScoreHistory } from '@/lib/scoreHistory'
import type { WatchlistProduct } from '@/lib/watchlist'

// Static shell + client list: the page pre-serializes ONE lean row per product in every arena
// (id/name/arena/scores/history — see lib/watchlist.ts's WatchlistProduct doc), and
// components/WatchlistClient.tsx filters it against the starred ids in this browser's
// localStorage. No per-user build output — the whole list ships to everyone, the star selection
// stays on the device. WatchlistGate (WorkOS session, lib/session.ts) decides client-side who sees
// the list: logged-in readers get it, anonymous readers get a log-in prompt — the page itself
// stays open (no notFound) but is left out of app/sitemap.ts, since the content is session-gated.

export const metadata: Metadata = {
  title: 'Watchlist — ProductArena',
  description: 'Products you starred across every arena, with current scores and 30-day trends. Saved on this device.',
}

function buildWatchlistProducts(): WatchlistProduct[] {
  const rows: WatchlistProduct[] = []
  for (const data of loadAll()) {
    const history = loadScoreHistory(data.category.id)
    const productById = new Map(data.products.map((p) => [p.id, p]))
    for (const entry of data.rankings.leaderboard) {
      const product = productById.get(entry.productId)
      if (!product) continue
      rows.push({
        id: product.id,
        name: product.name,
        arenaId: data.category.id,
        arenaName: data.category.name,
        aiEra: entry.aiEra,
        agentReady: entry.agentReady,
        history: (history.get(product.id) ?? []).map(({ date, aiEra, agentReady }) => ({ date, aiEra, agentReady })),
      })
    }
  }
  return rows
}

export default function WatchlistPage() {
  const products = buildWatchlistProducts()
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display leading-[1.1] text-3xl font-bold tracking-tight">Watchlist</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Products you starred (☆ → ★) anywhere on ProductArena, with their current scores and
          score trend. Saved on this device.
        </p>
      </div>

      <WatchlistGate>
        <WatchlistClient products={products} />
      </WatchlistGate>
    </div>
  )
}
