import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  emailFromWhoami,
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

const WHOAMI_OK = { identity: { traits: { email: 'founder@ultrametric.ai' } } }

// Wait until the store leaves 'loading' — fetchSession resolves on a microtask, so tests must
// await the settled state rather than assert synchronously.
async function settledSession() {
  await vi.waitFor(() => {
    expect(readSession().state).not.toBe('loading')
  })
  return readSession()
}

describe('login/registration flow URLs', () => {
  it('point at auth.ultrametric.ai self-service browser flows with an encoded return_to', () => {
    expect(loginUrl('https://ultrametric.ai/productarena/arena/crm')).toBe(
      'https://auth.ultrametric.ai/self-service/login/browser?return_to=https%3A%2F%2Fultrametric.ai%2Fproductarena%2Farena%2Fcrm',
    )
    expect(registrationUrl('https://ultrametric.ai/productarena')).toBe(
      'https://auth.ultrametric.ai/self-service/registration/browser?return_to=https%3A%2F%2Fultrametric.ai%2Fproductarena',
    )
  })
})

describe('emailFromWhoami', () => {
  it('extracts identity.traits.email', () => {
    expect(emailFromWhoami(WHOAMI_OK)).toBe('founder@ultrametric.ai')
  })

  it('degrades any unexpected shape to undefined', () => {
    expect(emailFromWhoami(null)).toBeUndefined()
    expect(emailFromWhoami('nope')).toBeUndefined()
    expect(emailFromWhoami({})).toBeUndefined()
    expect(emailFromWhoami({ identity: null })).toBeUndefined()
    expect(emailFromWhoami({ identity: { traits: { email: 42 } } })).toBeUndefined()
    expect(emailFromWhoami({ identity: { traits: { email: '' } } })).toBeUndefined()
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

  it('resolves to authenticated (with email) on a 200 whoami and notifies subscribers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, WHOAMI_OK))
    vi.stubGlobal('fetch', fetchMock)
    const listener = vi.fn()
    subscribeSession(listener)
    expect(await settledSession()).toEqual({ state: 'authenticated', email: 'founder@ultrametric.ai' })
    expect(listener).toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledWith('https://auth.ultrametric.ai/sessions/whoami', {
      credentials: 'include',
    })
  })

  it('resolves to anonymous on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { error: 'no session' })))
    subscribeSession(() => {})
    expect(await settledSession()).toEqual({ state: 'anonymous' })
  })

  it('degrades to anonymous when the fetch fails outright (network/CORS)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    subscribeSession(() => {})
    expect(await settledSession()).toEqual({ state: 'anonymous' })
  })

  it('fetches whoami once per page load no matter how many components subscribe', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, WHOAMI_OK))
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

  it('returns the logout_url Ory hands back', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { logout_url: 'https://auth.ultrametric.ai/self-service/logout?token=t' }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchLogoutUrl('https://ultrametric.ai/productarena')).resolves.toBe(
      'https://auth.ultrametric.ai/self-service/logout?token=t',
    )
    expect(fetchMock).toHaveBeenCalledWith(
      'https://auth.ultrametric.ai/self-service/logout/browser?return_to=https%3A%2F%2Fultrametric.ai%2Fproductarena',
      { credentials: 'include', headers: { Accept: 'application/json' } },
    )
  })

  it('returns null on non-2xx, malformed payloads, and thrown fetches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, {})))
    await expect(fetchLogoutUrl('x')).resolves.toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { nope: true })))
    await expect(fetchLogoutUrl('x')).resolves.toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(fetchLogoutUrl('x')).resolves.toBeNull()
  })
})
