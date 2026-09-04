// Device-local watchlist primitives — the ☆/★ star (components/WatchButton.tsx) and
// /watchlist page persist starred product ids to localStorage under one key. No account, no
// server: the list lives in this browser only (the /watchlist CTA is honest about that).
// Pure helpers (parse/toggle) are separated from the browser bits so they're unit-testable.

export const WATCHLIST_KEY = 'pa-watchlist'

// Same-tab change notifications: localStorage's native 'storage' event only fires in OTHER
// tabs, so writers also dispatch this custom event for stars/list views in the current tab.
export const WATCHLIST_EVENT = 'pa-watchlist-change'

// Tolerant parse of the stored JSON — anything malformed (hand-edited, an old format, not an
// array) degrades to an empty list rather than a crash. Dedupes and keeps only strings.
export function parseWatchlist(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter((id): id is string => typeof id === 'string' && id !== ''))]
  } catch {
    return []
  }
}

export function toggleWatchlistId(ids: string[], productId: string): string[] {
  return ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId]
}

// Raw snapshot for useSyncExternalStore (see components/WatchButton.tsx): the STRING is the
// snapshot (stable identity between writes), parsed by the consumer. '[]' on the server and in
// browsers where localStorage throws (private mode, disabled storage).
export function readWatchlistRaw(): string {
  if (typeof window === 'undefined') return '[]'
  try {
    return window.localStorage.getItem(WATCHLIST_KEY) ?? '[]'
  } catch {
    return '[]'
  }
}

export function writeWatchlist(ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids))
  } catch {
    return // storage unavailable — the toggle is a silent no-op, same as reads
  }
  window.dispatchEvent(new Event(WATCHLIST_EVENT))
}

export function subscribeWatchlist(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', callback)
  window.addEventListener(WATCHLIST_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(WATCHLIST_EVENT, callback)
  }
}

// The lean pre-serialized row /watchlist hydrates against (see app/watchlist/page.tsx): current
// headline scores plus the score history the trend sparkline draws from — deliberately no
// evidence/verdicts/claims, this crosses the server→client boundary for EVERY product.
export interface WatchlistProduct {
  id: string
  name: string
  arenaId: string
  arenaName: string
  aiEra: number | null
  agentReady: number | null
  history: Array<{ date: string; aiEra: number | null; agentReady: number | null }>
}
