// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  WATCHLIST_KEY,
  mergeWatchlists,
  parseWatchlist,
  readWatchlistRaw,
  resetWatchlistSyncForTests,
  syncWatchlistFromServer,
  toggleWatchlistId,
  writeWatchlist,
} from '@/lib/watchlist'

describe('parseWatchlist', () => {
  it('parses a stored JSON array of ids', () => {
    expect(parseWatchlist('["supabase","linear"]')).toEqual(['supabase', 'linear'])
  })

  it('degrades anything malformed to an empty list', () => {
    expect(parseWatchlist(null)).toEqual([])
    expect(parseWatchlist('')).toEqual([])
    expect(parseWatchlist('not json')).toEqual([])
    expect(parseWatchlist('{"a":1}')).toEqual([])
  })

  it('drops non-string/empty members and dedupes', () => {
    expect(parseWatchlist('["a",1,null,"","a","b"]')).toEqual(['a', 'b'])
  })
})

describe('toggleWatchlistId', () => {
  it('adds when absent, removes when present, without mutating the input', () => {
    const ids = ['a']
    expect(toggleWatchlistId(ids, 'b')).toEqual(['a', 'b'])
    expect(toggleWatchlistId(ids, 'a')).toEqual([])
    expect(ids).toEqual(['a'])
  })
})

describe('mergeWatchlists', () => {
  it('unions with the account list first, local-only stars appended, no dupes', () => {
    expect(mergeWatchlists(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c'])
    expect(mergeWatchlists([], ['x'])).toEqual(['x'])
    expect(mergeWatchlists(['x'], [])).toEqual(['x'])
    expect(mergeWatchlists([], [])).toEqual([])
  })
})

// This jsdom ships without a working window.localStorage (Node's experimental webstorage global
// shadows jsdom's) — same in-memory stand-in as components/__tests__/WatchButton.test.tsx.
function stubLocalStorage() {
  const store = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  })
}

const jsonOk = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })

describe('account sync (syncWatchlistFromServer / write push-through)', () => {
  beforeEach(() => {
    stubLocalStorage()
    resetWatchlistSyncForTests()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('merges the account list into localStorage and uploads local-only stars', async () => {
    window.localStorage.setItem(WATCHLIST_KEY, '["local-only","shared"]')
    const fetchMock = vi.fn().mockResolvedValue(jsonOk({ ok: true, ids: ['shared', 'server-only'] }))
    vi.stubGlobal('fetch', fetchMock)

    await syncWatchlistFromServer()

    expect(parseWatchlist(readWatchlistRaw())).toEqual(['shared', 'server-only', 'local-only'])
    // GET, then the union PUT (local had a star the account was missing)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [putUrl, putInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(putUrl).toBe('/productarena/api/watchlist')
    expect(putInit.method).toBe('PUT')
    expect(JSON.parse(String(putInit.body))).toEqual({ ids: ['shared', 'server-only', 'local-only'] })
  })

  it('after a successful sync, every local write pushes to the account; before it, none do', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonOk({ ok: true, ids: [] }))
    vi.stubGlobal('fetch', fetchMock)

    writeWatchlist(['pre-sync']) // sync not confirmed yet — stays device-local
    expect(fetchMock).not.toHaveBeenCalled()

    await syncWatchlistFromServer() // GET [] , local ['pre-sync'] → union PUT
    const putsAfterSync = fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'PUT')
    expect(putsAfterSync).toHaveLength(1)

    writeWatchlist(['pre-sync', 'starred-later'])
    const puts = fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'PUT')
    expect(puts).toHaveLength(2)
    expect(JSON.parse(String((puts[1][1] as RequestInit).body))).toEqual({ ids: ['pre-sync', 'starred-later'] })
  })

  it('does nothing on 401/404/network failure or a junk payload — the list stays device-local', async () => {
    window.localStorage.setItem(WATCHLIST_KEY, '["mine"]')
    for (const impl of [
      vi.fn().mockResolvedValue(new Response('{"error":"no session"}', { status: 401 })),
      vi.fn().mockResolvedValue(new Response('nope', { status: 404 })),
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
      vi.fn().mockResolvedValue(jsonOk({ ok: true })), // no ids array
    ]) {
      resetWatchlistSyncForTests()
      vi.stubGlobal('fetch', impl)
      await syncWatchlistFromServer()
      expect(parseWatchlist(readWatchlistRaw())).toEqual(['mine'])
      writeWatchlist(['mine', 'more'])
      expect(impl.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'PUT')).toHaveLength(0)
      window.localStorage.setItem(WATCHLIST_KEY, '["mine"]')
    }
  })

  it('skips the PUT entirely when local and account already agree', async () => {
    window.localStorage.setItem(WATCHLIST_KEY, '["a","b"]')
    const fetchMock = vi.fn().mockResolvedValue(jsonOk({ ok: true, ids: ['a', 'b'] }))
    vi.stubGlobal('fetch', fetchMock)
    await syncWatchlistFromServer()
    expect(fetchMock).toHaveBeenCalledTimes(1) // just the GET
    expect(parseWatchlist(readWatchlistRaw())).toEqual(['a', 'b'])
  })
})
