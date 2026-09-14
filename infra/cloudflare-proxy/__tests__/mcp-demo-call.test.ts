// Unit tests for the "Try it" demo-call and credential tiers of /api/mcp-probe
// (infra/cloudflare-proxy/worker.js): action: 'call' validation (curated tool/args only, never
// client-supplied), response truncation, the BYO-key security invariants (Authorization
// forwarded exactly once vendor-ward, never logged, scrubbed from responses), the sandbox
// DEMO_CRED_* tier, the in-process self demo, and the invariant that the worker's hardcoded
// MCP_DEMO_CALLS never drifts from the generated lib/mcpDemoCalls.ts.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MCP_DEMO_CALLS as SITE_DEMO_CALLS } from '../../../lib/mcpDemoCalls'
import { MCP_ENDPOINTS as SITE_ENDPOINTS } from '../../../lib/mcpEndpoints'
import { callMcpDemo, handleMcpProbe as handleMcpProbeJs, MCP_DEMO_CALLS, MCP_ENDPOINTS } from '../worker.js'

type FetchImpl = typeof fetch

// worker.js is dependency-free untyped JS whose optional params TS infers from their defaults —
// re-type the handler with the shapes these tests exercise (env secrets, injected fetchJson).
const handleMcpProbe = handleMcpProbeJs as (
  request: Request,
  fetchImpl?: FetchImpl,
  env?: Record<string, string>,
  selfFetchJson?: (path: string) => Promise<unknown>,
) => Promise<Response>
const ENDPOINTS = MCP_ENDPOINTS as Record<string, string>

interface SentRpc {
  method: string
  params?: { name?: string; arguments?: Record<string, unknown> }
}
interface Call {
  url: string
  method: string
  headers: Record<string, string>
  body?: SentRpc
}
interface CallSummary {
  ok?: boolean
  error?: string
  auth?: string
  endpoint?: string
  reachable?: boolean
  authRequired?: boolean
  httpStatus?: number
  handshake?: boolean
  serverInfo?: { name: string; version: string }
  demoCall?: { tool: string; label: string }
  sandboxAvailable?: boolean
  toolCount?: number
  call?: { tool: string; label: string; ok: boolean; error?: string; isError?: boolean; resultText?: string; truncated?: boolean }
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

const initializeResult = {
  jsonrpc: '2.0',
  id: 1,
  result: { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'vendor-mcp', version: '1.2.3' } },
}
const toolText = (text: string, isError = false) =>
  ({ jsonrpc: '2.0', id: 2, result: { content: [{ type: 'text', text }], isError } })

function fetchScript(responses: Array<Response | Error>): { impl: FetchImpl; calls: Call[] } {
  const calls: Call[] = []
  const impl: FetchImpl = async (url, init) => {
    const headers = Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]))
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as SentRpc) : undefined
    calls.push({ url: String(url), method: init?.method ?? 'GET', headers, body })
    const next = responses.shift()
    if (!next) throw new Error('fetchScript exhausted')
    if (next instanceof Error) throw next
    return next
  }
  return { impl, calls }
}

const probeRequest = (body: unknown) =>
  new Request('https://ultrametric.ai/productarena/api/mcp-probe', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': `ip-${Math.random()}` },
    body: JSON.stringify(body),
  })

// The three-message happy-path script for one demo call: initialize (202-ack the initialized
// notification) then the tools/call answer.
const callScript = (resultText: string, isError = false) => [
  json(initializeResult),
  new Response(null, { status: 202 }),
  json(toolText(resultText, isError)),
]

afterEach(() => vi.restoreAllMocks())

describe('MCP_DEMO_CALLS curation invariants', () => {
  it('stays in sync with the generated lib/mcpDemoCalls.ts (regenerate + paste on drift)', () => {
    expect(MCP_DEMO_CALLS).toEqual(SITE_DEMO_CALLS)
  })

  it('every demo key is allowlisted (or the in-process self endpoint) with sane shapes', () => {
    expect(Object.keys(MCP_DEMO_CALLS).length).toBeGreaterThan(0)
    for (const [key, demo] of Object.entries(MCP_DEMO_CALLS) as Array<[string, { tool: string; args: object; label: string }]>) {
      expect(key).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+$/)
      if (key !== 'self/productarena') expect(ENDPOINTS[key]).toBeDefined()
      expect(demo.tool.length).toBeGreaterThan(0)
      expect(demo.label.length).toBeGreaterThan(0)
      expect(typeof demo.args).toBe('object')
    }
    // and both maps' shared source stays consistent with the site allowlist
    expect(MCP_ENDPOINTS).toEqual(SITE_ENDPOINTS)
  })
})

describe('action: "call" — curated demo tool calls', () => {
  it('executes exactly the shipped (tool, args) — client-supplied tool/args/url are ignored', async () => {
    const { impl, calls } = fetchScript(callScript('4 results for "sign in with google"'))
    const resp = await handleMcpProbe(
      probeRequest({
        arena: 'auth-platforms',
        product: 'better-auth',
        action: 'call',
        // an attacker-shaped body: none of this may reach the vendor
        tool: 'delete_everything',
        args: { path: '/' },
        url: 'https://evil.example.net/',
      }),
      impl,
    )
    expect(resp.status).toBe(200)
    const body = (await resp.json()) as CallSummary
    expect(body.ok).toBe(true)
    expect(body.auth).toBe('keyless')
    expect(body.call).toMatchObject({ tool: 'search_docs', ok: true, isError: false, truncated: false })
    expect(body.call?.resultText).toContain('sign in with google')

    // Wire-level: initialize → notifications/initialized → tools/call, all to the allowlisted
    // endpoint, with the canned arguments from data/mcp-demo-calls.json.
    expect(calls.map((c) => c.url)).toEqual(Array(3).fill(MCP_ENDPOINTS['auth-platforms/better-auth']))
    expect(calls[2].body?.method).toBe('tools/call')
    expect(calls[2].body?.params?.name).toBe('search_docs')
    expect(calls[2].body?.params?.arguments).toEqual({ query: 'sign in with google' })
  })

  it('truncates oversized results to ~2KB and says so', async () => {
    const big = 'x'.repeat(10_000)
    const { impl } = fetchScript(callScript(big))
    const resp = await handleMcpProbe(probeRequest({ arena: 'voice-agents', product: 'retell', action: 'call' }), impl)
    const body = (await resp.json()) as CallSummary
    expect(body.call?.ok).toBe(true)
    expect(body.call?.resultText).toHaveLength(2048)
    expect(body.call?.truncated).toBe(true)
  })

  it('404s products without a curated demo call — the tool list is the only door in', async () => {
    const { impl, calls } = fetchScript([])
    const resp = await handleMcpProbe(probeRequest({ arena: 'payments', product: 'stripe', action: 'call' }), impl)
    expect(resp.status).toBe(404)
    expect(calls).toHaveLength(0) // nothing was sent upstream
  })

  it('reports an auth wall on the call honestly and a tool isError verbatim-but-bounded', async () => {
    const gated = fetchScript([json({ error: 'unauthorized' }, 401, { 'www-authenticate': 'Bearer' })])
    const resp = await handleMcpProbe(probeRequest({ arena: 'voice-agents', product: 'retell', action: 'call' }), gated.impl)
    expect((await resp.json()) as CallSummary).toMatchObject({ ok: true, reachable: true, authRequired: true, httpStatus: 401 })

    const toolErr = fetchScript(callScript('Error: no such thing', true))
    const errBody = (await (await handleMcpProbe(probeRequest({ arena: 'voice-agents', product: 'retell', action: 'call' }), toolErr.impl)).json()) as CallSummary
    expect(errBody.call).toMatchObject({ ok: true, isError: true, resultText: 'Error: no such thing' })
  })

  it('runs the self demo in-process — the network fetchImpl is never touched', async () => {
    const { impl, calls } = fetchScript([]) // would throw if used
    const fetchJson = async (path: string) => {
      if (path === '/data/categories.json') return [{ id: 'payments' }]
      if (path === '/data/payments/products.json') return [{ id: 'stripe', name: 'Stripe', vendor: 'Stripe, Inc.' }]
      if (path === '/data/payments/rankings.json') return { leaderboard: [{ productId: 'stripe', agentReady: 88.9, score: 61.9, aiEra: 55.3 }] }
      throw new Error(`unexpected ${path}`)
    }
    const resp = await handleMcpProbe(probeRequest({ arena: 'self', product: 'productarena', action: 'call' }), impl, undefined, fetchJson)
    expect(resp.status).toBe(200)
    const body = (await resp.json()) as CallSummary
    expect(calls).toHaveLength(0)
    expect(body.handshake).toBe(true)
    expect(body.serverInfo?.name).toBe('productarena-mcp')
    expect(body.call?.tool).toBe('top_products')
    expect(body.call?.ok).toBe(true)
    expect(body.call?.resultText).toContain('stripe')
  })
})

describe('BYO-key tier — credentials are forwarded once, never logged, never echoed', () => {
  const TOKEN = 'sk_test_51VisitorPastedThisSecret'

  it('forwards the token as a Bearer Authorization header to the allowlisted vendor only', async () => {
    const { impl, calls } = fetchScript(callScript('ok'))
    await handleMcpProbe(probeRequest({ arena: 'voice-agents', product: 'retell', action: 'call', token: TOKEN }), impl)
    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(call.url).toBe(MCP_ENDPOINTS['voice-agents/retell'])
      expect(call.headers.authorization).toBe(`Bearer ${TOKEN}`)
    }
  })

  it('keeps a full header-style credential verbatim and strips header-splitting control chars', async () => {
    const { impl, calls } = fetchScript([json({ error: 'unauthorized' }, 401)])
    await handleMcpProbe(probeRequest({ arena: 'payments', product: 'stripe', token: 'Basic dXNlcjpwYXNz' }), impl)
    expect(calls[0].headers.authorization).toBe('Basic dXNlcjpwYXNz')

    const sneaky = fetchScript([json({ error: 'unauthorized' }, 401)])
    await handleMcpProbe(probeRequest({ arena: 'payments', product: 'stripe', token: 'abc\r\nx-injected: 1' }), sneaky.impl)
    expect(sneaky.calls[0].headers.authorization).toBe('Bearer abcx-injected: 1')
    expect(sneaky.calls[0].headers['x-injected']).toBeUndefined()
  })

  it('scrubs the credential from the response even when the vendor echoes it', async () => {
    const { impl } = fetchScript(callScript(`debug: caller authenticated as Bearer ${TOKEN} — hello`))
    const resp = await handleMcpProbe(probeRequest({ arena: 'voice-agents', product: 'retell', action: 'call', token: TOKEN }), impl)
    const text = await resp.text()
    expect(text).not.toContain(TOKEN)
    expect(text).toContain('[redacted]')
  })

  it('a rejected key comes back as authRequired under auth: "byo-key" — with the wall metadata fetch skipped', async () => {
    const { impl, calls } = fetchScript([json({ error: 'nope' }, 401, { 'www-authenticate': 'Bearer resource_metadata="https://mcp.stripe.com/meta"' })])
    const resp = await handleMcpProbe(probeRequest({ arena: 'payments', product: 'stripe', token: TOKEN }), impl)
    const body = (await resp.json()) as CallSummary
    expect(body).toMatchObject({ ok: true, auth: 'byo-key', reachable: true, authRequired: true, httpStatus: 401 })
    expect(calls).toHaveLength(1) // no RFC 9728 enrichment GET after an authenticated attempt
  })

  it('NEVER logs during a credentialed request (the "never logged" promise is code, not copy)', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m))
    const { impl } = fetchScript(callScript(`echo ${TOKEN}`))
    await handleMcpProbe(probeRequest({ arena: 'voice-agents', product: 'retell', action: 'call', token: TOKEN }), impl)
    for (const spy of spies) expect(spy).not.toHaveBeenCalled()
  })

  it('worker.js contains no console statements at all — nothing to accidentally log a header', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const src = fs.readFileSync(path.resolve(__dirname, '../worker.js'), 'utf8')
    expect(src).not.toMatch(/console\s*\./)
  })
})

describe('sandbox tier — DEMO_CRED_<PRODUCTID> wrangler secrets', () => {
  const env = { DEMO_CRED_STRIPE: 'sk_test_ourSandboxAccountCredential' }

  it('advertises sandboxAvailable on the probe only when the secret is provisioned', async () => {
    const withCred = fetchScript([json({ error: 'unauthorized' }, 401, { 'www-authenticate': 'Bearer' }), json({}, 404)])
    const body = (await (await handleMcpProbe(probeRequest({ arena: 'payments', product: 'stripe' }), withCred.impl, env)).json()) as CallSummary
    expect(body.sandboxAvailable).toBe(true)

    const without = fetchScript([json({ error: 'unauthorized' }, 401, { 'www-authenticate': 'Bearer' }), json({}, 404)])
    const bare = (await (await handleMcpProbe(probeRequest({ arena: 'payments', product: 'stripe' }), without.impl, {})).json()) as CallSummary
    expect(bare.sandboxAvailable).toBeUndefined()
  })

  it('useSandbox authenticates with the server-side secret and scrubs it from the response', async () => {
    const { impl, calls } = fetchScript([json(initializeResult), json({ jsonrpc: '2.0', id: 2, result: { tools: [{ name: `echo ${env.DEMO_CRED_STRIPE}` }] } })])
    const resp = await handleMcpProbe(probeRequest({ arena: 'payments', product: 'stripe', useSandbox: true }), impl, env)
    const text = await resp.text()
    const body = JSON.parse(text) as CallSummary
    expect(body.auth).toBe('sandbox')
    expect(body.handshake).toBe(true)
    expect(calls[0].headers.authorization).toBe(`Bearer ${env.DEMO_CRED_STRIPE}`)
    expect(text).not.toContain(env.DEMO_CRED_STRIPE)
  })

  it('404s useSandbox when no secret is provisioned — the tier simply is not offered', async () => {
    const { impl, calls } = fetchScript([])
    const resp = await handleMcpProbe(probeRequest({ arena: 'payments', product: 'paypal', useSandbox: true }), impl, env)
    expect(resp.status).toBe(404)
    expect(calls).toHaveLength(0)
  })
})

describe('callMcpDemo transport edges', () => {
  const demo = { tool: 't', args: {}, label: 'l' }

  it('reports unreachable and non-MCP endpoints honestly', async () => {
    const dead = fetchScript([new Error('timeout')])
    expect(await callMcpDemo('https://mcp.example.com/', demo, dead.impl)).toEqual({ reachable: false, authRequired: false })

    const html = fetchScript([new Response('<html>', { status: 200 })])
    expect(await callMcpDemo('https://mcp.example.com/', demo, html.impl)).toMatchObject({ reachable: true, handshake: false, httpStatus: 200 })
  })

  it('surfaces an RPC-level rejection of the call as a bounded error, not a fake result', async () => {
    const { impl } = fetchScript([
      json(initializeResult),
      new Response(null, { status: 202 }),
      json({ jsonrpc: '2.0', id: 2, error: { code: -32602, message: 'unknown tool "t"' } }),
    ])
    const result = (await callMcpDemo('https://mcp.example.com/', demo, impl)) as CallSummary
    expect(result.call?.ok).toBe(false)
    expect(result.call?.error).toContain('unknown tool')
  })
})
