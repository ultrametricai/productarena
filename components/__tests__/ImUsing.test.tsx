// @vitest-environment jsdom
// ImUsing — the product-page "I'm using this" toggle over the account stack (lib/myStack.ts
// StackMap v2). The load-bearing multi-vendor semantics (founder 2026-09-22 "allow multiple
// vendors for functions"): toggling one product's membership NEVER removes the reader's other
// picks in the arena, and the label says "one of my picks" when the arena holds several.
import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@/lib/session'

// Same controllable session stub as components/__tests__/ProcessCheck.test.tsx.
const sessionStub = vi.hoisted(() => ({ current: { state: 'anonymous' } as Session }))
vi.mock('@/lib/session', () => ({
  useSession: () => sessionStub.current,
  loginUrl: (returnTo: string) => `https://login.example/?to=${encodeURIComponent(returnTo)}`,
}))

import ImUsing from '@/components/ImUsing'
import { parseStackMap, readStackRaw, serializeStackMap, STACK_KEY } from '@/lib/myStack'

// Same in-memory localStorage stand-in as the watchlist tests (this jsdom's is shadowed).
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

const mercury = <ImUsing arenaId="startup-banking" productId="mercury" productName="Mercury" />

describe('ImUsing — multi-pick membership toggle', () => {
  beforeEach(() => {
    stubLocalStorage()
    // Write-path tests run signed-in — the 2026-09-23 signup gate blocks anonymous writes
    // (covered by its own test below).
    sessionStub.current = { state: 'authenticated' }
  })

  it('a click adds the product to the arena picks; a second click removes it (empty arena key deleted)', () => {
    const { getByRole } = render(mercury)
    const button = getByRole('button')
    expect(button.textContent).toBe("I'm using this")

    fireEvent.click(button)
    expect(parseStackMap(readStackRaw())).toEqual({ 'startup-banking': ['mercury'] })
    expect(button.textContent).toBe("✓ I'm using this")

    fireEvent.click(button)
    expect(parseStackMap(readStackRaw())).toEqual({})
    expect(button.textContent).toBe("I'm using this")
  })

  it('adding a second vendor keeps the first (multi-vendor stacks) and appends to the END', () => {
    window.localStorage.setItem(STACK_KEY, serializeStackMap({ 'startup-banking': ['brex'] }))
    const { getByRole } = render(mercury)
    fireEvent.click(getByRole('button'))
    // Brex stays primary (first); Mercury joins behind it — nothing was replaced.
    expect(parseStackMap(readStackRaw())).toEqual({ 'startup-banking': ['brex', 'mercury'] })
  })

  it('with co-picks in the arena the label reads "one of my picks"; removing keeps the others', () => {
    window.localStorage.setItem(
      STACK_KEY,
      serializeStackMap({ 'startup-banking': ['brex', 'mercury'], payroll: ['gusto'] }),
    )
    const { getByRole } = render(mercury)
    const button = getByRole('button')
    expect(button.textContent).toBe('✓ one of my picks')

    fireEvent.click(button)
    expect(parseStackMap(readStackRaw())).toEqual({ 'startup-banking': ['brex'], payroll: ['gusto'] })
    expect(button.textContent).toBe("I'm using this")
  })

  it('a v1 stored stack (single string) migrates transparently — the pick still reads as set', () => {
    window.localStorage.setItem(STACK_KEY, '{"startup-banking":"mercury"}')
    const { getByRole } = render(mercury)
    expect(getByRole('button').textContent).toBe("✓ I'm using this")
  })
})

describe('ImUsing — signup gate (founder 2026-09-23)', () => {
  beforeEach(() => {
    stubLocalStorage()
    sessionStub.current = { state: 'anonymous' }
  })

  it('an anonymous click records NOTHING and opens the sign-up modal instead', () => {
    const { getByRole, getByText } = render(mercury)
    fireEvent.click(getByRole('button', { name: "I'm using this" }))
    expect(parseStackMap(readStackRaw())).toEqual({})
    expect(getByText('Sign up or log in to record this')).toBeDefined()
    // The login CTA deep-links back; "Not now" dismisses without writing.
    fireEvent.click(getByText('Not now'))
    expect(parseStackMap(readStackRaw())).toEqual({})
  })

  it('the stashed intent applies automatically once the session turns authenticated', () => {
    window.sessionStorage?.setItem?.(
      'pa-pending-action',
      JSON.stringify({ kind: 'im-using', arenaId: 'startup-banking', productId: 'mercury' }),
    )
    sessionStub.current = { state: 'authenticated' }
    render(mercury)
    expect(parseStackMap(readStackRaw())).toEqual({ 'startup-banking': ['mercury'] })
  })
})
