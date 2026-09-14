// @vitest-environment jsdom
// State-machine tests for the Try-it microterminal's live tiers (components/TryIt/
// Microterminal.tsx): keyless demo-call affordance, BYO-key form (memory-only credential),
// sandbox-account affordance, and the honest badges for each outcome. The worker is mocked at
// the fetch boundary — these tests assert exactly what the component would send it.
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Microterminal from '@/components/TryIt/Microterminal'
import type { McpProbeResult } from '@/lib/tryitReplay'

const PROBE = {
  arena: 'payments',
  product: 'stripe',
  endpoint: 'https://mcp.stripe.com/',
  docsUrl: 'https://docs.stripe.com/mcp',
}

interface SentBody {
  arena: string
  product: string
  action?: string
  token?: string
  useSandbox?: boolean
  tool?: string
}

// Queue of JSON responses for the mocked worker endpoint; records each request body.
function stubFetch(responses: unknown[]): { sent: SentBody[] } {
  const sent: SentBody[] = []
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
    sent.push(JSON.parse(String(init?.body)) as SentBody)
    const next = responses.shift()
    if (next === undefined) throw new Error('stubFetch exhausted')
    return new Response(JSON.stringify(next), { status: 200, headers: { 'content-type': 'application/json' } })
  }))
  return { sent }
}

const keylessOk: McpProbeResult = {
  ok: true,
  auth: 'keyless',
  reachable: true,
  authRequired: false,
  handshake: true,
  serverInfo: { name: 'vendor-mcp', version: '1' },
  protocolVersion: '2025-06-18',
  toolCount: 3,
  toolNames: ['a', 'b', 'c'],
  demoCall: { tool: 'search_docs', label: 'search the docs' },
}

const authGated: McpProbeResult = {
  ok: true,
  auth: 'keyless',
  reachable: true,
  authRequired: true,
  httpStatus: 401,
  oauth: true,
}

const renderLive = () => render(<Microterminal productName="Stripe" stories={[]} probe={PROBE} />)
const runHandshake = () => fireEvent.click(screen.getByRole('button', { name: /Live MCP handshake/ }))

afterEach(() => vi.unstubAllGlobals())

describe('Microterminal live tiers', () => {
  it('keyless handshake with a curated demo exposes "run a real call" and sends action:call with NO tool/args', async () => {
    const { sent } = stubFetch([
      keylessOk,
      { ok: true, auth: 'keyless', reachable: true, handshake: true, call: { tool: 'search_docs', label: 'search the docs', ok: true, resultText: 'found 4 results', truncated: false } },
    ])
    renderLive()
    runHandshake()

    const runCall = await screen.findByRole('button', { name: /run a real call — search the docs/ })
    expect(sent[0]).toEqual({ arena: 'payments', product: 'stripe' }) // keyless probe: no token, no action
    fireEvent.click(runCall)

    await waitFor(() => expect(sent).toHaveLength(2))
    expect(sent[1]).toEqual({ arena: 'payments', product: 'stripe', action: 'call' })
    expect(sent[1].tool).toBeUndefined() // the tool/args live server-side only
    expect(await screen.findByText(/keyless handshake OK — 3 tools live/)).toBeTruthy()
  })

  it('an auth-gated result offers the BYO-key form but no run-call or sandbox buttons', async () => {
    stubFetch([authGated])
    renderLive()
    runHandshake()

    expect(await screen.findByText(/verified reachable, auth-gated/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /run a real call/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /use our sandbox account/ })).toBeNull()
    expect(screen.getByRole('button', { name: /have a key\? test it with your own credentials/ })).toBeTruthy()
  })

  it('the BYO key is sent per-run in the request body, never rendered, never persisted', async () => {
    const secret = 'sk_test_supersecretvalue123'
    const { sent } = stubFetch([
      authGated,
      { ...keylessOk, auth: 'byo-key' },
    ])
    const { container } = renderLive()
    runHandshake()

    fireEvent.click(await screen.findByRole('button', { name: /have a key\?/ }))
    // the security promise is stated next to the input
    expect(screen.getByText(/never logged, never stored/)).toBeTruthy()
    const input = screen.getByLabelText<HTMLInputElement>(/API key or token for Stripe/)
    expect(input.type).toBe('password')
    fireEvent.change(input, { target: { value: secret } })
    fireEvent.click(screen.getByRole('button', { name: /run with my key/ }))

    await waitFor(() => expect(sent).toHaveLength(2))
    expect(sent[1]).toEqual({ arena: 'payments', product: 'stripe', token: secret })
    expect(await screen.findByText(/authenticated handshake OK \(your key\)/)).toBeTruthy()
    // memory-only: the credential never appears in markup or any storage
    expect(container.innerHTML).not.toContain(secret)
    expect(window.localStorage?.length ?? 0).toBe(0)
  })

  it('after a keyed handshake succeeds, the demo call carries the same key', async () => {
    const secret = 'sk_live_reused_for_the_call'
    const { sent } = stubFetch([
      authGated,
      { ...keylessOk, auth: 'byo-key' },
      { ok: true, auth: 'byo-key', reachable: true, handshake: true, call: { tool: 'search_docs', label: 'search the docs', ok: true, resultText: 'ok' } },
    ])
    renderLive()
    runHandshake()
    fireEvent.click(await screen.findByRole('button', { name: /have a key\?/ }))
    fireEvent.change(screen.getByLabelText(/API key or token/), { target: { value: secret } })
    fireEvent.click(screen.getByRole('button', { name: /run with my key/ }))

    fireEvent.click(await screen.findByRole('button', { name: /run a real call/ }))
    await waitFor(() => expect(sent).toHaveLength(3))
    expect(sent[2]).toEqual({ arena: 'payments', product: 'stripe', action: 'call', token: secret })
  })

  it('shows the sandbox-account option only when the worker advertises a provisioned credential', async () => {
    const { sent } = stubFetch([
      { ...authGated, sandboxAvailable: true },
      { ...keylessOk, auth: 'sandbox' },
    ])
    renderLive()
    runHandshake()

    fireEvent.click(await screen.findByRole('button', { name: /use our sandbox account/ }))
    await waitFor(() => expect(sent).toHaveLength(2))
    expect(sent[1]).toEqual({ arena: 'payments', product: 'stripe', useSandbox: true })
    expect(await screen.findByText(/authenticated handshake OK \(our sandbox account\)/)).toBeTruthy()
  })

  it('a rejected credential is badged as a rejection, not as absence of a server', async () => {
    stubFetch([
      authGated,
      { ...authGated, auth: 'byo-key' },
    ])
    renderLive()
    runHandshake()
    fireEvent.click(await screen.findByRole('button', { name: /have a key\?/ }))
    fireEvent.change(screen.getByLabelText(/API key or token/), { target: { value: 'bad-key' } })
    fireEvent.click(screen.getByRole('button', { name: /run with my key/ }))

    expect(await screen.findByText(/credential rejected — the server is live but did not accept it/)).toBeTruthy()
  })
})
