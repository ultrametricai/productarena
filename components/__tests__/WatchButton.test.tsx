// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@/lib/session'

// WatchButton's gate is the WorkOS session (lib/session.ts) — swap the hook for a controllable
// stub so each test picks the session state without a network.
const sessionStub = vi.hoisted(() => ({ current: { state: 'loading' } as Session }))
vi.mock('@/lib/session', () => ({
  useSession: () => sessionStub.current,
}))

import WatchButton from '@/components/WatchButton'
import { WATCHLIST_KEY } from '@/lib/watchlist'

// This jsdom environment ships without a working window.localStorage (Node's experimental
// webstorage global shadows jsdom's unless --localstorage-file is set), so give each test a
// fresh in-memory stand-in with the same surface lib/watchlist.ts touches.
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

describe('WatchButton session gating', () => {
  beforeEach(() => {
    stubLocalStorage()
  })

  it('renders nothing while the session is loading', () => {
    sessionStub.current = { state: 'loading' }
    const { container } = render(<WatchButton productId="supabase" productName="Supabase" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing for anonymous readers — the open site is unchanged', () => {
    sessionStub.current = { state: 'anonymous' }
    const { container } = render(<WatchButton productId="supabase" productName="Supabase" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders the star for authenticated readers and toggles localStorage', () => {
    sessionStub.current = { state: 'authenticated', email: 'founder@ultrametric.ai' }
    render(<WatchButton productId="supabase" productName="Supabase" />)
    const button = screen.getByRole('button', { name: /Watch Supabase/ })
    expect(button.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(JSON.parse(window.localStorage.getItem(WATCHLIST_KEY) ?? '[]')).toEqual(['supabase'])
    fireEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(JSON.parse(window.localStorage.getItem(WATCHLIST_KEY) ?? '[]')).toEqual([])
  })
})
