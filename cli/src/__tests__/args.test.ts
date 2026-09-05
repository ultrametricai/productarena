import { describe, expect, it } from 'vitest'
import { UsageError, accessSummary, storyHighlights } from '../api'
import { parseArgs } from '../args'
import type { Story, Verdict } from '../types'

describe('parseArgs', () => {
  it('splits command, positionals, and flags', () => {
    const parsed = parseArgs(['rankings', 'ai-coding', '--json'])
    expect(parsed).toMatchObject({ command: 'rankings', positional: ['ai-coding'] })
    expect(parsed.flags.json).toBe(true)
  })

  it('supports --metric with a space or =, and numeric --limit', () => {
    expect(parseArgs(['top', '--metric', 'agentReady', '--limit', '5']).flags).toMatchObject({ metric: 'agentReady', limit: 5 })
    expect(parseArgs(['top', '--metric=arenaScore']).flags.metric).toBe('arenaScore')
  })

  it('rejects unknown flags, missing values, and bad limits with UsageError', () => {
    expect(() => parseArgs(['top', '--vibes'])).toThrow(UsageError)
    expect(() => parseArgs(['top', '--metric'])).toThrow(/needs a value/)
    expect(() => parseArgs(['top', '--limit', 'lots'])).toThrow(/positive number/)
    expect(() => parseArgs(['top', '--limit', '0'])).toThrow(UsageError)
  })

  it('returns null command for a bare invocation and picks up -h', () => {
    expect(parseArgs([]).command).toBeNull()
    expect(parseArgs(['-h']).flags.help).toBe(true)
    expect(parseArgs(['pick', '--list']).flags.list).toBe(true)
  })
})

const verdict = (productId: string, storyId: string, v: Verdict['verdict']): Verdict => ({
  productId,
  storyId,
  verdict: v,
  quality: 5,
  confidence: 'high',
  rationale: 'r',
  evidenceIds: [],
})

describe('accessSummary', () => {
  it('takes the stronger of the two MCP stories, same rule as lib/accessGlyphs.ts', () => {
    const verdicts = [
      verdict('p', 'agentic-mcp-server', 'none'),
      verdict('p', 'agentic-mcp-client', 'full'),
      verdict('p', 'agentic-official-cli', 'partial'),
    ]
    expect(accessSummary(verdicts, 'p')).toEqual({ MCP: 'full', CLI: 'partial', API: null })
  })

  it('ignores other products', () => {
    expect(accessSummary([verdict('other', 'agentic-public-api', 'full')], 'p')).toEqual({ MCP: null, CLI: null, API: null })
  })
})

describe('storyHighlights', () => {
  const stories: Story[] = [
    { id: 's1', persona: 'dev', title: 'heavy story', theme: 't', group: 'g', weight: 3 },
    { id: 's2', persona: 'dev', title: 'light story', theme: 't', group: 'g', weight: 1 },
    { id: 's3', persona: 'dev', title: 'mid story', theme: 't', group: 'g', weight: 2 },
  ]

  it('filters to one tier and sorts heaviest-first with a cap', () => {
    const verdicts = [verdict('p', 's2', 'full'), verdict('p', 's1', 'full'), verdict('p', 's3', 'none')]
    const full = storyHighlights(stories, verdicts, 'p', 'full', 2)
    expect(full.map((s) => s.storyId)).toEqual(['s1', 's2'])
    const none = storyHighlights(stories, verdicts, 'p', 'none')
    expect(none.map((s) => s.storyId)).toEqual(['s3'])
  })
})
