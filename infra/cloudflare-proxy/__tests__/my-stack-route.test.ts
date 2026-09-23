// Unit tests for the worker's session-gated GET/PUT /productarena/api/my-stack route and its
// pure map normalizer — the exact watchlist-route.test.ts shapes: fake in-memory KV, cookies
// minted with the same createSessionCookieValue the auth routes use (no network, no runtime).
import { describe, expect, it } from 'vitest'
import {
  createSessionCookieValue,
  handleAuth,
  handleMyStack,
  normalizeStackMap,
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
  handleMyStack(
    new Request(`${opts.origin ?? 'https://ultrametric.ai'}/productarena/api/my-stack`, {
      method,
      headers: {
        ...(opts.cookie ? { cookie: opts.cookie } : {}),
        ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    }),
    opts.env,
  ) as Promise<Response>

describe('normalizeStackMap', () => {
  it('returns null for anything that is not a plain object (the 400 case)', () => {
    expect(normalizeStackMap(undefined)).toBeNull()
    expect(normalizeStackMap('payments')).toBeNull()
    expect(normalizeStackMap(['stripe'])).toBeNull()
    expect(normalizeStackMap(null)).toBeNull()
  })

  it('accepts v2 arrays (order preserved) AND v1 single strings — both normalize to arrays', () => {
    expect(
      normalizeStackMap({
        'startup-banking': ['mercury', 'brex'],
        payments: 'stripe', // v1 shape — a stale device or old KV value
      }),
    ).toEqual({ 'startup-banking': ['mercury', 'brex'], payments: ['stripe'] })
  })

  it('keeps slug-shaped arena → product entries, lowercases/trims, drops junk members', () => {
    expect(
      normalizeStackMap({
        ' Payments ': [' Stripe ', 42, 'no spaces here', 'stripe'],
        crm: 'attio',
        payroll: 42,
        'evil/../path': ['x'],
        accounting: 'no spaces here',
        hr: [],
        '': 'y',
      }),
    ).toEqual({ payments: ['stripe'], crm: ['attio'] })
  })

  it('caps the map at 100 arenas and each arena at 8 picks', () => {
    const many = Object.fromEntries(Array.from({ length: 150 }, (_, i) => [`arena-${i}`, [`product-${i}`]]))
    expect(Object.keys(normalizeStackMap(many) as object)).toHaveLength(100)
    const fat = normalizeStackMap({ payments: Array.from({ length: 20 }, (_, i) => `p${i}`) }) as Record<string, string[]>
    expect(fat.payments).toHaveLength(8)
  })
})

describe('/api/my-stack auth gate', () => {
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

describe('/api/my-stack storage', () => {
  it('GET starts empty, PUT round-trips, and stacks are per-account under stack:<sub>', async () => {
    const kv = fakeKv()
    const env = { PA_SESSION_KEY: KEY, PA_COMPARE_STATS: kv }
    const alice = await cookieFor('user_alice')
    const bob = await cookieFor('user_bob', 'bob@ultrametric.ai')

    expect(await (await call('GET', { cookie: alice, env })).json()).toEqual({ ok: true, stack: {} })

    const put = await call('PUT', {
      cookie: alice,
      env,
      body: { stack: { 'startup-banking': ['mercury', 'brex'], crm: ['attio'] } },
    })
    expect(put.status).toBe(200)
    expect(await put.json()).toEqual({ ok: true, stack: { 'startup-banking': ['mercury', 'brex'], crm: ['attio'] } })
    expect(JSON.parse(kv.store.get('stack:user_alice') ?? '{}')).toEqual({
      'startup-banking': ['mercury', 'brex'],
      crm: ['attio'],
    })

    expect(await (await call('GET', { cookie: alice, env })).json()).toEqual({
      ok: true,
      stack: { 'startup-banking': ['mercury', 'brex'], crm: ['attio'] },
    })
    // Bob's stack is untouched by Alice's writes.
    expect(await (await call('GET', { cookie: bob, env })).json()).toEqual({ ok: true, stack: {} })
  })

  it('PUT accepts the v1 single-string shape (a stale client) and normalizes it to arrays', async () => {
    const env = { PA_SESSION_KEY: KEY, PA_COMPARE_STATS: fakeKv() }
    const put = await call('PUT', {
      cookie: await cookieFor(),
      env,
      body: { stack: { 'startup-banking': 'mercury', crm: 'attio' } },
    })
    expect(await put.json()).toEqual({ ok: true, stack: { 'startup-banking': ['mercury'], crm: ['attio'] } })
  })

  it('PUT normalizes junk entries and 400s when stack is not an object', async () => {
    const env = { PA_SESSION_KEY: KEY, PA_COMPARE_STATS: fakeKv() }
    const cookie = await cookieFor()
    const put = await call('PUT', { cookie, env, body: { stack: { Payments: 'Stripe', payroll: 42, 'bad key!': ['x'] } } })
    expect(await put.json()).toEqual({ ok: true, stack: { payments: ['stripe'] } })
    expect((await call('PUT', { cookie, env, body: { stack: ['stripe'] } })).status).toBe(400)
    expect((await call('PUT', { cookie, env, body: {} })).status).toBe(400)
  })

  it('GET migrates a stored v1 map to arrays and degrades corrupted values to an empty map', async () => {
    const kv = fakeKv()
    // A v1 value written before the multi-pick migration round-trips losslessly as arrays.
    kv.store.set('stack:user_01ABC', '{"payments":"stripe"}')
    const env = { PA_SESSION_KEY: KEY, PA_COMPARE_STATS: kv }
    expect(await (await call('GET', { cookie: await cookieFor(), env })).json()).toEqual({
      ok: true,
      stack: { payments: ['stripe'] },
    })
    kv.store.set('stack:user_01ABC', 'not json at all')
    const res = await call('GET', { cookie: await cookieFor(), env })
    expect(await res.json()).toEqual({ ok: true, stack: {} })
  })

  it('never emits CORS headers (same-origin only)', async () => {
    const res = await call('GET', { cookie: await cookieFor(), env: { PA_SESSION_KEY: KEY, PA_COMPARE_STATS: fakeKv() } })
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
})

describe('/api/my-stack under mock auth (WORKOS_MOCK=1 on localhost)', () => {
  it('accepts the cookie the mock /auth/login mints — the full dev loop works with zero secrets', async () => {
    const kv = fakeKv()
    const env = { WORKOS_MOCK: '1', PA_COMPARE_STATS: kv }
    const login = (await handleAuth(
      new Request('http://localhost:8787/productarena/auth/login'),
      env,
    )) as Response
    const cookie = /pa_session=[^;]+/.exec(login.headers.getSetCookie().join('; '))?.[0]
    expect(cookie).toBeTruthy()

    const put = await call('PUT', { cookie, env, origin: 'http://localhost:8787', body: { stack: { payroll: ['gusto'] } } })
    expect(await put.json()).toEqual({ ok: true, stack: { payroll: ['gusto'] } })
    expect(kv.store.get('stack:user_mock_test')).toBe('{"payroll":["gusto"]}')
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
