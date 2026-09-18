// Watchlist primitives — the ☆/★ star (components/WatchButton.tsx) and /watchlist page persist
// starred product ids to localStorage under one key, and, for logged-in readers, sync them to
// the account via the worker's session-gated GET/PUT /productarena/api/watchlist (see
// infra/cloudflare-proxy/worker.js "Watchlist API"). localStorage stays the source the UI reads
// (instant, offline-safe); the server copy makes the list follow the account across devices.
// The sync is strictly additive and fail-open: anonymous readers, the vercel.app origin (no
// worker), or any network/storage failure just leave the list device-local.
// Pure helpers (parse/toggle/merge) are separated from the browser bits so they're unit-testable.

export const WATCHLIST_KEY = 'pa-watchlist'

// Same-origin path to the worker route (like lib/session.ts's AUTH_BASE — the cookie flows with
// no CORS at all; on origins without the worker the fetch 404s and sync stays off).
export const WATCHLIST_API = '/productarena/api/watchlist'

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

// First-sync merge: the union, account list first (it is the cross-device source of truth for
// ordering), then any local-only stars appended. Never drops a star from either side — an
// unstar only propagates through an explicit toggle while synced, so a stale device can't
// silently erase the account list.
export function mergeWatchlists(server: string[], local: string[]): string[] {
  return [...new Set([...server, ...local])]
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
  if (serverSync) pushWatchlist(ids)
}

// True once syncWatchlistFromServer has confirmed the account store answers — only then do
// local writes also PUT (an anonymous reader's stars never leave the device).
let serverSync = false

export function resetWatchlistSyncForTests(): void {
  serverSync = false
}

// Fire-and-forget PUT of the full list. Local state is already right; if this write is lost
// (offline, rate limit) the next sync's merge repairs the server copy.
function pushWatchlist(ids: string[]): void {
  void fetch(WATCHLIST_API, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids }),
  }).catch(() => {})
}

// One-shot account sync, called by lib/session.ts when /auth/me answers 'authenticated':
// GET the account list, merge with local (union — see mergeWatchlists), write the result both
// ways as needed, and switch writeWatchlist into push-through mode. Any non-200 or thrown fetch
// leaves everything device-local — logged-out and worker-less origins hit that path daily, so
// it is silent by design.
export async function syncWatchlistFromServer(): Promise<void> {
  let server: string[]
  try {
    const res = await fetch(WATCHLIST_API, { credentials: 'include' })
    if (!res.ok) return
    const payload: unknown = await res.json()
    const ids = (payload as { ids?: unknown } | null)?.ids
    if (!Array.isArray(ids)) return
    server = [...new Set(ids.filter((id): id is string => typeof id === 'string' && id !== ''))]
  } catch {
    return
  }
  serverSync = true
  const local = parseWatchlist(readWatchlistRaw())
  const merged = mergeWatchlists(server, local)
  if (JSON.stringify(merged) !== JSON.stringify(local)) {
    writeWatchlist(merged) // updates the UI everywhere and (serverSync) pushes the union up
  } else if (merged.length !== server.length) {
    pushWatchlist(merged) // local already complete but the account is missing stars — upload
  }
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
  // Resolved server-side (lib/logos.ts is fs-backed) so the client row can render the logo.
  hasLogo: boolean
  arenaId: string
  arenaName: string
  aiEra: number | null
  agentReady: number | null
  history: Array<{ date: string; aiEra: number | null; agentReady: number | null }>
}
