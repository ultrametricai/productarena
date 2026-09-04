import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '../client'
import {
  ArenaError,
  compare,
  getProduct,
  getStacks,
  getVerdict,
  getRankings,
  listArenas,
  searchProducts,
  topProducts,
} from '../tools'

const BASE_URL = 'https://arena.example'

const CATEGORIES = [
  { id: 'desktop-os', name: 'Desktop OS', description: 'Desktop operating systems.', personas: ['developer'] },
  { id: 'code-hosting', name: 'Code Hosting', description: 'Git hosting platforms.', personas: ['developer'] },
]

const PRODUCTS = [
  { id: 'macos', name: 'macOS', vendor: 'Apple', type: 'commercial' as const, urls: { site: 'https://apple.com/macos' } },
  { id: 'ubuntu', name: 'Ubuntu Desktop', vendor: 'Canonical', type: 'oss' as const, urls: { site: 'https://ubuntu.com' } },
]

const HOSTING_PRODUCTS = [
  { id: 'github', name: 'GitHub', vendor: 'Microsoft', type: 'commercial' as const, urls: { site: 'https://github.com' } },
]

const STORIES = [
  { id: 'agentic-mcp-server', persona: 'ai-native', title: 'I can connect an agent via an official MCP server', theme: 'agenticness', group: 'agent-access', weight: 3 },
]

const EVIDENCE_MACOS = [
  { id: 'macos-docs-1', tier: 'claimed-docs' as const, url: 'https://apple.com/docs/1', excerpt: 'no MCP mentioned', fetchedAt: '2026-08-01T00:00:00Z' },
]

const VERDICTS = [
  {
    productId: 'macos', storyId: 'agentic-mcp-server', verdict: 'none' as const, quality: 0,
    confidence: 'high' as const, rationale: 'No MCP server found.', evidenceIds: ['macos-docs-1', 'missing-evidence-id'],
  },
  {
    productId: 'ubuntu', storyId: 'agentic-mcp-server', verdict: 'partial' as const, quality: 4,
    confidence: 'medium' as const, rationale: 'Community MCP server only.', evidenceIds: [],
  },
]

const RANKINGS = {
  generatedAt: '2026-08-27T00:00:00Z',
  leaderboard: [
    { productId: 'ubuntu', score: 13.7, agentReady: 20, agenticApp: 0, apiQuality: null, aiEra: 4.8, applicable: 70, total: 77, themeScores: {} },
    { productId: 'macos', score: 12, agentReady: 15, agenticApp: 4, apiQuality: null, aiEra: 3.3, applicable: 72, total: 77, themeScores: {} },
  ],
  battles: [
    {
      a: 'macos', b: 'ubuntu', winner: 'ubuntu', record: { aWins: 10, bWins: 15, draws: 5 },
      rounds: [{ storyId: 'agentic-mcp-server', winner: 'draw' as const, margin: 0 }],
    },
  ],
}

const HOSTING_RANKINGS = {
  generatedAt: '2026-08-27T00:00:00Z',
  leaderboard: [
    { productId: 'github', score: 55, agentReady: 60, agenticApp: 30, apiQuality: 70, aiEra: 50, applicable: 40, total: 44, themeScores: {} },
  ],
  battles: [],
}

const STACKS = [
  {
    id: 'local-sovereign',
    name: 'Local sovereign stack',
    tagline: 'Agents on your own metal.',
    audience: 'Privacy-first builders.',
    slots: [
      { role: 'Operating system', why: 'The floor.', pick: { kind: 'arena-top' as const, arenaId: 'desktop-os', metric: 'agentReady' as const, ossOnly: true } },
      { role: 'Code hosting', why: 'Where the code lives.', pick: { kind: 'product' as const, arenaId: 'code-hosting', productId: 'github', metric: 'agentReady' as const, note: 'Pairs with everything.' } },
      { role: 'Model', why: 'The brain.', pick: { kind: 'editorial' as const, name: 'Qwen3-Coder', url: 'https://example.com', note: 'Not an arena yet.' } },
      { role: 'Ghost slot', why: 'Arena not live.', pick: { kind: 'arena-top' as const, arenaId: 'not-live', metric: 'agentReady' as const } },
    ],
  },
]

const ROUTES: Record<string, unknown> = {
  '/data/categories.json': CATEGORIES,
  '/data/ai-stacks.json': STACKS,
  '/data/desktop-os/products.json': PRODUCTS,
  '/data/desktop-os/stories.json': STORIES,
  '/data/desktop-os/verdicts.json': VERDICTS,
  '/data/desktop-os/rankings.json': RANKINGS,
  '/data/desktop-os/evidence/macos.json': EVIDENCE_MACOS,
  '/data/desktop-os/evidence/ubuntu.json': [],
  '/data/code-hosting/products.json': HOSTING_PRODUCTS,
  '/data/code-hosting/rankings.json': HOSTING_RANKINGS,
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn(async (input: string | URL) => {
    const url = String(input)
    const path = url.slice(BASE_URL.length)
    if (path in ROUTES) {
      return { ok: true, json: async () => ROUTES[path] } as Response
    }
    return { ok: false, status: 404, json: async () => ({}) } as Response
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const client = () => createClient(BASE_URL)

describe('listArenas', () => {
  it('fetches categories.json', async () => {
    const result = await listArenas(client())
    expect(result).toEqual(CATEGORIES)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/data/categories.json`)
  })
})

describe('getRankings', () => {
  it('returns rankings for a known arena', async () => {
    const result = await getRankings(client(), 'desktop-os')
    expect(result).toEqual(RANKINGS)
  })

  it('rejects an unknown arena before fetching rankings', async () => {
    await expect(getRankings(client(), 'nope')).rejects.toThrow(ArenaError)
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/nope/'))
  })
})

describe('getProduct', () => {
  it('joins product, rank, verdict counts, and verdict summaries', async () => {
    const result = await getProduct(client(), 'desktop-os', 'macos')
    expect(result.product.name).toBe('macOS')
    expect(result.ranking).toMatchObject({ score: 12, rank: 2 })
    expect(result.verdictCounts).toEqual({ full: 0, partial: 0, none: 1, disputed: 0, na: 0 })
    expect(result.verdicts).toEqual([
      {
        storyId: 'agentic-mcp-server',
        storyTitle: 'I can connect an agent via an official MCP server',
        verdict: 'none',
        quality: 0,
        confidence: 'high',
      },
    ])
  })

  it('throws ArenaError for an unknown product', async () => {
    await expect(getProduct(client(), 'desktop-os', 'nonexistent')).rejects.toThrow(/unknown product/)
  })
})

describe('getVerdict', () => {
  it('returns the full cell: rationale plus resolved evidence URLs, dropping dangling ids', async () => {
    const result = await getVerdict(client(), 'desktop-os', 'macos', 'agentic-mcp-server')
    expect(result).toMatchObject({
      productName: 'macOS',
      storyTitle: 'I can connect an agent via an official MCP server',
      storyWeight: 3,
      verdict: 'none',
      rationale: 'No MCP server found.',
    })
    expect(result.evidence).toEqual([{ id: 'macos-docs-1', tier: 'claimed-docs', url: 'https://apple.com/docs/1' }])
  })

  it('survives a missing evidence pack without throwing', async () => {
    const result = await getVerdict(client(), 'desktop-os', 'ubuntu', 'agentic-mcp-server')
    expect(result.evidence).toEqual([])
    expect(result.verdict).toBe('partial')
  })

  it('throws ArenaError for an unknown story id', async () => {
    await expect(getVerdict(client(), 'desktop-os', 'macos', 'nonexistent')).rejects.toThrow(/unknown story/)
  })
})

describe('searchProducts', () => {
  it('matches by id, name, or vendor across all arenas', async () => {
    const byVendor = await searchProducts(client(), 'canonical')
    expect(byVendor).toEqual([{ arena: 'desktop-os', product: PRODUCTS[1] }])

    const byName = await searchProducts(client(), 'gitHub')
    expect(byName).toEqual([{ arena: 'code-hosting', product: HOSTING_PRODUCTS[0] }])
  })

  it('returns an empty array for an empty query without fetching anything', async () => {
    fetchMock.mockClear()
    const result = await searchProducts(client(), '   ')
    expect(result).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('compare', () => {
  it('locates each product in its own arena and reports rank + scores', async () => {
    const result = await compare(client(), ['macos', 'github', 'ghost'])
    expect(result.notFound).toEqual(['ghost'])
    expect(result.products).toHaveLength(2)
    const macos = result.products.find((p) => p.productId === 'macos')!
    expect(macos).toMatchObject({ arena: 'desktop-os', rank: 2, fieldSize: 2, score: 12, arenaScore: 3.3 })
    const github = result.products.find((p) => p.productId === 'github')!
    expect(github).toMatchObject({ arena: 'code-hosting', rank: 1, apiQuality: 70 })
  })

  it('dedupes and normalizes ids, and rejects an empty list', async () => {
    const result = await compare(client(), [' MacOS ', 'macos'])
    expect(result.products).toHaveLength(1)
    await expect(compare(client(), ['  '])).rejects.toThrow(ArenaError)
  })
})

describe('getStacks', () => {
  it('resolves arena-top (ossOnly), curated product, and editorial slots; drops dead arenas', async () => {
    const [stack] = await getStacks(client())
    expect(stack.id).toBe('local-sovereign')
    expect(stack.slots).toHaveLength(3) // ghost slot dropped

    const os = stack.slots[0]
    // ossOnly: ubuntu wins even though it would win anyway; macos (commercial) excluded from field
    expect(os).toMatchObject({ kind: 'arena-top', productId: 'ubuntu', productName: 'Ubuntu Desktop', metric: 'agentReady', metricValue: 20, rank: 1 })

    const hosting = stack.slots[1]
    expect(hosting).toMatchObject({ kind: 'product', productId: 'github', note: 'Pairs with everything.', metricValue: 60 })

    const editorial = stack.slots[2]
    expect(editorial).toMatchObject({ kind: 'editorial', productId: null, note: 'Not an arena yet.', editorialUrl: 'https://example.com' })
  })
})

describe('topProducts', () => {
  it('flattens every arena and ranks by the metric, capping at limit', async () => {
    const top = await topProducts(client(), 'agentReady', 2)
    expect(top.map((t) => t.productId)).toEqual(['github', 'ubuntu'])
    expect(top[0]).toMatchObject({ arena: 'code-hosting', value: 60, metric: 'agentReady' })
  })

  it('maps arenaScore (and the aiEra alias) onto the aiEra field and skips nulls', async () => {
    const top = await topProducts(client(), 'arenaScore')
    expect(top[0]).toMatchObject({ productId: 'github', value: 50 })
    const viaAlias = await topProducts(client(), 'aiEra')
    expect(viaAlias[0].value).toBe(50)
    // apiQuality is null for both desktop-os products — only github qualifies
    const api = await topProducts(client(), 'apiQuality')
    expect(api.map((t) => t.productId)).toEqual(['github'])
  })

  it('throws ArenaError for an unknown metric', async () => {
    await expect(topProducts(client(), 'vibes')).rejects.toThrow(/unknown metric/)
  })
})
