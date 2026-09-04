'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import Sparkline from '@/components/Sparkline'
import WatchButton, { useWatchlist } from '@/components/WatchButton'
import { seriesFor } from '@/lib/scoreTrend'
import type { WatchlistProduct } from '@/lib/watchlist'

// The client half of /watchlist: reads starred ids from localStorage (via useWatchlist) and
// renders the matching rows from the lean pre-serialized all-products prop the static page
// ships (see app/watchlist/page.tsx). Server-rendered HTML always shows the empty state ('[]'
// server snapshot) and fills in after hydration — the honest render for device-local data.

function ScoreCell({ label, value, values }: { label: string; value: number | null; values: number[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-widest text-zinc-400">{label}</span>
      <span className="font-mono text-sm tabular-nums text-zinc-200">
        {value === null ? <span className="text-zinc-500">n/a</span> : value.toFixed(0)}
      </span>
      <Sparkline values={values} width={72} height={20} />
    </div>
  )
}

export default function WatchlistClient({ products }: { products: WatchlistProduct[] }) {
  const ids = useWatchlist()
  const watched = useMemo(() => products.filter((p) => ids.includes(p.id)), [products, ids])

  if (watched.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-400">
        <p>
          <span aria-hidden className="mr-2 text-zinc-500">☆</span>
          Nothing watched yet. Tap the star next to any product — on its page or in the home
          table — and it&rsquo;ll be pinned here with its current scores and trend.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Your watchlist is stored in this browser only (localStorage) — it doesn&rsquo;t follow you
          across devices.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {watched.map((p) => {
        // seriesFor accepts full ScoreHistoryEntry rows; WatchlistProduct.history is the same
        // shape minus productId, so re-attach it.
        const entries = p.history.map((h) => ({ ...h, productId: p.id }))
        return (
          <li key={`${p.arenaId}/${p.id}`} className="rounded-xl border border-zinc-800 p-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <WatchButton productId={p.id} productName={p.name} />
              <div className="min-w-0 flex-1">
                <Link href={`/arena/${p.arenaId}/product/${p.id}`} className="font-medium hover:text-emerald-300">
                  {p.name}
                </Link>
                <p className="text-xs text-zinc-500">
                  <Link href={`/arena/${p.arenaId}`} className="hover:text-emerald-300">
                    {p.arenaName}
                  </Link>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <ScoreCell label="Arena Score" value={p.aiEra} values={seriesFor(entries, 'aiEra').map((pt) => pt.value)} />
                <ScoreCell label="Agent-ready" value={p.agentReady} values={seriesFor(entries, 'agentReady').map((pt) => pt.value)} />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
