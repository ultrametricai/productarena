// Unit tests for the worker's hand-rolled remote MCP endpoint (JSON-RPC layer + tool shaping),
// exercising handleJsonRpc with an injected fetchJson so no network or Workers runtime is
// needed. The tool shapes must mirror the stdio package's (mcp/src/tools.ts) — see that
// package's tests for the deeper per-tool coverage; this file focuses on the protocol layer
// and one representative call per tool family.
import { describe, expect, it } from 'vitest'
import { handleJsonRpc } from '../worker.js'

const CATEGORIES = [
  { id: 'desktop-os', name: 'Desktop OS', description: 'Desktop operating systems.', personas: ['developer'] },
]
const PRODUCTS = [
  { id: 'macos', name: 'macOS', vendor: 'Apple', type: 'commercial', urls: { site: 'https://apple.com/macos' } },
  { id: 'ubuntu', name: 'Ubuntu Desktop', vendor: 'Canonical', type: 'oss', urls: { site: 'https://ubuntu.com' } },
]
const STORIES = [
  { id: 'agentic-mcp-server', persona: 'ai-native', title: 'I can connect an agent via an official MCP server', theme: 'agenticness', group: 'agent-access', weight: 3 },
]
const VERDICTS = [
  { productId: 'macos', storyId: 'agentic-mcp-server', verdict: 'none', quality: 0, confidence: 'high', rationale: 'No MCP server found.', evidenceIds: ['macos-docs-1'] },
]
const EVIDENCE = [
  { id: 'macos-docs-1', tier: 'claimed-docs', url: 'https://apple.com/docs/1', excerpt: 'x', fetchedAt: '2026-08-01T00:00:00Z' },
]
const RANKINGS = {
  generatedAt: '2026-08-27T00:00:00Z',
  leaderboard: [
    { productId: 'ubuntu', score: 13.7, agentReady: 20, agenticApp: 0, apiQuality: null, aiEra: 4.8, applicable: 70, total: 77, themeScores: {} },
    { productId: 'macos', score: 12, agentReady: 15, agenticApp: 4, apiQuality: null, aiEra: 3.3, applicable: 72, total: 77, themeScores: {} },
  ],
  battles: [],
}

const ROUTES: Record<string, unknown> = {
  '/data/categories.json': CATEGORIES,
  '/data/desktop-os/products.json': PRODUCTS,
  '/data/desktop-os/stories.json': STORIES,
  '/data/desktop-os/verdicts.json': VERDICTS,
  '/data/desktop-os/rankings.json': RANKINGS,
  '/data/desktop-os/evidence/macos.json': EVIDENCE,
}

async function fetchJson(path: string) {
  if (path in ROUTES) return structuredClone(ROUTES[path])
  throw new Error(`upstream GET ${path} -> HTTP 404`)
}

// handleJsonRpc lives in dependency-free worker JS — loosen its inferred union so tests can
// poke at either the result or error branch without narrowing ceremony.
type RpcOutcome = { status: number; body: any }

const call = (message: unknown): Promise<RpcOutcome> =>
  handleJsonRpc(message, fetchJson) as Promise<RpcOutcome>

const rpc = (method: string, params?: unknown, id: number | null = 1) =>
  call({ jsonrpc: '2.0', id, method, params })

function toolText(body: any): string {
  return body.result.content[0].text
}

describe('handleJsonRpc protocol layer', () => {
  it('initialize negotiates a supported protocol version and advertises tools', async () => {
    const { status, body } = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } })
    expect(status).toBe(200)
    expect(body.result.protocolVersion).toBe('2025-06-18')
    expect(body.result.capabilities.tools).toBeDefined()
    expect(body.result.serverInfo.name).toBe('productarena-mcp')
  })

  it('falls back to the newest supported version for unknown client versions', async () => {
    const { body } = await rpc('initialize', { protocolVersion: '1999-01-01' })
    expect(body.result.protocolVersion).toBe('2025-06-18')
  })

  it('acknowledges notifications with 202 and no body', async () => {
    const { status, body } = await call({ jsonrpc: '2.0', method: 'notifications/initialized' })
    expect(status).toBe(202)
    expect(body).toBeNull()
  })

  it('answers ping and rejects unknown methods with -32601', async () => {
    expect((await rpc('ping')).body.result).toEqual({})
    const { body } = await rpc('resources/list')
    expect(body.error.code).toBe(-32601)
  })

  it('rejects batches and malformed messages with -32600', async () => {
    const batch = await call([{ jsonrpc: '2.0', id: 1, method: 'ping' }])
    expect(batch.status).toBe(400)
    expect(batch.body.error.code).toBe(-32600)
    const bad = await call({ hello: 'world' })
    expect(bad.body.error.code).toBe(-32600)
  })

  it('lists all eight tools with JSON Schema input schemas', async () => {
    const { body } = await rpc('tools/list')
    expect(body.result.tools.map((t: any) => t.name)).toEqual([
      'list_arenas', 'get_rankings', 'get_product', 'get_verdict',
      'search_products', 'compare', 'get_stacks', 'top_products',
    ])
    for (const tool of body.result.tools) {
      expect(tool.inputSchema.type).toBe('object')
      expect(tool.description.length).toBeGreaterThan(10)
    }
  })

  it('rejects unknown tools with -32602', async () => {
    const { body } = await rpc('tools/call', { name: 'nope', arguments: {} })
    expect(body.error.code).toBe(-32602)
  })
})

describe('handleJsonRpc tools/call', () => {
  it('list_arenas returns the categories', async () => {
    const { body } = await rpc('tools/call', { name: 'list_arenas', arguments: {} })
    expect(JSON.parse(toolText(body))).toEqual(CATEGORIES)
  })

  it('get_product joins rank + verdict summary', async () => {
    const { body } = await rpc('tools/call', { name: 'get_product', arguments: { arena: 'desktop-os', product: 'macos' } })
    const parsed = JSON.parse(toolText(body))
    expect(parsed.ranking.rank).toBe(2)
    expect(parsed.verdictCounts.none).toBe(1)
    expect(parsed.verdicts[0].storyTitle).toContain('MCP server')
  })

  it('get_verdict resolves evidence URLs', async () => {
    const { body } = await rpc('tools/call', { name: 'get_verdict', arguments: { arena: 'desktop-os', product: 'macos', story: 'agentic-mcp-server' } })
    const parsed = JSON.parse(toolText(body))
    expect(parsed.rationale).toBe('No MCP server found.')
    expect(parsed.evidence).toEqual([{ id: 'macos-docs-1', tier: 'claimed-docs', url: 'https://apple.com/docs/1' }])
  })

  it('compare + top_products shape cross-arena results', async () => {
    const cmp = await rpc('tools/call', { name: 'compare', arguments: { products: ['ubuntu', 'ghost'] } })
    const cmpParsed = JSON.parse(toolText(cmp.body))
    expect(cmpParsed.products[0]).toMatchObject({ productId: 'ubuntu', rank: 1, arenaScore: 4.8 })
    expect(cmpParsed.notFound).toEqual(['ghost'])

    const top = await rpc('tools/call', { name: 'top_products', arguments: { metric: 'agentReady', limit: 1 } })
    expect(JSON.parse(toolText(top.body))).toMatchObject([{ productId: 'ubuntu', value: 20 }])
  })

  it('caller mistakes come back as tool errors (isError), not protocol errors', async () => {
    const { body } = await rpc('tools/call', { name: 'get_rankings', arguments: { arena: 'nope' } })
    expect(body.error).toBeUndefined()
    expect(body.result.isError).toBe(true)
    expect(toolText(body)).toMatch(/unknown arena/)
  })

  it('missing required string args are reported as tool errors', async () => {
    const { body } = await rpc('tools/call', { name: 'get_rankings', arguments: {} })
    expect(body.result.isError).toBe(true)
    expect(toolText(body)).toMatch(/"arena" must be a non-empty string/)
  })
})
