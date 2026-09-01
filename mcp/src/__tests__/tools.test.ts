import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '../client'
import {
  getBattle,
  getProduct,
  getStoryVerdicts,
  getRankings,
  listArenas,
  AinessError,
  searchProducts,
} from '../tools'

const BASE_URL = 'https://ainess.example'

const CATEGORIES = [
  { id: 'desktop-os', name: 'Desktop OS', description: 'Desktop operating systems.', personas: ['developer'] },
  { id: 'code-hosting', name: 'Code Hosting', description: 'Git hosting platforms.', personas: ['developer'] },
]

const PRODUCTS = [
  { id: 'macos', name: 'macOS', vendor: 'Apple', type: 'commercial' as const, urls: { site: 'https://apple.com/macos' } },
  { id: 'ubuntu', name: 'Ubuntu Desktop', vendor: 'Canonical', type: 'oss' as const, urls: { site: 'https://ubuntu.com' } },
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
    confidence: 'high' as const, rationale: 'No MCP server found.', evidenceIds: ['macos-docs-1'],
  },
  {
    productId: 'ubuntu', storyId: 'agentic-mcp-server', verdict: 'none' as const, quality: 0,
    confidence: 'medium' as const, rationale: 'No MCP server found.', evidenceIds: [],
  },
]

const RANKINGS = {
  generatedAt: '2026-08-27T00:00:00Z',
  leaderboard: [
    { productId: 'macos', score: 12, agentReady: 0, agenticApp: 4, apiQuality: 0, aiEra: 3.3, applicable: 72, total: 77, themeScores: {} },
    { productId: 'ubuntu', score: 13.7, agentReady: 0, agenticApp: 0, apiQuality: 0, aiEra: 4.8, applicable: 70, total: 77, themeScores: {} },
  ],
  battles: [
    {
      a: 'macos', b: 'ubuntu', winner: 'ubuntu', record: { aWins: 10, bWins: 15, draws: 5 },
      rounds: [{ storyId: 'agentic-mcp-server', winner: 'draw' as const, margin: 0 }],
    },
  ],
}

const ROUTES: Record<string, unknown> = {
  '/data/categories.json': CATEGORIES,
  '/data/desktop-os/products.json': PRODUCTS,
  '/data/desktop-os/stories.json': STORIES,
  '/data/desktop-os/verdicts.json': VERDICTS,
  '/data/desktop-os/rankings.json': RANKINGS,
  '/data/desktop-os/evidence/macos.json': EVIDENCE_MACOS,
  '/data/desktop-os/evidence/ubuntu.json': [],
  '/data/code-hosting/products.json': [],
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
  it('returns rankings for a known category', async () => {
    const result = await getRankings(client(), 'desktop-os')
    expect(result).toEqual(RANKINGS)
  })

  it('rejects an unknown category before fetching rankings', async () => {
    await expect(getRankings(client(), 'nope')).rejects.toThrow(AinessError)
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/nope/'))
  })
})

describe('getProduct', () => {
  it('joins product, ranking, verdicts, and evidence urls', async () => {
    const result = await getProduct(client(), 'desktop-os', 'macos')
    expect(result.product.name).toBe('macOS')
    expect(result.ranking?.score).toBe(12)
    expect(result.verdicts).toHaveLength(1)
    expect(result.verdicts[0]).toMatchObject({
      storyId: 'agentic-mcp-server',
      storyTitle: 'I can connect an agent via an official MCP server',
      verdict: 'none',
      evidenceUrls: ['https://apple.com/docs/1'],
    })
  })

  it('drops evidence citations that fail to resolve, without throwing', async () => {
    const result = await getProduct(client(), 'desktop-os', 'ubuntu')
    expect(result.verdicts[0].evidenceUrls).toEqual([])
  })

  it('throws AinessError for an unknown product', async () => {
    await expect(getProduct(client(), 'desktop-os', 'nonexistent')).rejects.toThrow(/unknown product/)
  })
})

describe('getBattle', () => {
  it('finds a battle regardless of a/b order', async () => {
    const forward = await getBattle(client(), 'desktop-os', 'macos', 'ubuntu')
    const reversed = await getBattle(client(), 'desktop-os', 'ubuntu', 'macos')
    expect(forward).toEqual(reversed)
    expect(forward.winner).toBe('ubuntu')
  })

  it('throws when no battle exists between the two ids', async () => {
    await expect(getBattle(client(), 'desktop-os', 'macos', 'nonexistent')).rejects.toThrow(/no battle found/)
  })
})

describe('searchProducts', () => {
  it('matches by id, name, or vendor across all categories', async () => {
    const byVendor = await searchProducts(client(), 'canonical')
    expect(byVendor).toEqual([{ category: 'desktop-os', product: PRODUCTS[1] }])

    const byName = await searchProducts(client(), 'macOS')
    expect(byName).toEqual([{ category: 'desktop-os', product: PRODUCTS[0] }])
  })

  it('returns an empty array for an empty query without fetching anything', async () => {
    fetchMock.mockClear()
    const result = await searchProducts(client(), '   ')
    expect(result).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('getStoryVerdicts', () => {
  it('returns the story plus every product verdict for it, with evidence urls', async () => {
    const result = await getStoryVerdicts(client(), 'desktop-os', 'agentic-mcp-server')
    expect(result.story.title).toBe('I can connect an agent via an official MCP server')
    expect(result.verdicts).toHaveLength(2)
    const macos = result.verdicts.find((v) => v.productId === 'macos')!
    expect(macos.productName).toBe('macOS')
    expect(macos.evidenceUrls).toEqual(['https://apple.com/docs/1'])
  })

  it('throws AinessError for an unknown story id', async () => {
    await expect(getStoryVerdicts(client(), 'desktop-os', 'nonexistent')).rejects.toThrow(/unknown story/)
  })
})
