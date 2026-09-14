import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  emailFromMe,
  fetchLogoutUrl,
  loginUrl,
  readSession,
  registrationUrl,
  resetSessionForTests,
  subscribeSession,
} from '@/lib/session'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const ME_OK = { email: 'founder@ultrametric.ai' }

// Wait until the store leaves 'loading' — fetchSession resolves on a microtask, so tests must
// await the settled state rather than assert synchronously.
async function settledSession() {
  await vi.waitFor(() => {
    expect(readSession().state).not.toBe('loading')
  })
  return readSession()
}

describe('login/registration flow URLs', () => {
  it('point at the worker auth backend (same-origin) with an encoded return_to', () => {
    expect(loginUrl('https://ultrametric.ai/productarena/arena/crm')).toBe(
      '/productarena/auth/login?return_to=https%3A%2F%2Fultrametric.ai%2Fproductarena%2Farena%2Fcrm',
    )
    expect(registrationUrl('https://ultrametric.ai/productarena')).toBe(
      '/productarena/auth/login?screen_hint=sign-up&return_to=https%3A%2F%2Fultrametric.ai%2Fproductarena',
    )
  })
})

describe('emailFromMe', () => {
  it('extracts email from an /auth/me payload', () => {
    expect(emailFromMe(ME_OK)).toBe('founder@ultrametric.ai')
  })

  it('degrades any unexpected shape to undefined', () => {
    expect(emailFromMe(null)).toBeUndefined()
    expect(emailFromMe('nope')).toBeUndefined()
    expect(emailFromMe({})).toBeUndefined()
    expect(emailFromMe({ email: 42 })).toBeUndefined()
    expect(emailFromMe({ email: '' })).toBeUndefined()
  })
})

describe('session store state machine', () => {
  beforeEach(() => {
    resetSessionForTests()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts loading and never fetches until someone subscribes', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(readSession()).toEqual({ state: 'loading' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('resolves to authenticated (with email) on a 200 /auth/me and notifies subscribers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, ME_OK))
    vi.stubGlobal('fetch', fetchMock)
    const listener = vi.fn()
    subscribeSession(listener)
    expect(await settledSession()).toEqual({ state: 'authenticated', email: 'founder@ultrametric.ai' })
    expect(listener).toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledWith('/productarena/auth/me', {
      credentials: 'include',
    })
  })

  it('resolves to anonymous on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { error: 'no session' })))
    subscribeSession(() => {})
    expect(await settledSession()).toEqual({ state: 'anonymous' })
  })

  it('resolves to anonymous on 404 (page served where the worker does not exist)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(404, { error: 'not found' })))
    subscribeSession(() => {})
    expect(await settledSession()).toEqual({ state: 'anonymous' })
  })

  it('degrades to anonymous when the fetch fails outright (network)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    subscribeSession(() => {})
    expect(await settledSession()).toEqual({ state: 'anonymous' })
  })

  it('fetches /auth/me once per page load no matter how many components subscribe', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, ME_OK))
    vi.stubGlobal('fetch', fetchMock)
    const unsub = subscribeSession(() => {})
    subscribeSession(() => {})
    unsub()
    subscribeSession(() => {})
    await settledSession()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('fetchLogoutUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the worker logout route with an encoded return_to — no network round-trip', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchLogoutUrl('https://ultrametric.ai/productarena')).resolves.toBe(
      '/productarena/auth/logout?return_to=https%3A%2F%2Fultrametric.ai%2Fproductarena',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
