// Unit tests for the worker's compare-popularity counter and the keyless
// GET /api/popular-compares endpoint — mock KV injected the same way mcp-probe.test.ts injects
// fetch (no network, no Workers runtime). Privacy invariant: only `pair:` keys and counts ever
// touch KV.
import { describe, expect, it } from 'vitest'
import { bumpComparePairs, comparePairKeys, handlePopularCompares, normalizeCompareIds } from '../worker.js'

interface MockKv {
  store: Map<string, string>
  get: (key: string) => Promise<string | null>
  put: (key: string, value: string) => Promise<void>
  list: (opts: { prefix: string; limit?: number }) => Promise<{ keys: Array<{ name: string }> }>
}

function mockKv(initial: Record<string, string> = {}): MockKv {
  const store = new Map(Object.entries(initial))
  return {
    store,
    get: async (key) => store.get(key) ?? null,
    put: async (key, value) => {
      store.set(key, value)
    },
    list: async ({ prefix, limit = 1000 }) => ({
      keys: [...store.keys()].filter((k) => k.startsWith(prefix)).slice(0, limit).map((name) => ({ name })),
    }),
  }
}

const get = (path = '/productarena/api/popular-compares', method = 'GET') =>
  new Request(`https://ultrametric.ai${path}`, { method })

describe('normalizeCompareIds', () => {
  it('lowercases, trims, dedupes, sorts, and drops junk ids', () => {
    expect(normalizeCompareIds(' Stripe ,adyen,stripe,../etc/passwd,UPPER-case')).toEqual([
      'adyen', 'stripe', 'upper-case',
    ])
  })

  it('returns [] for fewer than two valid ids', () => {
    expect(normalizeCompareIds('stripe')).toEqual([])
    expect(normalizeCompareIds('!!!,???')).toEqual([])
    expect(normalizeCompareIds(undefined as unknown as string)).toEqual([])
  })

  it('caps the number of counted ids (keyspace guard)', () => {
    const many = Array.from({ length: 12 }, (_, i) => `p${i}`).join(',')
    expect(normalizeCompareIds(many)).toHaveLength(6)
  })

  it('rejects overlong ids (key-length cap)', () => {
    expect(normalizeCompareIds(`${'a'.repeat(65)},stripe`)).toEqual([])
  })
})

describe('comparePairKeys', () => {
  it('emits every unordered pair, normalized', () => {
    expect(comparePairKeys('linear,jira')).toEqual(['pair:jira|linear'])
    expect(comparePairKeys('c,a,b')).toEqual(['pair:a|b', 'pair:a|c', 'pair:b|c'])
  })
})

describe('bumpComparePairs', () => {
  it('increments existing counters and creates missing ones', async () => {
    const kv = mockKv({ 'pair:adyen|stripe': '4' })
    await bumpComparePairs(kv, 'stripe,adyen,paypal')
    expect(kv.store.get('pair:adyen|stripe')).toBe('5')
    expect(kv.store.get('pair:adyen|paypal')).toBe('1')
    expect(kv.store.get('pair:paypal|stripe')).toBe('1')
    // Privacy invariant: nothing but pair keys is ever written.
    expect([...kv.store.keys()].every((k) => k.startsWith('pair:'))).toBe(true)
  })

  it('no-ops without a KV binding or a usable selection', async () => {
    await expect(bumpComparePairs(undefined, 'a,b')).resolves.toBeUndefined()
    const kv = mockKv()
    await bumpComparePairs(kv, 'only-one')
    expect(kv.store.size).toBe(0)
  })
})

describe('handlePopularCompares', () => {
  it('returns 503 without a KV binding (client renders nothing — honest empty)', async () => {
    const resp = await handlePopularCompares(get(), undefined)
    expect(resp.status).toBe(503)
  })

  it('handles OPTIONS and rejects non-GET', async () => {
    const kv = mockKv()
    expect((await handlePopularCompares(get(undefined, 'OPTIONS'), kv)).status).toBe(204)
    expect((await handlePopularCompares(get(undefined, 'POST'), kv)).status).toBe(405)
  })

  it('returns pairs sorted by count and serves the 5-minute per-isolate cache', async () => {
    const kv = mockKv({
      'pair:jira|linear': '7',
      'pair:adyen|stripe': '12',
      'pair:firebase|supabase': '3',
      'pair:broken|': '9', // malformed key — filtered out
    })
    const resp = await handlePopularCompares(get(), kv)
    expect(resp.status).toBe(200)
    expect(resp.headers.get('cache-control')).toBe('public, max-age=300')
    const body = (await resp.json()) as { ok: boolean; pairs: Array<{ a: string; b: string; count: number }> }
    expect(body.ok).toBe(true)
    expect(body.pairs.map((p) => [p.a, p.b, p.count])).toEqual([
      ['adyen', 'stripe', 12],
      ['jira', 'linear', 7],
      ['firebase', 'supabase', 3],
    ])

    // New writes inside the TTL don't change the served body (per-isolate cache).
    await kv.put('pair:codex|cursor', '99')
    const cached = await handlePopularCompares(get(), kv)
    const cachedBody = (await cached.json()) as { pairs: unknown[] }
    expect(cachedBody.pairs).toHaveLength(3)
  })
})
