import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { createClient, type AinessClient } from './client.js'
import {
  getBattle,
  getProduct,
  getStoryVerdicts,
  AinessError,
  getRankings as fetchRankings,
  listArenas as fetchArenas,
  searchProducts as fetchSearchResults,
} from './tools.js'

function jsonResult(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] }
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true }
}

// Wraps a tool implementation so AinessError (and any other thrown error) comes back as
// a normal tool-error result instead of crashing the MCP connection.
function wrap<T>(fn: () => Promise<T>) {
  return fn().then(jsonResult, (err) => {
    if (err instanceof AinessError || err instanceof Error) return errorResult(err)
    return errorResult(new Error(String(err)))
  })
}

export function createServer(client: AinessClient = createClient()): McpServer {
  const server = new McpServer({ name: 'ainess-mcp', version: '0.1.0' })

  server.registerTool(
    'list_arenas',
    {
      title: 'List arenas',
      description: 'List every AIness category (id, name, description, personas, themes).',
      inputSchema: {},
    },
    async () => wrap(() => fetchArenas(client)),
  )

  server.registerTool(
    'get_rankings',
    {
      title: 'Get rankings',
      description: 'Get the leaderboard (scores, AI-Era Index, per-theme scores) and head-to-head battles for one arena category.',
      inputSchema: { category: z.string().describe('Category id, e.g. "desktop-os" — see list_arenas.') },
    },
    async ({ category }) => wrap(() => fetchRankings(client, category)),
  )

  server.registerTool(
    'get_product',
    {
      title: 'Get product',
      description: 'Get one product: its metadata, leaderboard entry, and every story verdict with rationale + cited evidence URLs.',
      inputSchema: {
        category: z.string().describe('Category id, e.g. "desktop-os" — see list_arenas.'),
        productId: z.string().describe('Product id within that category, e.g. "macos" — see get_rankings or search_products.'),
      },
    },
    async ({ category, productId }) => wrap(() => getProduct(client, category, productId)),
  )

  server.registerTool(
    'get_battle',
    {
      title: 'Get battle',
      description: 'Get the head-to-head battle result between two products in one category: record, winner, and per-story round margins.',
      inputSchema: {
        category: z.string().describe('Category id, e.g. "desktop-os" — see list_arenas.'),
        a: z.string().describe('First product id.'),
        b: z.string().describe('Second product id.'),
      },
    },
    async ({ category, a, b }) => wrap(() => getBattle(client, category, a, b)),
  )

  server.registerTool(
    'search_products',
    {
      title: 'Search products',
      description: 'Search for a product by name/vendor/id substring across every category. Returns (category, product) pairs to feed into get_product.',
      inputSchema: { query: z.string().describe('Case-insensitive substring to match against product id, name, or vendor.') },
    },
    async ({ query }) => wrap(() => fetchSearchResults(client, query)),
  )

  server.registerTool(
    'get_story_verdicts',
    {
      title: 'Get story verdicts',
      description: 'Get every product\'s verdict for one specific user story within a category — useful for comparing all products on a single capability.',
      inputSchema: {
        category: z.string().describe('Category id, e.g. "desktop-os" — see list_arenas.'),
        storyId: z.string().describe('Story id within that category, e.g. "agentic-mcp-server" — see get_rankings\' stories or the category\'s /arena/{category}/llms.md.'),
      },
    },
    async ({ category, storyId }) => wrap(() => getStoryVerdicts(client, category, storyId)),
  )

  return server
}
