// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@/lib/session'

// DoViaAfk's session half of the admin gate is the WorkOS session (lib/session.ts) — swap the hook
// for a controllable stub so each test picks the session state without a network (same pattern
// as WatchButton.test.tsx).
const sessionStub = vi.hoisted(() => ({ current: { state: 'loading' } as Session }))
vi.mock('@/lib/session', () => ({
  useSession: () => sessionStub.current,
}))

import DoViaAfk, { ADMIN_FLAG_KEY, AFK_RUN_URL, isAdminEmail } from '@/components/DoViaAfk'

// This jsdom environment ships without a working window.localStorage (Node's experimental
// webstorage global shadows jsdom's unless --localstorage-file is set), so give each test a
// fresh in-memory stand-in.
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

const MANIFEST_URL = 'https://ultrametric.ai/productarena/processes/get-ein/manifest.json'

describe('isAdminEmail', () => {
  it('admits nobody when the allowlist is unset or empty (the default)', () => {
    expect(isAdminEmail('founder@ultrametric.ai', undefined)).toBe(false)
    expect(isAdminEmail('founder@ultrametric.ai', '')).toBe(false)
    expect(isAdminEmail(undefined, 'founder@ultrametric.ai')).toBe(false)
  })

  it('matches comma-separated entries case-insensitively, tolerating whitespace', () => {
    const list = ' Founder@Ultrametric.ai , ops@ultrametric.ai '
    expect(isAdminEmail('founder@ultrametric.ai', list)).toBe(true)
    expect(isAdminEmail('OPS@ultrametric.ai', list)).toBe(true)
    expect(isAdminEmail('reader@example.com', list)).toBe(false)
  })
})

describe('DoViaAfk admin gating', () => {
  beforeEach(() => {
    stubLocalStorage()
    vi.unstubAllEnvs()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders nothing for anonymous readers with no local flag — no trace in the DOM', async () => {
    sessionStub.current = { state: 'anonymous' }
    const { container } = render(<DoViaAfk manifestUrl={MANIFEST_URL} />)
    await act(async () => {}) // let any post-hydration snapshot re-render settle
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing for authenticated non-admins, even with an allowlist set', async () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', 'founder@ultrametric.ai')
    sessionStub.current = { state: 'authenticated', email: 'reader@example.com' }
    const { container } = render(<DoViaAfk manifestUrl={MANIFEST_URL} />)
    await act(async () => {})
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing for allowlisted emails when the env default (unset) is in effect', async () => {
    sessionStub.current = { state: 'authenticated', email: 'founder@ultrametric.ai' }
    const { container } = render(<DoViaAfk manifestUrl={MANIFEST_URL} />)
    await act(async () => {})
    expect(container.innerHTML).toBe('')
  })

  it('renders for an allowlisted admin email', async () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', 'founder@ultrametric.ai,ops@ultrametric.ai')
    sessionStub.current = { state: 'authenticated', email: 'founder@ultrametric.ai' }
    render(<DoViaAfk manifestUrl={MANIFEST_URL} />)
    expect(await screen.findByRole('button', { name: /Do via AFK \(admin preview\)/ })).toBeTruthy()
  })

  it("renders for the founder's local pa-admin=1 switch even while anonymous", async () => {
    window.localStorage.setItem(ADMIN_FLAG_KEY, '1')
    sessionStub.current = { state: 'anonymous' }
    render(<DoViaAfk manifestUrl={MANIFEST_URL} />)
    expect(await screen.findByRole('button', { name: /Do via AFK \(admin preview\)/ })).toBeTruthy()
  })

  it('opens the AFK run URL with the encoded manifest URL and copies the manifest URL', async () => {
    window.localStorage.setItem(ADMIN_FLAG_KEY, '1')
    sessionStub.current = { state: 'anonymous' }
    const open = vi.fn()
    vi.stubGlobal('open', open)
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(<DoViaAfk manifestUrl={MANIFEST_URL} />)
    const button = await screen.findByRole('button', { name: /Do via AFK/ })
    await act(async () => {
      fireEvent.click(button)
    })
    expect(open).toHaveBeenCalledWith(
      `${AFK_RUN_URL}?manifest=${encodeURIComponent(MANIFEST_URL)}`,
      '_blank',
      'noopener,noreferrer',
    )
    expect(writeText).toHaveBeenCalledWith(MANIFEST_URL)
    vi.unstubAllGlobals()
  })
})
