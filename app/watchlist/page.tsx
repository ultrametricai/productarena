import type { Metadata } from 'next'
import WatchlistClient from '@/components/WatchlistClient'
import { loadAll } from '@/lib/data'
import { loadScoreHistory } from '@/lib/scoreHistory'
import type { WatchlistProduct } from '@/lib/watchlist'

// Static shell + client list: the page pre-serializes ONE lean row per product in every arena
// (id/name/arena/scores/history — see lib/watchlist.ts's WatchlistProduct doc), and
// components/WatchlistClient.tsx filters it against the starred ids in this browser's
// localStorage. No per-user build output — the whole list ships to everyone, the star selection
// stays on the device.

export const metadata: Metadata = {
  title: 'Watchlist — ProductArena',
  description: 'Products you starred across every arena, with current scores and 30-day trends. Stored in your browser.',
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
          score trend. Device-local: stored in this browser, never sent to a server.
        </p>
      </div>

      <WatchlistClient products={products} />

      <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/5 p-4">
        <p className="text-sm font-medium text-emerald-200/90">
          Want alerts when a verdict flips or a score moves?
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Watchlist alerts are coming soon — they&rsquo;re not built yet, and today this list lives
          only on this device. Create an Ultrametric account to be ready when they land.
        </p>
        <a
          href="https://app.ultrametric.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-lg border border-emerald-400/60 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-400/10"
        >
          Create an Ultrametric account ↗
        </a>
      </div>
    </div>
  )
}
