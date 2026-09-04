'use client'

import { useMemo, useSyncExternalStore } from 'react'
import {
  parseWatchlist, readWatchlistRaw, subscribeWatchlist, toggleWatchlistId, writeWatchlist,
} from '@/lib/watchlist'

// ☆/★ watch toggle — persists product ids to localStorage (key 'pa-watchlist', see
// lib/watchlist.ts) and nothing else: device-local, no account. Rendered on product page
// headers, in MegaTable rows, and on /watchlist itself. useSyncExternalStore keeps every star
// on the page in sync through one snapshot (the raw stored string), with '[]' as the server
// snapshot so static HTML always hydrates from the unstarred state.

function getServerSnapshot(): string {
  return '[]'
}

export function useWatchlist(): string[] {
  const raw = useSyncExternalStore(subscribeWatchlist, readWatchlistRaw, getServerSnapshot)
  return useMemo(() => parseWatchlist(raw), [raw])
}

export default function WatchButton({
  productId,
  productName,
  size = 'md',
  className = '',
}: {
  productId: string
  // For the accessible label/title — "Watch Supabase", not "Watch supabase-arena-id".
  productName?: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const ids = useWatchlist()
  const watched = ids.includes(productId)
  const name = productName ?? productId
  const label = watched
    ? `Unwatch ${name} — remove from your watchlist (stored in this browser)`
    : `Watch ${name} — add to your watchlist (stored in this browser)`
  return (
    <button
      type="button"
      aria-pressed={watched}
      onClick={() => writeWatchlist(toggleWatchlistId(parseWatchlist(readWatchlistRaw()), productId))}
      title={label}
      className={`shrink-0 leading-none transition ${size === 'sm' ? 'text-sm' : 'text-xl'} ${
        watched ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-500 hover:text-emerald-300'
      } ${className}`}
    >
      <span aria-hidden>{watched ? '★' : '☆'}</span>
      <span className="sr-only">{label}</span>
    </button>
  )
}
