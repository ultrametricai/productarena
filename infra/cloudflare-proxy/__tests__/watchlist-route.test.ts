// Unit tests for the worker's session-gated GET/PUT /productarena/api/watchlist route and its
// pure id normalizer — fake in-memory KV, cookies minted with the same createSessionCookieValue
// the auth routes use (no network, no worker runtime; same pattern as auth.test.ts).
import { describe, expect, it } from 'vitest'
import {
  createSessionCookieValue,
  handleAuth,
  handleWatchlist,
  normalizeWatchlistIds,
} from '../worker.js'

const KEY = 'test-session-key-0123456789abcdef'

function fakeKv() {
  const store = new Map<string, string>()
  return {
    store,
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => {
      store.set(k, v)
    },
  }
}

const cookieFor = async (sub = 'user_01ABC', email = 'founder@ultrametric.ai') =>
  `pa_session=${await createSessionCookieValue(KEY, { sub, email, sid: undefined })}`

const call = (
  method: string,
  opts: { cookie?: string; body?: unknown; env?: object; origin?: string } = {},
) =>
  handleWatchlist(
    new Request(`${opts.origin ?? 'https://ultrametric.ai'}/productarena/api/watchlist`, {
      method,
      headers: {
        ...(opts.cookie ? { cookie: opts.cookie } : {}),
        ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    }),
    opts.env,
  ) as Promise<Response>

describe('normalizeWatchlistIds', () => {
  it('returns null for anything that is not an array (the 400 case)', () => {
    expect(normalizeWatchlistIds(undefined)).toBeNull()
    expect(normalizeWatchlistIds('supabase')).toBeNull()
    expect(normalizeWatchlistIds({ ids: [] })).toBeNull()
  })

  it('keeps slug-shaped ids, lowercases/trims, dedupes, drops junk members', () => {
    expect(normalizeWatchlistIds([' Supabase ', 'linear', 'supabase', 42, null, '', 'evil/../path', 'checkout-com'])).toEqual([
      'supabase',
      'linear',
      'checkout-com',
    ])
  })

  it('caps the list at 500 ids', () => {
    const many = Array.from({ length: 600 }, (_, i) => `product-${i}`)
    expect(normalizeWatchlistIds(many)).toHaveLength(500)
  })
})

describe('/api/watchlist auth gate', () => {
  it('401s with no cookie, a tampered cookie, and a sub-less cookie', async () => {
    const kv = fakeKv()
    const env = { PA_SESSION_KEY: KEY, PA_COMPARE_STATS: kv }
    expect((await call('GET', { env })).status).toBe(401)
    const wrongKey = `pa_session=${await createSessionCookieValue('the-wrong-key', { sub: 'u', email: 'a@b.co', sid: undefined })}`
    expect((await call('GET', { cookie: wrongKey, env })).status).toBe(401)
    // Correctly signed but without a usable user id — nothing to key the storage on.
    expect((await call('GET', { cookie: await cookieFor(''), env })).status).toBe(401)
  })

  it('fails closed (500, explicit message) when PA_SESSION_KEY is missing', async () => {
    const res = await call('GET', { env: { PA_COMPARE_STATS: fakeKv() } })
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/auth not configured.*PA_SESSION_KEY/)
  })

  it('503s when no KV binding is available', async () => {
    const res = await call('GET', { cookie: await cookieFor(), env: { PA_SESSION_KEY: KEY } })
    expect(res.status).toBe(503)
  })

  it('rejects methods other than GET/PUT', async () => {
    const env = { PA_SESSION_KEY: KEY, PA_COMPARE_STATS: fakeKv() }
    for (const method of ['POST', 'DELETE']) {
      const res = await call(method, { cookie: await cookieFor(), env })
      expect(res.status).toBe(405)
      expect(res.headers.get('allow')).toBe('GET, PUT')
    }
  })
})

describe('/api/watchlist storage', () => {
  it('GET starts empty, PUT round-trips, and lists are per-account', async () => {
    const kv = fakeKv()
    const env = { PA_SESSION_KEY: KEY, PA_COMPARE_STATS: kv }
    const alice = await cookieFor('user_alice')
    const bob = await cookieFor('user_bob', 'bob@ultrametric.ai')

    expect(await (await call('GET', { cookie: alice, env })).json()).toEqual({ ok: true, ids: [] })

    const put = await call('PUT', { cookie: alice, env, body: { ids: ['supabase', 'linear'] } })
    expect(put.status).toBe(200)
    expect(await put.json()).toEqual({ ok: true, ids: ['supabase', 'linear'] })
    expect(kv.store.get('watchlist:user_alice')).toBe('["supabase","linear"]')

    expect(await (await call('GET', { cookie: alice, env })).json()).toEqual({ ok: true, ids: ['supabase', 'linear'] })
    // Bob's list is untouched by Alice's writes.
    expect(await (await call('GET', { cookie: bob, env })).json()).toEqual({ ok: true, ids: [] })
  })

  it('PUT normalizes junk ids and 400s when ids is not an array', async () => {
    const env = { PA_SESSION_KEY: KEY, PA_COMPARE_STATS: fakeKv() }
    const cookie = await cookieFor()
    const put = await call('PUT', { cookie, env, body: { ids: ['Linear', 'linear', 42, 'no spaces here', 'ok-id'] } })
    expect(await put.json()).toEqual({ ok: true, ids: ['linear', 'ok-id'] })
    expect((await call('PUT', { cookie, env, body: { ids: 'linear' } })).status).toBe(400)
    expect((await call('PUT', { cookie, env, body: {} })).status).toBe(400)
  })

  it('GET degrades corrupted stored values to an empty list', async () => {
    const kv = fakeKv()
    kv.store.set('watchlist:user_01ABC', 'not json at all')
    const res = await call('GET', { cookie: await cookieFor(), env: { PA_SESSION_KEY: KEY, PA_COMPARE_STATS: kv } })
    expect(await res.json()).toEqual({ ok: true, ids: [] })
  })

  it('never emits CORS headers (same-origin only)', async () => {
    const res = await call('GET', { cookie: await cookieFor(), env: { PA_SESSION_KEY: KEY, PA_COMPARE_STATS: fakeKv() } })
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
})

describe('/api/watchlist under mock auth (WORKOS_MOCK=1 on localhost)', () => {
  it('accepts the cookie the mock /auth/login mints — the full dev loop works with zero secrets', async () => {
    const kv = fakeKv()
    const env = { WORKOS_MOCK: '1', PA_COMPARE_STATS: kv }
    const login = (await handleAuth(
      new Request('http://localhost:8787/productarena/auth/login'),
      env,
    )) as Response
    const cookie = /pa_session=[^;]+/.exec(login.headers.getSetCookie().join('; '))?.[0]
    expect(cookie).toBeTruthy()

    const put = await call('PUT', { cookie, env, origin: 'http://localhost:8787', body: { ids: ['supabase'] } })
    expect(await put.json()).toEqual({ ok: true, ids: ['supabase'] })
    expect(kv.store.get('watchlist:user_mock_test')).toBe('["supabase"]')
  })

  it('a mock-signed cookie is worthless in production (different key, host guard)', async () => {
    const kv = fakeKv()
    const login = (await handleAuth(
      new Request('http://localhost:8787/productarena/auth/login'),
      { WORKOS_MOCK: '1' },
    )) as Response
    const cookie = /pa_session=[^;]+/.exec(login.headers.getSetCookie().join('; '))?.[0]
    // Production env with the real key: the mock cookie's signature does not verify.
    const res = await call('GET', { cookie, env: { PA_SESSION_KEY: KEY, PA_COMPARE_STATS: kv } })
    expect(res.status).toBe(401)
  })
})
