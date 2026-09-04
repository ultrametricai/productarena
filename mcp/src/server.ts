import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { createClient, type ArenaClient } from './client.js'
import {
  ArenaError,
  compare,
  getProduct,
  getStacks,
  getVerdict,
  getRankings as fetchRankings,
  listArenas as fetchArenas,
  searchProducts as fetchSearchResults,
  TOP_METRICS,
  topProducts,
} from './tools.js'

export const SERVER_VERSION = '0.2.0'

function jsonResult(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] }
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true }
}

// Wraps a tool implementation so ArenaError (and any other thrown error) comes back as
// a normal tool-error result instead of crashing the MCP connection.
function wrap<T>(fn: () => Promise<T>) {
  return fn().then(jsonResult, (err) => {
    if (err instanceof ArenaError || err instanceof Error) return errorResult(err)
    return errorResult(new Error(String(err)))
  })
}

export function createServer(client: ArenaClient = createClient()): McpServer {
  const server = new McpServer({ name: 'productarena-mcp', version: SERVER_VERSION })

  server.registerTool(
    'list_arenas',
    {
      title: 'List arenas',
      description: 'List every ProductArena arena/category (id, name, description, personas, themes).',
      inputSchema: {},
    },
    async () => wrap(() => fetchArenas(client)),
  )

  server.registerTool(
    'get_rankings',
    {
      title: 'Get rankings',
      description:
        'Get one arena\'s full leaderboard (coverage score, Arena Score as "aiEra", agent-readiness, per-theme scores) plus its head-to-head battle log.',
      inputSchema: { arena: z.string().describe('Arena id, e.g. "desktop-os" — see list_arenas.') },
    },
    async ({ arena }) => wrap(() => fetchRankings(client, arena)),
  )

  server.registerTool(
    'get_product',
    {
      title: 'Get product',
      description:
        'Get one product: metadata, leaderboard entry with rank, verdict counts, and a per-story verdict summary. For any single verdict\'s rationale and cited evidence URLs, follow up with get_verdict.',
      inputSchema: {
        arena: z.string().describe('Arena id, e.g. "desktop-os" — see list_arenas.'),
        product: z.string().describe('Product id within that arena, e.g. "macos" — see get_rankings or search_products.'),
      },
    },
    async ({ arena, product }) => wrap(() => getProduct(client, arena, product)),
  )

  server.registerTool(
    'get_verdict',
    {
      title: 'Get verdict',
      description:
        'Get the full judged verdict for one (product, story) cell: verdict tier, quality, confidence, rationale, and the cited evidence URLs.',
      inputSchema: {
        arena: z.string().describe('Arena id, e.g. "desktop-os" — see list_arenas.'),
        product: z.string().describe('Product id within that arena — see get_product or search_products.'),
        story: z.string().describe('Story id — see get_product\'s verdicts list for valid ids.'),
      },
    },
    async ({ arena, product, story }) => wrap(() => getVerdict(client, arena, product, story)),
  )

  server.registerTool(
    'search_products',
    {
      title: 'Search products',
      description:
        'Search for products by id/name/vendor substring across every arena. Returns (arena, product) pairs to feed into get_product or compare.',
      inputSchema: { query: z.string().describe('Case-insensitive substring to match against product id, name, or vendor.') },
    },
    async ({ query }) => wrap(() => fetchSearchResults(client, query)),
  )

  server.registerTool(
    'compare',
    {
      title: 'Compare products',
      description:
        'Compare products across arenas by score: coverage score, Arena Score, agent-readiness, AI-native score, API quality, and each product\'s rank within its own arena. Product ids are globally unique — no arena argument needed.',
      inputSchema: {
        products: z.array(z.string()).min(1).describe('Product ids to compare, e.g. ["linear", "jira"] — see search_products.'),
      },
    },
    async ({ products }) => wrap(() => compare(client, products)),
  )

  server.registerTool(
    'get_stacks',
    {
      title: 'Get AI stacks',
      description:
        'Get ProductArena\'s curated cross-arena AI stacks (e.g. "local sovereign stack") with every scored slot resolved LIVE from current arena leaderboards; editorial slots are labeled as such.',
      inputSchema: {},
    },
    async () => wrap(() => getStacks(client)),
  )

  server.registerTool(
    'top_products',
    {
      title: 'Top products',
      description:
        'Cross-arena top-N: flattens every arena\'s leaderboard and ranks all products by one metric. Metrics: score (story coverage), arenaScore (Arena Score / aiEra), agentReady, agenticApp, apiQuality.',
      inputSchema: {
        metric: z.enum(TOP_METRICS).describe('Metric to rank by.'),
        limit: z.number().int().min(1).max(50).optional().describe('How many products to return (default 10, max 50).'),
      },
    },
    async ({ metric, limit }) => wrap(() => topProducts(client, metric, limit)),
  )

  return server
}
