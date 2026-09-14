import { describe, expect, it } from 'vitest'
import {
  arenaOpportunity,
  computeOpportunityScore,
  globallyUnservedStories,
  MISSING_WEIGHTS,
  OPPORTUNITY_FORMULA,
  rankMissingStartups,
  unservedStoriesFor,
  type MissingSource,
} from '@/lib/missingStartups'
import type { Story, Verdict } from '@/lib/schemas'

const story = (id: string, over: Partial<Story> = {}): Story => ({
  id,
  persona: 'dev',
  title: `As a dev, I want to do ${id}`,
  theme: 'core',
  group: 'core',
  weight: 2,
  ...over,
})

const verdict = (productId: string, storyId: string, over: Partial<Verdict> = {}): Verdict => ({
  productId,
  storyId,
  verdict: 'none',
  quality: 0,
  confidence: 'medium',
  rationale: 'r',
  evidenceIds: [],
  ...over,
})

function source(over: Partial<MissingSource> = {}): MissingSource {
  return {
    category: { id: 'cat', name: 'Cat', description: 'd' },
    products: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
    stories: [],
    verdicts: [],
    rankings: { leaderboard: [] },
    ...over,
  }
}

describe('computeOpportunityScore', () => {
  it('blends all five gap components with the documented weights', () => {
    // agent-ready gap 80, AI-native gap 60, none-share 50%, leader gap 40, unserved 20%.
    const score = computeOpportunityScore({
      meanAgentReady: 20,
      meanAiNative: 40,
      noneShare: 0.5,
      leaderPaScore: 60,
      unservedShare: 0.2,
    })
    expect(score).toBe(0.3 * 80 + 0.2 * 60 + 0.2 * 50 + 0.2 * 40 + 0.1 * 20) // 56
  })

  it('renormalizes over non-null components instead of penalizing missing axes twice', () => {
    expect(computeOpportunityScore({ meanAgentReady: 20, meanAiNative: null, noneShare: null, leaderPaScore: null, unservedShare: null })).toBe(80)
  })

  it('returns null when nothing is measurable', () => {
    expect(computeOpportunityScore({ meanAgentReady: null, meanAiNative: null, noneShare: null, leaderPaScore: null, unservedShare: null })).toBeNull()
  })

  it('keeps the published formula string in sync with the weights', () => {
    for (const w of Object.values(MISSING_WEIGHTS)) {
      expect(OPPORTUNITY_FORMULA).toContain(`${w}·`)
    }
  })
})

describe('unservedStoriesFor', () => {
  it('lists stories no product scores ≥ partial on, heaviest first, in action form', () => {
    const s = source({
      stories: [story('gap-light', { weight: 1 }), story('gap-heavy', { weight: 3 }), story('served')],
      verdicts: [
        verdict('a', 'gap-light'),
        verdict('b', 'gap-light', { verdict: 'disputed', quality: 3, evidenceIds: ['e'] }),
        verdict('a', 'gap-heavy'),
        verdict('b', 'gap-heavy'),
        verdict('a', 'served', { verdict: 'partial', quality: 6, evidenceIds: ['e'] }),
        verdict('b', 'served'),
      ],
    })
    const unserved = unservedStoriesFor(s)
    expect(unserved.map((u) => u.storyId)).toEqual(['gap-heavy', 'gap-light'])
    expect(unserved[0].title).toBe('Do gap-heavy')
  })

  it('excludes stories that are na for every product (inapplicable ≠ unserved)', () => {
    const s = source({
      stories: [story('all-na')],
      verdicts: [verdict('a', 'all-na', { verdict: 'na' }), verdict('b', 'all-na', { verdict: 'na' })],
    })
    expect(unservedStoriesFor(s)).toEqual([])
  })
})

describe('arenaOpportunity', () => {
  it('computes fleet means, agentic none-share, leader, and unserved share', () => {
    const s = source({
      stories: [
        story('access', { theme: 'agenticness', group: 'agent-access' }),
        story('feature', { theme: 'agenticness', group: 'agentic-features' }),
        story('api', { theme: 'agenticness', group: 'api-quality' }),
        story('domain'),
      ],
      verdicts: [
        verdict('a', 'access'), // none
        verdict('b', 'access', { verdict: 'partial', quality: 5, evidenceIds: ['e'] }),
        verdict('a', 'feature'), // none
        verdict('b', 'feature', { verdict: 'na' }), // excluded from none-share denominator
        // api-quality is deliberately NOT part of the none-share signal:
        verdict('a', 'api'),
        verdict('b', 'api'),
        verdict('a', 'domain'), // none for everyone → unserved
        verdict('b', 'domain'),
      ],
      rankings: {
        leaderboard: [
          { productId: 'a', aiEra: 40, agentReady: 30, agenticApp: 20 },
          { productId: 'b', aiEra: 30, agentReady: 50, agenticApp: null },
        ],
      },
    })
    const arena = arenaOpportunity(s)
    expect(arena.components.meanAgentReady).toBe(40)
    expect(arena.components.meanAiNative).toBe(20)
    // 3 applicable agentic cells (access×2 + feature a), 2 of them none.
    expect(arena.components.noneShare).toBeCloseTo(2 / 3, 3)
    expect(arena.leader).toEqual({ productId: 'a', name: 'A', paScore: 40 })
    // 4 applicable stories, 3 unserved: api + domain (all none) and feature (a none, b na —
    // no full/partial anywhere). Only 'access' is served (b partial).
    expect(arena.components.unservedShare).toBe(0.75)
    expect(arena.unservedStories.map((u) => u.storyId)).toEqual(['api', 'domain', 'feature'])
    expect(arena.score).toBeGreaterThan(0)
    expect(arena.score).toBeLessThanOrEqual(100)
  })

  it('degrades honestly when an arena has no agentic stories at all', () => {
    const s = source({
      stories: [story('domain')],
      verdicts: [
        verdict('a', 'domain', { verdict: 'full', quality: 9, evidenceIds: ['e'] }),
        verdict('b', 'domain', { verdict: 'partial', quality: 5, evidenceIds: ['e'] }),
      ],
      rankings: {
        leaderboard: [
          { productId: 'a', aiEra: null, agentReady: null, agenticApp: null },
          { productId: 'b', aiEra: null, agentReady: null, agenticApp: null },
        ],
      },
    })
    const arena = arenaOpportunity(s)
    expect(arena.components.noneShare).toBeNull()
    expect(arena.components.meanAgentReady).toBeNull()
    expect(arena.components.leaderPaScore).toBeNull()
    // Only unservedShare (0) is measurable → score 0.
    expect(arena.score).toBe(0)
  })
})

describe('rankMissingStartups', () => {
  it('ranks biggest gap first with a stable arenaId tie-break', () => {
    const weak = source({
      category: { id: 'weak', name: 'Weak', description: '' },
      stories: [story('access', { theme: 'agenticness', group: 'agent-access' })],
      verdicts: [verdict('a', 'access'), verdict('b', 'access')],
      rankings: {
        leaderboard: [
          { productId: 'a', aiEra: 10, agentReady: 5, agenticApp: 5 },
          { productId: 'b', aiEra: 8, agentReady: 5, agenticApp: 5 },
        ],
      },
    })
    const strong = source({
      category: { id: 'strong', name: 'Strong', description: '' },
      stories: [story('access', { theme: 'agenticness', group: 'agent-access' })],
      verdicts: [
        verdict('a', 'access', { verdict: 'full', quality: 9, evidenceIds: ['e'] }),
        verdict('b', 'access', { verdict: 'full', quality: 8, evidenceIds: ['e'] }),
      ],
      rankings: {
        leaderboard: [
          { productId: 'a', aiEra: 90, agentReady: 95, agenticApp: 85 },
          { productId: 'b', aiEra: 85, agentReady: 90, agenticApp: 80 },
        ],
      },
    })
    const ranked = rankMissingStartups([strong, weak])
    expect(ranked.map((r) => r.arenaId)).toEqual(['weak', 'strong'])
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score)
  })
})

describe('globallyUnservedStories', () => {
  const globalStory = (over: Partial<Story> = {}) =>
    story('global-gap', { scope: 'global', title: 'As a dev, I want to do the global thing', ...over })

  it('finds a global story with no full/partial verdict in any carrying arena', () => {
    const one = source({
      category: { id: 'one', name: 'One', description: '' },
      stories: [globalStory()],
      verdicts: [verdict('a', 'global-gap'), verdict('b', 'global-gap')],
    })
    const two = source({
      category: { id: 'two', name: 'Two', description: '' },
      stories: [globalStory()],
      verdicts: [verdict('a', 'global-gap', { verdict: 'disputed', quality: 2, evidenceIds: ['e'] }), verdict('b', 'global-gap', { verdict: 'na' })],
    })
    const unserved = globallyUnservedStories([one, two])
    expect(unserved).toHaveLength(1)
    expect(unserved[0]).toEqual({
      storyId: 'global-gap',
      title: 'Do the global thing',
      arenaCount: 2,
      arenaIds: ['one', 'two'],
    })
  })

  it('drops the story once ANY arena has a full/partial verdict', () => {
    const one = source({
      category: { id: 'one', name: 'One', description: '' },
      stories: [globalStory()],
      verdicts: [verdict('a', 'global-gap'), verdict('b', 'global-gap', { verdict: 'partial', quality: 4, evidenceIds: ['e'] })],
    })
    expect(globallyUnservedStories([one])).toEqual([])
  })

  it('requires the site\'s cross-arena bar: a single-arena global-scoped story is excluded', () => {
    // Matches lib/globalStories.ts's ≥2-arena definition — and keeps every /missing entry's
    // /global/[story] link pointing at a page that actually exists.
    const only = source({
      category: { id: 'only', name: 'Only', description: '' },
      stories: [globalStory()],
      verdicts: [verdict('a', 'global-gap'), verdict('b', 'global-gap')],
    })
    expect(globallyUnservedStories([only])).toEqual([])
  })

  it('ignores non-global stories and all-na global stories', () => {
    const s = source({
      stories: [story('local-gap'), globalStory({ id: 'na-everywhere' })],
      verdicts: [
        verdict('a', 'local-gap'),
        verdict('b', 'local-gap'),
        verdict('a', 'na-everywhere', { verdict: 'na' }),
        verdict('b', 'na-everywhere', { verdict: 'na' }),
      ],
    })
    expect(globallyUnservedStories([s])).toEqual([])
  })
})
