// Unit tests for the worker's /api/mcp-probe (the "Try it" live MCP handshake): the probe
// itself with an injectable fetch (same pattern as mcp.test.ts's injected fetchJson — no
// network, no Workers runtime) plus the request handler's allowlist behavior, and the
// invariant that the worker's hardcoded MCP_ENDPOINTS never drifts from the generated
// lib/mcpEndpoints.ts the site builds against.
import { describe, expect, it } from 'vitest'
import { MCP_ENDPOINTS as SITE_ENDPOINTS } from '../../../lib/mcpEndpoints'
import { handleMcpProbe, MCP_ENDPOINTS, probeMcpEndpoint } from '../worker.js'

type FetchImpl = typeof fetch

// worker.js is dependency-free untyped JS — declare the probe summary shape the tests assert.
interface ProbeSummary {
  ok?: boolean
  endpoint?: string
  reachable: boolean
  authRequired: boolean
  oauth?: boolean
  httpStatus?: number
  handshake?: boolean
  serverInfo?: { name: string; version: string }
  protocolVersion?: string
  toolCount?: number
  toolNames?: string[]
}
interface SentRpc {
  method: string
  params?: { clientInfo?: { name: string } }
}
const probe = (endpoint: string, impl: FetchImpl) => probeMcpEndpoint(endpoint, impl) as Promise<ProbeSummary>

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

const initializeResult = {
  jsonrpc: '2.0',
  id: 1,
  result: {
    protocolVersion: '2025-06-18',
    capabilities: { tools: {} },
    serverInfo: { name: 'vendor-mcp', version: '1.2.3' },
  },
}
const toolsResult = {
  jsonrpc: '2.0',
  id: 2,
  result: { tools: Array.from({ length: 12 }, (_, i) => ({ name: `tool_${i}`, inputSchema: { type: 'object' } })) },
}

function fetchScript(responses: Array<Response | Error>): { impl: FetchImpl; calls: Array<{ url: string; body: SentRpc }> } {
  const calls: Array<{ url: string; body: SentRpc }> = []
  const impl: FetchImpl = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(init?.body as string) as SentRpc })
    const next = responses.shift()
    if (!next) throw new Error('fetchScript exhausted')
    if (next instanceof Error) throw next
    return next
  }
  return { impl, calls }
}

describe('probeMcpEndpoint', () => {
  it('reports a 401 with OAuth metadata as live + auth required (the honest common case)', async () => {
    const { impl, calls } = fetchScript([
      json({ error: 'unauthorized' }, 401, {
        'www-authenticate': 'Bearer resource_metadata=https://mcp.example.com/.well-known/oauth-protected-resource',
      }),
    ])
    const result = await probe('https://mcp.example.com/', impl)
    expect(result).toEqual({ reachable: true, authRequired: true, httpStatus: 401, oauth: true })
    // Only one request — no tools/list after an auth wall.
    expect(calls).toHaveLength(1)
    expect(calls[0].body.method).toBe('initialize')
    expect(calls[0].body.params?.clientInfo?.name).toBe('productarena-try-it')
  })

  it('completes a keyless handshake: serverInfo + capped tool names', async () => {
    const { impl, calls } = fetchScript([
      json(initializeResult, 200, { 'mcp-session-id': 'sess-1' }),
      json(toolsResult),
    ])
    const result = await probe('https://mcp.example.com/mcp', impl)
    expect(result.reachable).toBe(true)
    expect(result.authRequired).toBe(false)
    expect(result.handshake).toBe(true)
    expect(result.serverInfo).toEqual({ name: 'vendor-mcp', version: '1.2.3' })
    expect(result.protocolVersion).toBe('2025-06-18')
    expect(result.toolCount).toBe(12)
    expect(result.toolNames).toHaveLength(10) // capped at 10
    // Session id from initialize is echoed on the follow-up.
    expect(calls[1].body.method).toBe('tools/list')
  })

  it('parses an SSE-framed JSON-RPC response (streamable HTTP servers may answer with events)', async () => {
    const sse = new Response(
      `event: message\ndata: ${JSON.stringify(initializeResult)}\n\n`,
      { status: 200, headers: { 'content-type': 'text/event-stream' } },
    )
    const { impl } = fetchScript([sse, json(toolsResult)])
    const result = await probe('https://mcp.example.com/mcp', impl)
    expect(result.handshake).toBe(true)
    expect(result.serverInfo?.name).toBe('vendor-mcp')
  })

  it('reports network failure as unreachable, and a non-MCP 200 as reachable without handshake', async () => {
    const dead = fetchScript([new Error('connect timeout')])
    expect(await probe('https://mcp.example.com/', dead.impl)).toEqual({ reachable: false, authRequired: false })

    const html = fetchScript([new Response('<html>hi</html>', { status: 200, headers: { 'content-type': 'text/html' } })])
    const result = await probe('https://mcp.example.com/', html.impl)
    expect(result).toMatchObject({ reachable: true, authRequired: false, handshake: false, httpStatus: 200 })
  })

  it('still returns the handshake when tools/list fails keyless', async () => {
    const { impl } = fetchScript([json(initializeResult), json({ error: 'unauthorized' }, 401)])
    const result = await probe('https://mcp.example.com/mcp', impl)
    expect(result.handshake).toBe(true)
    expect(result.toolCount).toBeUndefined()
  })
})

describe('handleMcpProbe', () => {
  const probeRequest = (body: unknown, method = 'POST') =>
    new Request('https://ultrametric.ai/productarena/api/mcp-probe', {
      method,
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': `ip-${Math.random()}` },
      ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
    })

  it('probes only the allowlisted endpoint for a known (arena, product) — never a client URL', async () => {
    const { impl, calls } = fetchScript([json(initializeResult), json(toolsResult)])
    const resp = await handleMcpProbe(
      probeRequest({ arena: 'payments', product: 'stripe', url: 'https://evil.example.com/' }),
      impl,
    )
    expect(resp.status).toBe(200)
    const body = (await resp.json()) as ProbeSummary & { arena: string; product: string }
    expect(body.ok).toBe(true)
    expect(body.endpoint).toBe(MCP_ENDPOINTS['payments/stripe'])
    // The client-supplied url field is ignored — every upstream call hits the allowlist entry.
    for (const call of calls) expect(call.url).toBe(MCP_ENDPOINTS['payments/stripe'])
  })

  it('404s products without an allowlisted endpoint and 400s malformed bodies', async () => {
    const none = await handleMcpProbe(probeRequest({ arena: 'ai-coding', product: 'claude-code' }))
    expect(none.status).toBe(404)

    const bad = await handleMcpProbe(probeRequest({ arena: 'payments' }))
    expect(bad.status).toBe(400)

    const notPost = await handleMcpProbe(probeRequest(null, 'GET'))
    expect(notPost.status).toBe(405)
  })
})

describe('MCP_ENDPOINTS allowlist', () => {
  it('stays in sync with the generated lib/mcpEndpoints.ts (regenerate + paste on drift)', () => {
    expect(MCP_ENDPOINTS).toEqual(SITE_ENDPOINTS)
  })

  it('contains only https vendor mcp.* hosts with bare transport paths', () => {
    expect(Object.keys(MCP_ENDPOINTS).length).toBeGreaterThan(0)
    for (const [key, endpoint] of Object.entries(MCP_ENDPOINTS)) {
      expect(key).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+$/)
      const url = new URL(endpoint)
      expect(url.protocol).toBe('https:')
      expect(url.hostname.startsWith('mcp.')).toBe(true)
      expect(['/', '/mcp', '/sse']).toContain(url.pathname)
      expect(url.search).toBe('')
    }
  })
})
