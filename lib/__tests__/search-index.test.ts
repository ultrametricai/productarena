import { describe, expect, it } from 'vitest'
import { buildSearchIndex, type SearchIndexSource } from '@/lib/search-index'

const sources: SearchIndexSource[] = [
  {
    category: { id: 'ai-coding', name: 'AI Coding Agents' },
    products: [
      { id: 'claude-code', name: 'Claude Code' },
      { id: 'codex', name: 'Codex' },
    ],
    stories: [{ id: 'agentic-mcp-server', title: 'I can connect an agent via an official MCP server', theme: 'agenticness' }],
  },
  {
    category: { id: 'desktop-os', name: 'Desktop OS' },
    products: [{ id: 'macos', name: 'macOS' }],
    stories: [],
  },
]

describe('buildSearchIndex', () => {
  it('includes one arena entry per category', () => {
    const entries = buildSearchIndex(sources).filter((e) => e.type === 'arena')
    expect(entries).toEqual([
      { type: 'arena', label: 'AI Coding Agents', sublabel: '2 products', href: '/arena/ai-coding' },
      { type: 'arena', label: 'Desktop OS', sublabel: '1 product', href: '/arena/desktop-os' },
    ])
  })

  it('includes one product entry per product, linking to its product page', () => {
    const entries = buildSearchIndex(sources).filter((e) => e.type === 'product')
    expect(entries).toContainEqual({
      type: 'product',
      label: 'Claude Code',
      sublabel: 'AI Coding Agents',
      href: '/arena/ai-coding/product/claude-code',
    })
    expect(entries).toHaveLength(3)
  })

  it('includes one story entry per story, linking to the arena page anchored at the story row', () => {
    const entries = buildSearchIndex(sources).filter((e) => e.type === 'story')
    expect(entries).toEqual([
      {
        type: 'story',
        label: 'I can connect an agent via an official MCP server',
        sublabel: 'AI Coding Agents · agenticness',
        href: '/arena/ai-coding#story-agentic-mcp-server',
      },
    ])
  })

  it('produces no entries for an empty source list', () => {
    expect(buildSearchIndex([])).toEqual([])
  })

  it('accepts a CategoryData-shaped source (extra fields ignored structurally)', () => {
    const wide = [
      {
        category: { id: 'x', name: 'X', description: 'd', personas: ['p'] },
        products: [{ id: 'p1', name: 'P1', vendor: 'v', type: 'oss' as const, urls: { site: 'https://x.example' } }],
        stories: [{ id: 's1', title: 'T', theme: 'th', persona: 'p', group: 'g', weight: 1 as const }],
        evidence: {},
        verdicts: [],
        rankings: { generatedAt: '2026-08-26T00:00:00.000Z', leaderboard: [], battles: [] },
        stacks: [],
      },
    ]
    expect(buildSearchIndex(wide)).toHaveLength(3)
  })
})
