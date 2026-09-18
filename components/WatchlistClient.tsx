'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import ProductLogoView from '@/components/ProductLogoView'
import Sparkline from '@/components/Sparkline'
import WatchButton, { useWatchlist } from '@/components/WatchButton'
import { seriesFor } from '@/lib/scoreTrend'
import type { WatchlistProduct } from '@/lib/watchlist'

// The client half of /watchlist: reads starred ids from localStorage (via useWatchlist) and
// renders the matching rows from the lean pre-serialized all-products prop the static page
// ships (see app/watchlist/page.tsx). Server-rendered HTML always shows the empty state ('[]'
// server snapshot) and fills in after hydration — the honest render for device-local data.

// Plain-English definitions for the two score labels — the same wording the ranking tables use.
const SCORE_LABEL_TITLES: Record<string, string> = {
  'PA Score': 'PA Score (0–100): the site\'s blended headline score — mostly agent-readiness and API quality, plus openness and built-in AI',
  'Agent-ready': 'Agent-ready (0–100): how easily an outside AI agent or assistant can connect to and operate this product',
}

function ScoreCell({ label, value, values }: { label: string; value: number | null; values: number[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-widest text-zinc-400" title={SCORE_LABEL_TITLES[label]}>{label}</span>
      <span className="font-mono text-sm tabular-nums text-zinc-200">
        {/* N/100 with dimmed /100 — same convention as every other score cell on the site. */}
        {value === null ? <span className="italic text-zinc-500">n/a</span> : <>{value.toFixed(0)}<span className="text-zinc-600">/100</span></>}
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
          Your watchlist is saved to your account (and cached in this browser); if the sync
          service is unreachable it quietly stays device-local until it isn&rsquo;t.
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
              <ProductLogoView product={{ id: p.id, name: p.name }} size={32} hasLogo={p.hasLogo} />
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
                <ScoreCell label="PA Score" value={p.aiEra} values={seriesFor(entries, 'aiEra').map((pt) => pt.value)} />
                <ScoreCell label="Agent-ready" value={p.agentReady} values={seriesFor(entries, 'agentReady').map((pt) => pt.value)} />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
