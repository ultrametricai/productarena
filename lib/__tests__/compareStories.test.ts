import { describe, expect, it } from 'vitest'
import {
  DEFAULT_KEY_STORY_ROWS,
  encodeStoriesParam,
  MAX_COMPARE_STORIES,
  parseStoriesParam,
  searchStories,
  sharedKeyStories,
  storyCell,
  storyUnion,
  toArenaStoryData,
  type ArenaStoryData,
  type CompareStoryMeta,
  type UnionStory,
} from '../compareStories'

function story(overrides: Partial<CompareStoryMeta> & { id: string }): CompareStoryMeta {
  return { title: `Story ${overrides.id}`, weight: 1, scope: 'global', ...overrides }
}

function arena(
  stories: CompareStoryMeta[],
  cells: Array<[string, string, { verdict: 'full' | 'partial' | 'none' | 'disputed' | 'na'; quality: number }]> = [],
): ArenaStoryData {
  return {
    stories,
    storyIds: new Set(stories.map((s) => s.id)),
    cells: new Map(cells.map(([pid, sid, cell]) => [`${pid}:${sid}`, cell])),
  }
}

describe('parseStoriesParam / encodeStoriesParam', () => {
  it('parses a comma-separated id list', () => {
    expect(parseStoriesParam('agentic-mcp-server,privacy-no-training')).toEqual([
      'agentic-mcp-server',
      'privacy-no-training',
    ])
  })

  it('returns [] for null/empty input', () => {
    expect(parseStoriesParam(null)).toEqual([])
    expect(parseStoriesParam(undefined)).toEqual([])
    expect(parseStoriesParam('')).toEqual([])
  })

  it('dedupes and trims (unknown ids survive — pruning happens after arena data loads)', () => {
    expect(parseStoriesParam(' a , a,b,, ')).toEqual(['a', 'b'])
    expect(parseStoriesParam('totally-unknown-id')).toEqual(['totally-unknown-id'])
  })

  it(`caps at MAX_COMPARE_STORIES (${MAX_COMPARE_STORIES})`, () => {
    const raw = Array.from({ length: MAX_COMPARE_STORIES + 3 }, (_, i) => `s${i}`).join(',')
    const ids = parseStoriesParam(raw)
    expect(ids).toHaveLength(MAX_COMPARE_STORIES)
    expect(ids).not.toContain(`s${MAX_COMPARE_STORIES}`)
  })

  it('round-trips through encodeStoriesParam', () => {
    const ids = ['a', 'b', 'c']
    expect(parseStoriesParam(encodeStoriesParam(ids))).toEqual(ids)
  })
})

describe('toArenaStoryData', () => {
  it('builds story set and verdict cell map from raw JSON', () => {
    const data = toArenaStoryData(
      [{ id: 's1', title: 'T1', weight: 3, scope: 'global', persona: 'x', theme: 't', group: 'g' }],
      [{ productId: 'p1', storyId: 's1', verdict: 'partial', quality: 6.5, rationale: 'r', evidenceIds: [] }],
    )
    expect(data.stories).toEqual([{ id: 's1', title: 'T1', weight: 3, scope: 'global' }])
    expect(data.storyIds.has('s1')).toBe(true)
    expect(data.cells.get('p1:s1')).toEqual({ verdict: 'partial', quality: 6.5 })
  })

  it('tolerates missing weight/scope (older data) with lenient defaults', () => {
    const data = toArenaStoryData([{ id: 's1', title: 'T1' }], [])
    expect(data.stories[0]).toEqual({ id: 's1', title: 'T1', weight: 1, scope: null })
  })

  it('throws on malformed input rather than producing fake verdicts', () => {
    expect(() => toArenaStoryData({ not: 'an array' }, [])).toThrow()
    expect(() => toArenaStoryData([{ id: 's1' }], [])).toThrow() // missing title
    expect(() => toArenaStoryData([], [{ productId: 'p', storyId: 's', verdict: 'yes!', quality: 5 }])).toThrow()
    expect(() => toArenaStoryData([], [{ productId: 'p', storyId: 's', verdict: 'full' }])).toThrow() // no quality
  })
})

describe('sharedKeyStories', () => {
  it('returns global-scope stories present in every arena, weight-3 first then title', () => {
    const a = arena([
      story({ id: 'zeta-cli', title: 'Zeta CLI', weight: 3 }),
      story({ id: 'mcp-server', title: 'MCP server', weight: 3 }),
      story({ id: 'webhooks', title: 'Webhooks', weight: 2 }),
      story({ id: 'payments-only', title: 'Category thing', weight: 3, scope: 'category' }),
    ])
    const b = arena([
      story({ id: 'mcp-server', title: 'MCP server', weight: 3 }),
      story({ id: 'zeta-cli', title: 'Zeta CLI', weight: 3 }),
      story({ id: 'webhooks', title: 'Webhooks', weight: 2 }),
    ])
    expect(sharedKeyStories([a, b]).map((s) => s.id)).toEqual(['mcp-server', 'zeta-cli', 'webhooks'])
  })

  it('excludes global stories missing from any arena (must be shared by ALL)', () => {
    const a = arena([story({ id: 'shared', weight: 3 }), story({ id: 'only-a', weight: 3 })])
    const b = arena([story({ id: 'shared', weight: 3 })])
    expect(sharedKeyStories([a, b]).map((s) => s.id)).toEqual(['shared'])
  })

  it('excludes category/product-scoped and unscoped stories even when shared', () => {
    const cat = story({ id: 'cat', weight: 3, scope: 'category' })
    const untagged = story({ id: 'untagged', weight: 3, scope: null })
    const a = arena([cat, untagged, story({ id: 'g', weight: 1 })])
    const b = arena([cat, untagged, story({ id: 'g', weight: 1 })])
    expect(sharedKeyStories([a, b]).map((s) => s.id)).toEqual(['g'])
  })

  it('works for a single arena and returns [] for none', () => {
    const a = arena([story({ id: 'g', weight: 2 }), story({ id: 'c', scope: 'category' })])
    expect(sharedKeyStories([a]).map((s) => s.id)).toEqual(['g'])
    expect(sharedKeyStories([])).toEqual([])
  })

  it('DEFAULT_KEY_STORY_ROWS caps the default view sensibly', () => {
    expect(DEFAULT_KEY_STORY_ROWS).toBeGreaterThan(0)
    expect(DEFAULT_KEY_STORY_ROWS).toBeLessThanOrEqual(MAX_COMPARE_STORIES)
  })
})

describe('storyUnion / searchStories', () => {
  const arenas = [
    { arenaId: 'payments', data: arena([story({ id: 'shared', title: 'Shared global' }), story({ id: 'refunds', title: 'Issue refunds', scope: 'category' })]) },
    { arenaId: 'banking', data: arena([story({ id: 'shared', title: 'Shared global' }), story({ id: 'yield', title: 'Treasury yield', scope: 'category' })]) },
  ]

  it('unions stories across arenas, deduping by id and recording carrying arenas', () => {
    const union = storyUnion(arenas)
    expect(union.map((s) => s.id)).toEqual(['shared', 'refunds', 'yield'])
    expect(union.find((s) => s.id === 'shared')?.arenaIds).toEqual(['payments', 'banking'])
    expect(union.find((s) => s.id === 'yield')?.arenaIds).toEqual(['banking'])
  })

  it('matches title substrings case-insensitively', () => {
    const union = storyUnion(arenas)
    expect(searchStories(union, 'TREASURY', new Set(), 8).map((s) => s.id)).toEqual(['yield'])
    expect(searchStories(union, 'e', new Set(), 8).length).toBeGreaterThan(1)
  })

  it('excludes ids already on the table and respects the cap', () => {
    const union = storyUnion(arenas)
    expect(searchStories(union, 'shared', new Set(['shared']), 8)).toEqual([])
    expect(searchStories(union, 'e', new Set(), 1)).toHaveLength(1)
  })

  it('returns [] for an empty/whitespace query', () => {
    expect(searchStories(storyUnion(arenas), '   ', new Set(), 8)).toEqual([])
  })
})

describe('storyCell', () => {
  const data = arena(
    [story({ id: 's1' })],
    [
      ['p1', 's1', { verdict: 'full', quality: 8 }],
      ['p2', 's1', { verdict: 'none', quality: 0 }],
    ],
  )

  it('is loading while the arena fetch is pending or not yet started', () => {
    expect(storyCell(undefined, 'p1', 's1')).toEqual({ kind: 'loading' })
    expect(storyCell({ status: 'loading' }, 'p1', 's1')).toEqual({ kind: 'loading' })
  })

  it('is error when the arena fetch failed — never a fake verdict', () => {
    expect(storyCell({ status: 'error' }, 'p1', 's1')).toEqual({ kind: 'error' })
  })

  it('is other-arena when the story does not exist in the product’s arena', () => {
    expect(storyCell({ status: 'ready', data }, 'p1', 'some-other-arenas-story')).toEqual({ kind: 'other-arena' })
  })

  it('returns the verdict + quality for a real cell', () => {
    expect(storyCell({ status: 'ready', data }, 'p1', 's1')).toEqual({ kind: 'verdict', verdict: 'full', quality: 8 })
    expect(storyCell({ status: 'ready', data }, 'p2', 's1')).toEqual({ kind: 'verdict', verdict: 'none', quality: 0 })
  })

  it('treats a matrix hole (story known, cell missing) as an error, not a verdict', () => {
    expect(storyCell({ status: 'ready', data }, 'p3', 's1')).toEqual({ kind: 'error' })
  })
})

// The default key-story flow end-to-end on real-shaped fixtures: two arenas sharing the
// canonical globals, one category story each.
describe('key stories across arenas (integration of helpers)', () => {
  const paymentsStories = [
    story({ id: 'agentic-mcp-server', title: 'As an AI-native user, I can connect an agent via an official MCP server', weight: 3 }),
    story({ id: 'agentic-public-api', title: 'As an AI-native user, I can drive the product through a documented public API', weight: 3 }),
    story({ id: 'openness-webhooks', title: 'As an AI-native user, I can subscribe to webhooks', weight: 2 }),
    story({ id: 'accept-card-payment', title: 'Accept a card payment online', weight: 3, scope: 'category' }),
  ]
  const bankingStories = [
    story({ id: 'agentic-public-api', title: 'As an AI-native user, I can drive the product through a documented public API', weight: 3 }),
    story({ id: 'agentic-mcp-server', title: 'As an AI-native user, I can connect an agent via an official MCP server', weight: 3 }),
    story({ id: 'openness-webhooks', title: 'As an AI-native user, I can subscribe to webhooks', weight: 2 }),
    story({ id: 'treasury-yield', title: 'Earn treasury yield', weight: 3, scope: 'category' }),
  ]

  it('surfaces only the shared globals, weight-3 first, and n/a-s category stories cross-arena', () => {
    const payments = arena(paymentsStories, [['stripe', 'accept-card-payment', { verdict: 'full', quality: 9 }]])
    const banking = arena(bankingStories)
    const keys = sharedKeyStories([payments, banking])
    expect(keys.map((s) => s.id)).toEqual(['agentic-mcp-server', 'agentic-public-api', 'openness-webhooks'])

    // A payments-only story added by the user: the banking product's cell is honestly n/a.
    expect(storyCell({ status: 'ready', data: banking }, 'mercury', 'accept-card-payment')).toEqual({
      kind: 'other-arena',
    })
    expect(storyCell({ status: 'ready', data: payments }, 'stripe', 'accept-card-payment')).toEqual({
      kind: 'verdict',
      verdict: 'full',
      quality: 9,
    })
  })

  it('search over the union finds category-scoped stories from either arena', () => {
    const union = storyUnion([
      { arenaId: 'payments', data: arena(paymentsStories) },
      { arenaId: 'banking', data: arena(bankingStories) },
    ])
    const hits: UnionStory[] = searchStories(union, 'treasury', new Set(), 8)
    expect(hits.map((s) => s.id)).toEqual(['treasury-yield'])
    expect(hits[0].arenaIds).toEqual(['banking'])
  })
})
