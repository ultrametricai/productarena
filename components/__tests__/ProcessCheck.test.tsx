// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@/lib/session'

// ProcessCheck's gate is the WorkOS session (lib/session.ts) — same controllable stub as
// components/__tests__/WatchButton.test.tsx. loginUrl/registrationUrl stay the real shapes.
const sessionStub = vi.hoisted(() => ({ current: { state: 'loading' } as Session }))
vi.mock('@/lib/session', () => ({
  useSession: () => sessionStub.current,
  loginUrl: (returnTo: string) => `/productarena/auth/login?return_to=${encodeURIComponent(returnTo)}`,
  registrationUrl: (returnTo: string) =>
    `/productarena/auth/login?screen_hint=sign-up&return_to=${encodeURIComponent(returnTo)}`,
}))

import ProcessCheck from '@/components/ProcessCheck'
import { STACK_KEY } from '@/lib/myStack'
import type { ProcessCheckStep } from '@/lib/processCheck'

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

const STEPS: ProcessCheckStep[] = [
  {
    nodeId: 'open',
    label: 'Open the account',
    storyCount: 3,
    arenas: [
      {
        arenaId: 'startup-banking',
        arenaName: 'Startup banking',
        kind: 'function',
        vendors: [
          { productId: 'best-bank', name: 'Best Bank', score: 90 },
          { productId: 'mercury', name: 'Mercury', score: 62 },
        ],
      },
    ],
    best: { productId: 'best-bank', name: 'Best Bank', score: 90, arenaId: 'startup-banking' },
  },
]

describe('ProcessCheck gating states', () => {
  beforeEach(() => {
    stubLocalStorage()
  })

  it('renders nothing while the session is loading', () => {
    sessionStub.current = { state: 'loading' }
    const { container } = render(<ProcessCheck steps={STEPS} totalSteps={5} />)
    expect(container.innerHTML).toBe('')
  })

  it('signed out: shows the sign-up/log-in prompt, no scores', () => {
    sessionStub.current = { state: 'anonymous' }
    render(<ProcessCheck steps={STEPS} totalSteps={5} />)
    expect(screen.getByText('Sign up')).toBeTruthy()
    expect(screen.getByText('Log in')).toBeTruthy()
    expect(screen.queryByText(/Your stack covers/)).toBeNull()
  })

  it('signed in without a stack: points at /my-stack to configure vendors', () => {
    sessionStub.current = { state: 'authenticated', email: 'founder@ultrametric.ai' }
    render(<ProcessCheck steps={STEPS} totalSteps={5} />)
    const link = screen.getByRole('link', { name: /Configure your stack/ })
    expect(link.getAttribute('href')).toBe('/my-stack')
    expect(screen.queryByText(/Your stack covers/)).toBeNull()
  })

  it('signed in with a stack: runs the check — coverage line, your score vs best, upgrade flag', () => {
    sessionStub.current = { state: 'authenticated', email: 'founder@ultrametric.ai' }
    window.localStorage.setItem(STACK_KEY, JSON.stringify({ 'startup-banking': 'mercury' }))
    render(<ProcessCheck steps={STEPS} totalSteps={5} />)
    // Coverage summary: 1 of 1 rankable (of 5 total) at avg 62 vs best 90.
    expect(screen.getByText(/Your stack covers/)).toBeTruthy()
    // avg + the per-step "yours" both render 62; the best column renders 90 twice too.
    expect(screen.getAllByText('62').length).toBeGreaterThan(0)
    expect(screen.getAllByText('90').length).toBeGreaterThan(0)
    // Δ28 > 15 → flagged with the upgrade suggestion.
    expect(screen.getByText(/Δ28 behind/)).toBeTruthy()
    expect(screen.getAllByRole('link', { name: 'Best Bank' }).length).toBeGreaterThan(0)
  })
})
