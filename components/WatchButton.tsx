'use client'

import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { takePendingAction, useSignupGate } from '@/components/SignupGate'
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
// Signup gate (founder 2026-09-23, components/SignupGate.tsx): the star renders for EVERYONE —
// anonymous clicks open the "sign up or log in to record this" modal with a deep link back to
// this page, and the stashed intent applies automatically on return. (Previously the star was
// hidden for anonymous readers entirely; showing it and gating the write converts better and
// sets expectations in the tooltip.)

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
  const { requireAuth, modal, session } = useSignupGate()
  const watched = ids.includes(productId)
  const name = productName ?? productId

  // Post-login return: apply the star the reader clicked before they were sent to sign up.
  useEffect(() => {
    if (session.state !== 'authenticated' || watched) return
    if (takePendingAction({ kind: 'watch', productId })) {
      writeWatchlist(toggleWatchlistId(parseWatchlist(readWatchlistRaw()), productId))
    }
  }, [session.state, productId, watched])

  const label =
    session.state === 'authenticated'
      ? watched
        ? `Unwatch ${name} — remove from your watchlist`
        : `Watch ${name} — add to your watchlist`
      : `Watch ${name} — sign up or log in to record it (you'll come straight back here)`
  return (
    <>
      <button
        type="button"
        aria-pressed={watched}
        onClick={() =>
          requireAuth(
            () => writeWatchlist(toggleWatchlistId(parseWatchlist(readWatchlistRaw()), productId)),
            { kind: 'watch', productId },
          )
        }
        title={label}
        className={`shrink-0 leading-none transition ${size === 'sm' ? 'text-sm' : 'text-xl'} ${
          watched ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-500 hover:text-emerald-300'
        } ${className}`}
      >
        <span aria-hidden>{watched ? '★' : '☆'}</span>
        <span className="sr-only">{label}</span>
      </button>
      {modal}
    </>
  )
}
