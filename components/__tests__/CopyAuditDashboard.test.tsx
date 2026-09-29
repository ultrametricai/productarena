// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@/lib/session'

// CopyAuditDashboard reuses the DoViaAfk/OpsDashboard admin gate (session allowlist + company
// domain + the pa-admin localStorage switch) — same test rig as OpsDashboard.test.tsx: stub the
// session hook and localStorage.
const sessionStub = vi.hoisted(() => ({ current: { state: 'loading' } as Session }))
vi.mock('@/lib/session', () => ({
  useSession: () => sessionStub.current,
}))

import { ADMIN_FLAG_KEY } from '@/components/DoViaAfk'
import CopyAuditDashboard from '@/components/CopyAuditDashboard'
import type { CopyAudit } from '@/lib/copyAudit'

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

const AUDIT: CopyAudit = {
  version: 1,
  auditedAt: '2026-09-29',
  candidates: [
    {
      id: 'alpha-intro',
      route: '/compare',
      file: 'app/compare/page.tsx',
      line: 38,
      kind: 'intro',
      excerpt: 'Any products, side by side — the selection is the URL, always a shareable link.',
      suggestion: 'cut',
      why: 'Repeats the URL-share trope from three sibling pages.',
    },
    {
      id: 'beta-tooltip',
      route: '/processes/example',
      file: 'components/ProcessLensBanner.tsx',
      line: 52,
      kind: 'tooltip',
      excerpt: 'Full scoring formula inside a banner tooltip, normalized 0-100 over all rankable steps.',
      suggestion: 'tighten',
      why: 'Link the receipt instead of restating the formula.',
    },
    {
      id: 'gamma-disclosure',
      route: '/methodology',
      file: 'app/methodology/page.tsx',
      line: 67,
      kind: 'disclosure',
      excerpt: 'Bias disclosure: the judge model is made by Anthropic; one arena includes its own product.',
      suggestion: 'keep',
      why: 'Affiliation disclosure — integrity depends on it staying.',
    },
  ],
}

describe('CopyAuditDashboard admin gating', () => {
  beforeEach(() => {
    stubLocalStorage()
    vi.unstubAllEnvs()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders NOTHING for anonymous readers with no local flag — no trace in the DOM', async () => {
    sessionStub.current = { state: 'anonymous' }
    const { container } = render(<CopyAuditDashboard audit={AUDIT} />)
    await act(async () => {})
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing for authenticated non-admins, even with an allowlist set', async () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', 'founder@ultrametric.ai')
    sessionStub.current = { state: 'authenticated', email: 'reader@example.com' }
    const { container } = render(<CopyAuditDashboard audit={AUDIT} />)
    await act(async () => {})
    expect(container.innerHTML).toBe('')
  })

  it("renders the three suggestion groups and the count header for the founder's pa-admin=1 switch", async () => {
    window.localStorage.setItem(ADMIN_FLAG_KEY, '1')
    sessionStub.current = { state: 'anonymous' }
    render(<CopyAuditDashboard audit={AUDIT} />)
    expect(await screen.findByRole('heading', { name: 'Copy audit' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /^Cut/ })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /^Tighten/ })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /^Keep — with reason/ })).toBeTruthy()
    expect(screen.getByText(/3 candidates · 1 cut \/ 1 tighten \/ 1 keep/)).toBeTruthy()
    // Rows carry route link, excerpt, file:line and the why.
    expect(screen.getByRole('link', { name: '/compare' })).toBeTruthy()
    expect(screen.getByText('app/methodology/page.tsx:67')).toBeTruthy()
    expect(screen.getByText(/Affiliation disclosure/)).toBeTruthy()
  })

  it('renders for an allowlisted admin email and for a company-domain session', async () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', 'founder@ultrametric.ai')
    sessionStub.current = { state: 'authenticated', email: 'founder@ultrametric.ai' }
    render(<CopyAuditDashboard audit={AUDIT} />)
    expect(await screen.findByRole('heading', { name: 'Copy audit' })).toBeTruthy()

    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', '')
    sessionStub.current = { state: 'authenticated', email: 'Staff@Ultrametric.AI' }
    render(<CopyAuditDashboard audit={AUDIT} />)
    expect((await screen.findAllByRole('heading', { name: 'Copy audit' })).length).toBeGreaterThan(0)
  })

  it('filters by kind and by route prefix, client-side', async () => {
    window.localStorage.setItem(ADMIN_FLAG_KEY, '1')
    sessionStub.current = { state: 'anonymous' }
    render(<CopyAuditDashboard audit={AUDIT} />)
    await screen.findByRole('heading', { name: 'Copy audit' })

    fireEvent.change(screen.getByLabelText(/Kind/), { target: { value: 'tooltip' } })
    expect(screen.getByText('1 shown')).toBeTruthy()
    expect(screen.queryByRole('link', { name: '/compare' })).toBeNull()
    expect(screen.getByRole('link', { name: '/processes/example' })).toBeTruthy()

    fireEvent.change(screen.getByLabelText(/Kind/), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText(/Route prefix/), { target: { value: '/methodology' } })
    expect(screen.getByText('1 shown')).toBeTruthy()
    expect(screen.getByRole('link', { name: '/methodology' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: '/compare' })).toBeNull()
  })
})
