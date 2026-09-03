import { describe, expect, it } from 'vitest'
import type { CategoryData } from '@/lib/data-helpers'
import { collectGlobalStories, findGlobalStory, globalStoryIds } from '@/lib/globalStories'
import type { Story, Verdict } from '@/lib/schemas'

function story(id: string, scope: Story['scope'], title = `As a developer, I can ${id}`): Story {
  return { id, persona: 'a developer', title, theme: 'core', group: 'core', weight: 2, scope }
}

function verdict(
  productId: string,
  storyId: string,
  tier: Verdict['verdict'],
  quality = 0,
  evidenceIds: string[] = [],
): Verdict {
  return { productId, storyId, verdict: tier, quality, confidence: 'high', rationale: 'r', evidenceIds }
}

// Minimal CategoryData: collectGlobalStories only reads category/products/stories/verdicts
// (via verdictFor), everything else can stay empty.
function arena(
  id: string,
  stories: Story[],
  products: string[],
  verdicts: Verdict[],
): CategoryData {
  return {
    category: { id, name: id.toUpperCase(), description: '', personas: ['a developer'] },
    products: products.map((p) => ({
      id: p,
      name: p.toUpperCase(),
      vendor: 'v',
      type: 'oss' as const,
      urls: { site: `https://example.com/${p}` },
    })),
    stories,
    evidence: {},
    verdicts,
    rankings: { generatedAt: '2026-01-01T00:00:00.000Z', leaderboard: [], battles: [] },
    stacks: [],
    popularity: {},
    claims: {},
    uncertainty: [],
  }
}

const shared = 'two-factor-auth'
const categories: CategoryData[] = [
  arena(
    'alpha',
    [story(shared, 'global'), story('alpha-only-global', 'global'), story('alpha-domain', 'category')],
    ['a1', 'a2'],
    [
      verdict('a1', shared, 'full', 8, ['e1']),
      verdict('a2', shared, 'none'),
      verdict('a1', 'alpha-only-global', 'full', 5, ['e2']),
      verdict('a2', 'alpha-only-global', 'na'),
      verdict('a1', 'alpha-domain', 'partial', 4, ['e3']),
      verdict('a2', 'alpha-domain', 'none'),
    ],
  ),
  arena(
    'beta',
    [story(shared, 'global'), story('beta-category-elsewhere', 'category')],
    ['b1'],
    [verdict('b1', shared, 'partial', 6, ['e4', 'e5']), verdict('b1', 'beta-category-elsewhere', 'full', 7, ['e6'])],
  ),
  arena(
    'gamma',
    // Same id as beta's story but only scope 'category' here — and 'global' nowhere else, so
    // the pair must NOT qualify: coverage counts arenas where the story is scope-global.
    [story('beta-category-elsewhere', 'category')],
    ['g1'],
    [verdict('g1', 'beta-category-elsewhere', 'full', 9, ['e7'])],
  ),
]

describe('collectGlobalStories', () => {
  it('keeps only global stories present in at least two arenas', () => {
    const stories = collectGlobalStories(categories)
    expect(stories.map((s) => s.id)).toEqual([shared])
    expect(stories[0].arenaCount).toBe(2)
  })

  it('ignores arenas where a shared id is not scope-global', () => {
    expect(collectGlobalStories(categories).some((s) => s.id === 'beta-category-elsewhere')).toBe(false)
  })

  it('builds one cell per (arena, product) sorted strongest-first', () => {
    const [entry] = collectGlobalStories(categories)
    expect(entry.cells).toHaveLength(3)
    // full (a1, q8) > partial (b1, q6) > none (a2).
    expect(entry.cells.map((c) => `${c.categoryId}:${c.productId}:${c.verdict}`)).toEqual([
      'alpha:a1:full',
      'beta:b1:partial',
      'alpha:a2:none',
    ])
    expect(entry.cells[0].quality).toBe(8)
    expect(entry.cells[1].evidenceCount).toBe(2)
    expect(entry.cells[2].evidenceCount).toBe(0)
  })

  it('orders stories by arena coverage, then id', () => {
    const wide = arena('delta', [story(shared, 'global'), story('another-global', 'global')], ['d1'], [
      verdict('d1', shared, 'full', 9, ['e8']),
      verdict('d1', 'another-global', 'full', 9, ['e9']),
    ])
    const wider = arena('epsilon', [story('another-global', 'global')], ['ep1'], [
      verdict('ep1', 'another-global', 'partial', 3, ['e10']),
    ])
    const all = [...categories, wide, wider]
    // shared now spans 3 arenas, another-global spans 2 → shared first.
    expect(collectGlobalStories(all).map((s) => s.id)).toEqual([shared, 'another-global'])
  })
})

describe('findGlobalStory / globalStoryIds', () => {
  it('finds a qualifying story and rejects everything else', () => {
    expect(findGlobalStory(categories, shared)?.id).toBe(shared)
    // Global in only one arena → no cross-arena page.
    expect(findGlobalStory(categories, 'alpha-only-global')).toBeNull()
    expect(findGlobalStory(categories, 'nope')).toBeNull()
  })

  it('globalStoryIds mirrors the qualifying set', () => {
    const ids = globalStoryIds(categories)
    expect(ids.has(shared)).toBe(true)
    expect(ids.has('alpha-only-global')).toBe(false)
    expect(ids.size).toBe(1)
  })
})
