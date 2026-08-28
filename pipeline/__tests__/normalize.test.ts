import { describe, expect, it } from 'vitest'
import type { Story } from '@/lib/schemas'
import { AGENTIC_FEATURE_STORIES, AGENTIC_STORIES } from '@/pipeline/agentic-stories'
import { assembleTaxonomy } from '@/pipeline/stages/normalize'

const s = (over: Partial<Story>): Story => ({
  id: 'story-a',
  persona: 'developer',
  title: 'As a developer, I can do a thing',
  theme: 'dev-experience',
  group: 'dev-tools',
  weight: 2,
  ...over,
})

describe('assembleTaxonomy', () => {
  it('drops LLM stories with theme agenticness or id starting agentic-, and appends the canon', () => {
    const llmStories = [
      s({ id: 'story-a', theme: 'dev-experience' }),
      s({ id: 'story-b', theme: 'agenticness', group: 'agent-access' }),
      s({ id: 'agentic-something-custom', theme: 'dev-experience' }),
    ]
    const result = assembleTaxonomy(llmStories)

    // Non-agentic LLM story survives.
    expect(result.find((r) => r.id === 'story-a')).toBeDefined()
    // LLM agentic dupes are dropped.
    expect(result.find((r) => r.id === 'story-b')).toBeUndefined()
    expect(result.find((r) => r.id === 'agentic-something-custom')).toBeUndefined()

    // Canonical ids all present exactly once (both agent-access and agentic-features groups).
    for (const canon of [...AGENTIC_STORIES, ...AGENTIC_FEATURE_STORIES]) {
      expect(result.filter((r) => r.id === canon.id)).toHaveLength(1)
    }
  })

  it('sorts output by theme, then group, then id', () => {
    const llmStories = [
      s({ id: 'z-story', theme: 'zzz-theme', group: 'zzz-group' }),
      s({ id: 'a-story', theme: 'aaa-theme', group: 'aaa-group' }),
    ]
    const result = assembleTaxonomy(llmStories)
    const sorted = [...result].sort(
      (x, y) => x.theme.localeCompare(y.theme) || x.group.localeCompare(y.group) || x.id.localeCompare(y.id),
    )
    expect(result).toEqual(sorted)
  })

  it('throws on a duplicate id', () => {
    const llmStories = [s({ id: 'dup-id' }), s({ id: 'dup-id', title: 'different title' })]
    expect(() => assembleTaxonomy(llmStories)).toThrow(/duplicate/i)
  })
})
