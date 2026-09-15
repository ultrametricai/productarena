// Unit tests for the worker's /productarena/auth/* WorkOS AuthKit backend: cookie sign/verify
// round-trips (incl. tampering and expiry), return_to sanitization, and every route handler
// with an injectable fetch for the WorkOS code exchange (same no-network pattern as
// mcp-probe.test.ts). Runs on Node's WebCrypto — the same crypto.subtle API the worker uses.
import { describe, expect, it, vi } from 'vitest'
import {
  createSessionCookieValue,
  handleAuth,
  sanitizeReturnTo,
  sidFromAccessToken,
  verifySessionCookieValue,
} from '../worker.js'

type FetchImpl = typeof fetch

const KEY = 'test-session-key-0123456789abcdef'
const ENV = {
  WORKOS_CLIENT_ID: 'client_TEST123',
  WORKOS_API_KEY: 'sk_test_abc',
  PA_SESSION_KEY: KEY,
}

interface Claims {
  sub?: string
  email?: string
  sid?: string
  exp?: number
}

const sign = (secret: string, user: { sub: string; email: string; sid?: string }, nowMs?: number) =>
  createSessionCookieValue(secret, { sid: undefined, ...user }, nowMs) as Promise<string>
const verify = (secret: string, value: unknown, nowMs?: number) =>
  verifySessionCookieValue(secret, value, nowMs) as Promise<Claims | null>

const b64url = (s: string) => Buffer.from(s).toString('base64url')

// Mirror the worker's cookie format to craft adversarial payloads with a *valid* signature.
async function craftSigned(secret: string, claims: Record<string, unknown>): Promise<string> {
  const payload = b64url(JSON.stringify(claims))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))
  return `${payload}.${sig.toString('base64url')}`
}

const fakeJwt = (claims: Record<string, unknown>) =>
  `${b64url(JSON.stringify({ alg: 'RS256' }))}.${b64url(JSON.stringify(claims))}.${b64url('sig')}`

const authGet = (path: string, cookie?: string, env: object | undefined = ENV, fetchImpl?: FetchImpl) =>
  handleAuth(
    new Request(`https://ultrametric.ai/productarena/auth${path}`, {
      headers: cookie ? { cookie } : undefined,
    }),
    env,
    fetchImpl,
  ) as Promise<Response>

function setCookies(res: Response): string[] {
  return res.headers.getSetCookie()
}

describe('session cookie sign/verify', () => {
  it('round-trips sub/email/sid and stamps a ~30d exp', async () => {
    const now = Date.UTC(2026, 8, 14)
    const value = await sign(KEY, { sub: 'user_01ABC', email: 'founder@ultrametric.ai', sid: 'session_01XYZ' }, now)
    const claims = await verify(KEY, value, now)
    expect(claims).toMatchObject({ sub: 'user_01ABC', email: 'founder@ultrametric.ai', sid: 'session_01XYZ' })
    expect(claims?.exp).toBe(Math.floor(now / 1000) + 30 * 24 * 60 * 60)
  })

  it('rejects tampered payloads and signatures', async () => {
    const value = await sign(KEY, { sub: 'u', email: 'a@b.co' })
    const [payload, sig] = value.split('.')
    // Payload swapped for different claims, original signature kept
    expect(await verify(KEY, `${b64url(JSON.stringify({ sub: 'u', email: 'evil@b.co', exp: 9999999999 }))}.${sig}`)).toBeNull()
    // Signature flipped
    const flipped = (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1)
    expect(await verify(KEY, `${payload}.${flipped}`)).toBeNull()
    // Signed under a different key
    expect(await verify('some-other-key', value)).toBeNull()
    // Garbage shapes
    expect(await verify(KEY, 'not-a-cookie')).toBeNull()
    expect(await verify(KEY, '')).toBeNull()
    expect(await verify(KEY, null)).toBeNull()
    expect(await verify(KEY, `${payload}.${sig}.extra`)).toBeNull()
  })

  it('rejects expired cookies and exps beyond the 30d cap even when correctly signed', async () => {
    const now = Date.now()
    const value = await sign(KEY, { sub: 'u', email: 'a@b.co' }, now)
    expect(await verify(KEY, value, now + 31 * 24 * 60 * 60 * 1000)).toBeNull() // expired
    const farOut = await craftSigned(KEY, { sub: 'u', email: 'a@b.co', exp: Math.floor(now / 1000) + 60 * 24 * 60 * 60 })
    expect(await verify(KEY, farOut, now)).toBeNull() // exp cap
    const noEmail = await craftSigned(KEY, { sub: 'u', exp: Math.floor(now / 1000) + 60 })
    expect(await verify(KEY, noEmail, now)).toBeNull() // email is required
  })
})

describe('sidFromAccessToken', () => {
  it('extracts the sid claim and tolerates junk', () => {
    expect(sidFromAccessToken(fakeJwt({ sid: 'session_01XYZ', sub: 'user_01ABC' }))).toBe('session_01XYZ')
    expect(sidFromAccessToken(fakeJwt({ sub: 'user_01ABC' }))).toBeUndefined()
    expect(sidFromAccessToken('a.b')).toBeUndefined()
    expect(sidFromAccessToken(undefined)).toBeUndefined()
    expect(sidFromAccessToken('x.!!!.z')).toBeUndefined()
  })
})

describe('sanitizeReturnTo', () => {
  const HOME = 'https://ultrametric.ai/productarena'

  it('accepts ultrametric.ai paths and full URLs', () => {
    expect(sanitizeReturnTo('/productarena/arena/crm')).toBe('https://ultrametric.ai/productarena/arena/crm')
    expect(sanitizeReturnTo('https://ultrametric.ai/productarena/watchlist?x=1')).toBe(
      'https://ultrametric.ai/productarena/watchlist?x=1',
    )
  })

  it('falls back to the PA home for anything off-site or sneaky', () => {
    expect(sanitizeReturnTo('https://evil.example/phish')).toBe(HOME)
    expect(sanitizeReturnTo('//evil.example/phish')).toBe(HOME)
    expect(sanitizeReturnTo('javascript:alert(1)')).toBe(HOME)
    expect(sanitizeReturnTo('/\\evil.example')).toBe(HOME)
    expect(sanitizeReturnTo('relative/path')).toBe(HOME)
    expect(sanitizeReturnTo('')).toBe(HOME)
    expect(sanitizeReturnTo(null)).toBe(HOME)
    expect(sanitizeReturnTo('https://ultrametric.ai.evil.example/x')).toBe(HOME)
  })
})

describe('GET /auth/me', () => {
  it('returns {email} for a valid cookie', async () => {
    const cookie = await sign(KEY, { sub: 'user_01ABC', email: 'founder@ultrametric.ai', sid: 's' })
    const res = await authGet('/me', `other=1; pa_session=${cookie}`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ email: 'founder@ultrametric.ai' })
  })

  it('401s with no cookie and with a tampered cookie', async () => {
    expect((await authGet('/me')).status).toBe(401)
    const cookie = await sign('the-wrong-key', { sub: 'u', email: 'a@b.co' })
    expect((await authGet('/me', `pa_session=${cookie}`)).status).toBe(401)
  })

  it('fails closed with a clear message when PA_SESSION_KEY is missing', async () => {
    const res = await authGet('/me', undefined, { WORKOS_CLIENT_ID: 'x' })
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/auth not configured.*PA_SESSION_KEY/)
  })
})

describe('GET /auth/login', () => {
  it('302s to the WorkOS authorize URL with provider=authkit and a nonce-carrying state', async () => {
    const res = await authGet('/login?return_to=%2Fproductarena%2Farena%2Fcrm')
    expect(res.status).toBe(302)
    const location = new URL(res.headers.get('location') ?? '')
    expect(location.origin + location.pathname).toBe('https://api.workos.com/user_management/authorize')
    expect(location.searchParams.get('client_id')).toBe('client_TEST123')
    expect(location.searchParams.get('redirect_uri')).toBe('https://ultrametric.ai/productarena/auth/callback')
    expect(location.searchParams.get('response_type')).toBe('code')
    expect(location.searchParams.get('provider')).toBe('authkit')
    const state = JSON.parse(Buffer.from(location.searchParams.get('state') ?? '', 'base64url').toString())
    expect(state.r).toBe('https://ultrametric.ai/productarena/arena/crm')
    // The CSRF nonce is mirrored into the pa_state cookie
    const stateCookie = setCookies(res).find((c) => c.startsWith('pa_state='))
    expect(stateCookie).toContain(`pa_state=${state.n};`)
    expect(stateCookie).toMatch(/HttpOnly/i)
    expect(stateCookie).toMatch(/SameSite=Lax/i)
  })

  it('fails closed with a clear message when WORKOS_CLIENT_ID is missing', async () => {
    const res = await authGet('/login', undefined, { PA_SESSION_KEY: KEY })
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/auth not configured.*WORKOS_CLIENT_ID/)
  })

  it('rejects non-GET methods', async () => {
    const res = (await handleAuth(
      new Request('https://ultrametric.ai/productarena/auth/login', { method: 'POST' }),
      ENV,
    )) as Response
    expect(res.status).toBe(405)
  })
})

describe('GET /auth/callback', () => {
  const NONCE = 'test-nonce-123'
  const stateParam = (r: string, n = NONCE) => b64url(JSON.stringify({ n, r }))

  const exchangeOk = (sid?: string): FetchImpl =>
    vi.fn(async () =>
      new Response(
        JSON.stringify({
          user: { id: 'user_01ABC', email: 'founder@ultrametric.ai' },
          access_token: fakeJwt(sid ? { sid } : {}),
          refresh_token: 'rt',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    ) as unknown as FetchImpl

  it('exchanges the code, mints a verifiable pa_session, burns pa_state, and redirects to return_to', async () => {
    const fetchImpl = exchangeOk('session_01XYZ')
    const res = await authGet(
      `/callback?code=code_123&state=${stateParam('/productarena/watchlist')}`,
      `pa_state=${NONCE}`,
      ENV,
      fetchImpl,
    )
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://ultrametric.ai/productarena/watchlist')

    // The exchange hit the documented endpoint with the documented body
    const [exchangeUrl, exchangeInit] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    expect(exchangeUrl).toBe('https://api.workos.com/user_management/authenticate')
    expect(JSON.parse(String(exchangeInit.body))).toEqual({
      client_id: 'client_TEST123',
      client_secret: 'sk_test_abc',
      grant_type: 'authorization_code',
      code: 'code_123',
    })

    const cookies = setCookies(res)
    const session = cookies.find((c) => c.startsWith('pa_session='))
    expect(session).toMatch(/HttpOnly/i)
    expect(session).toMatch(/Secure/i)
    expect(session).toMatch(/SameSite=Lax/i)
    expect(session).toMatch(/Domain=ultrametric\.ai/i)
    const value = /pa_session=([^;]+)/.exec(session ?? '')?.[1]
    const claims = await verify(KEY, value)
    expect(claims).toMatchObject({ sub: 'user_01ABC', email: 'founder@ultrametric.ai', sid: 'session_01XYZ' })
    // One-time nonce cleared
    expect(cookies.find((c) => c.startsWith('pa_state='))).toMatch(/Max-Age=0/)
  })

  it('400s when the state nonce does not match the pa_state cookie (CSRF)', async () => {
    const res = await authGet(
      `/callback?code=c&state=${stateParam('/productarena', 'attacker-nonce')}`,
      `pa_state=${NONCE}`,
      ENV,
      exchangeOk(),
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/CSRF/)
    // …and when the cookie is missing entirely
    const noCookie = await authGet(`/callback?code=c&state=${stateParam('/productarena')}`, undefined, ENV, exchangeOk())
    expect(noCookie.status).toBe(400)
  })

  it('502s when the WorkOS exchange fails, without setting any cookie', async () => {
    const failing = vi.fn(async () => new Response('nope', { status: 401 })) as unknown as FetchImpl
    const res = await authGet(`/callback?code=c&state=${stateParam('/productarena')}`, `pa_state=${NONCE}`, ENV, failing)
    expect(res.status).toBe(502)
    expect((await res.json()).error).toMatch(/HTTP 401/)
    expect(setCookies(res).find((c) => c.startsWith('pa_session='))).toBeUndefined()
  })

  it('400s on missing code, malformed state, and WorkOS-reported errors', async () => {
    expect((await authGet(`/callback?state=${stateParam('/productarena')}`, `pa_state=${NONCE}`)).status).toBe(400)
    expect((await authGet('/callback?code=c&state=!!!', `pa_state=${NONCE}`)).status).toBe(400)
    expect((await authGet('/callback?error=access_denied', `pa_state=${NONCE}`)).status).toBe(400)
  })

  it('fails closed with a clear message when WORKOS_API_KEY is missing', async () => {
    const res = await authGet('/callback?code=c', undefined, { WORKOS_CLIENT_ID: 'x', PA_SESSION_KEY: KEY })
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/auth not configured.*WORKOS_API_KEY/)
  })
})

describe('GET /auth/logout', () => {
  it('clears pa_session and bounces through the WorkOS logout URL when the session has a sid', async () => {
    const cookie = await sign(KEY, { sub: 'u', email: 'a@b.co', sid: 'session_01XYZ' })
    const res = await authGet('/logout?return_to=%2Fproductarena%2Farena%2Fcrm', `pa_session=${cookie}`)
    expect(res.status).toBe(302)
    const location = new URL(res.headers.get('location') ?? '')
    expect(location.origin + location.pathname).toBe('https://api.workos.com/user_management/sessions/logout')
    expect(location.searchParams.get('session_id')).toBe('session_01XYZ')
    expect(location.searchParams.get('return_to')).toBe('https://ultrametric.ai/productarena/arena/crm')
    expect(setCookies(res).find((c) => c.startsWith('pa_session='))).toMatch(/Max-Age=0/)
  })

  it('redirects straight to return_to when there is no (valid) session', async () => {
    const res = await authGet('/logout?return_to=%2Fproductarena')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://ultrametric.ai/productarena')
    // Off-site return_to still sanitized
    const evil = await authGet('/logout?return_to=https%3A%2F%2Fevil.example')
    expect(evil.headers.get('location')).toBe('https://ultrametric.ai/productarena')
  })
})

describe('unknown auth routes', () => {
  it('404 rather than falling through to the proxy', async () => {
    expect((await authGet('/whoami')).status).toBe(404)
  })
})

describe('mock mode (WORKOS_MOCK=1 — dev-only harness, see docs/AUTH.md)', () => {
  const MOCK_ENV = { WORKOS_MOCK: '1' } // deliberately NO client id and NO secrets — the point
  const localGet = (path: string, cookie?: string, env: object = MOCK_ENV) =>
    handleAuth(
      new Request(`http://localhost:8787/productarena/auth${path}`, {
        headers: cookie ? { cookie } : undefined,
      }),
      env,
    ) as Promise<Response>

  it('login mints an immediate session for test@ultrametric.ai with a host-only non-Secure cookie', async () => {
    const returnTo = encodeURIComponent('http://localhost:8787/productarena/arena/crm')
    const res = await localGet(`/login?return_to=${returnTo}`)
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('http://localhost:8787/productarena/arena/crm')
    const cookie = setCookies(res).find((c) => c.startsWith('pa_session='))
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/Path=\/productarena/)
    expect(cookie).not.toMatch(/Domain=/i) // host-only: a Domain cookie would be rejected on localhost
    expect(cookie).not.toMatch(/Secure/i) // http://localhost
    // Full round-trip: /auth/me accepts the minted cookie without any secrets configured.
    const value = /pa_session=([^;]+)/.exec(cookie ?? '')?.[1]
    const me = await localGet('/me', `pa_session=${value}`)
    expect(me.status).toBe(200)
    expect(await me.json()).toEqual({ email: 'test@ultrametric.ai' })
  })

  it('still sanitizes return_to — off-origin targets fall back to the local PA home', async () => {
    const res = await localGet(`/login?return_to=${encodeURIComponent('https://evil.example/phish')}`)
    expect(res.headers.get('location')).toBe('http://localhost:8787/productarena')
    const prod = await localGet(`/login?return_to=${encodeURIComponent('https://ultrametric.ai/productarena')}`)
    // Even the production origin is "off-origin" for a localhost dev session.
    expect(prod.headers.get('location')).toBe('http://localhost:8787/productarena')
  })

  it('logout clears the cookie locally and never bounces through WorkOS', async () => {
    const login = await localGet('/login')
    const value = /pa_session=([^;]+)/.exec(setCookies(login).find((c) => c.startsWith('pa_session=')) ?? '')?.[1]
    const res = await localGet(`/logout?return_to=${encodeURIComponent('/productarena/watchlist')}`, `pa_session=${value}`)
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('http://localhost:8787/productarena/watchlist')
    expect(setCookies(res).find((c) => c.startsWith('pa_session='))).toMatch(/Max-Age=0/)
  })

  it('prefers a real PA_SESSION_KEY over the dev fallback when one is set', async () => {
    const env = { WORKOS_MOCK: '1', PA_SESSION_KEY: KEY }
    const login = await localGet('/login', undefined, env)
    const value = /pa_session=([^;]+)/.exec(setCookies(login).find((c) => c.startsWith('pa_session=')) ?? '')?.[1]
    expect(await verify(KEY, value)).toMatchObject({ email: 'test@ultrametric.ai', sub: 'user_mock_test' })
  })

  it('NEVER activates on the production hostname, even with the var set', async () => {
    // Unconfigured prod worker + stray WORKOS_MOCK: still the fail-closed 500, no fake session.
    const unconfigured = await authGet('/login', undefined, { WORKOS_MOCK: '1' })
    expect(unconfigured.status).toBe(500)
    expect((await unconfigured.json()).error).toMatch(/auth not configured/)
    // Fully configured prod worker + stray WORKOS_MOCK: the real WorkOS flow, untouched.
    const configured = await authGet('/login', undefined, { ...ENV, WORKOS_MOCK: '1' })
    expect(configured.status).toBe(302)
    expect(new URL(configured.headers.get('location') ?? '').hostname).toBe('api.workos.com')
  })
})
