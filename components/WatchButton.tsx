'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { useSession } from '@/lib/session'
import {
  parseWatchlist, readWatchlistRaw, subscribeWatchlist, toggleWatchlistId, writeWatchlist,
} from '@/lib/watchlist'

// ☆/★ watch toggle — persists product ids to localStorage (key 'pa-watchlist', see
// lib/watchlist.ts) and, once the account sync has confirmed the worker's /api/watchlist route,
// mirrors every change to the account store too. Rendered on product page headers, in MegaTable
// rows, and on /watchlist itself. useSyncExternalStore keeps every star on the page in sync
// through one snapshot (the raw stored string), with '[]' as the server snapshot so static
// HTML always hydrates from the unstarred state.
//
// Session gate (lib/session.ts): the star only renders for logged-in readers — anonymous
// readers see the site exactly as before, no watchlist UI anywhere. Every call site keeps its
// markup and just gets an empty render until whoami answers 'authenticated'.

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
  // Hooks run unconditionally (rules of hooks); the session gate comes after.
  const ids = useWatchlist()
  const session = useSession()
  if (session.state !== 'authenticated') return null
  const watched = ids.includes(productId)
  const name = productName ?? productId
  const label = watched
    ? `Unwatch ${name} — remove from your watchlist`
    : `Watch ${name} — add to your watchlist`
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
