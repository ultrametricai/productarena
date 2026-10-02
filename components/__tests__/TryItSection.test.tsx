// @vitest-environment jsdom
// Pins for the "Try it agentically" panel declutter (founder 2026-10-02): the Experimental chip,
// the long explainer paragraph (docs/TRY-IT.md link included), and the microterminal's footer
// "replay ↺ / run again ▶" button are gone — while the HONESTY CONTRACT survives verbatim: the
// per-run recorded/live badge, the per-story footer provenance line, and the ▶ run-live
// affordance for live-capable recordings. Data libs are mocked so these pins don't depend on
// which products currently carry recorded proofs.
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TryItSection from '@/components/TryIt/TryItSection'

vi.mock('@/lib/tryit', () => ({
  buildRecordedStories: () => [
    {
      id: 'llms-txt',
      title: 'read the docs',
      kind: 'recorded',
      command: 'curl -s https://vendor.example/llms.txt | head -4',
      transcript: 'recorded output',
      recordedAt: '2026-09-01T00:00:00Z',
      exitCode: 0,
      live: true,
    },
  ],
  mcpDocsUrlFor: () => null,
}))
vi.mock('@/lib/mcpEndpoints', () => ({ mcpEndpointFor: () => null }))

describe('TryItSection — founder 2026-10-02 declutter', () => {
  it('keeps the heading but drops the Experimental chip and the explainer paragraph', () => {
    const { container } = render(
      <TryItSection category="payments" productId="stripe" productName="Stripe" stories={[]} />,
    )
    expect(screen.getByRole('heading', { name: 'Try it agentically' })).toBeTruthy()
    expect(screen.queryByText('Experimental')).toBeNull()
    expect(container.textContent).not.toContain('See what an agent can do')
    expect(container.textContent).not.toContain('docs/TRY-IT.md')
    expect(container.querySelector('a[href*="TRY-IT.md"]')).toBeNull()
  })

  it('HONESTY GUARD: the per-line recorded/live labeling and run-live affordance survive', () => {
    render(<TryItSection category="payments" productId="stripe" productName="Stripe" stories={[]} />)
    // The per-run badge still says, out loud, that this is a replayed recording…
    expect(screen.getByText(/recorded session — replayed, not live/)).toBeTruthy()
    // …the provenance footer still carries date / exit code / verbatim-capture line…
    expect(screen.getByText(/captured verbatim by our probe harness/)).toBeTruthy()
    // …and the live-capable story keeps its ▶ run live affordance and tag.
    expect(screen.getByRole('button', { name: /run live/i })).toBeTruthy()
    expect(screen.getByText('live-capable')).toBeTruthy()
  })

  it('the footer replay/run-again button is gone (the title bar ▶ replay control remains)', () => {
    render(<TryItSection category="payments" productId="stripe" productName="Stripe" stories={[]} />)
    expect(screen.queryByRole('button', { name: /replay ↺/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /run again/ })).toBeNull()
    expect(screen.getByRole('button', { name: /▶ replay/ })).toBeTruthy()
  })
})
