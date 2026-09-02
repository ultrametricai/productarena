// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AgentAccessGlyphs from '@/components/AgentAccessGlyphs'
import type { CategoryData } from '@/lib/data'
import type { Category, Product, Story, Verdict } from '@/lib/schemas'

const category: Category = { id: 'cat', name: 'Cat', description: 'd', personas: ['dev'] }
const products: Product[] = [{ id: 'p', name: 'P', vendor: 'v', type: 'oss', urls: { site: 'https://p.example' } }]
const stories: Story[] = [
  { id: 'agentic-mcp-server', persona: 'ai-native', title: 't', theme: 'agenticness', group: 'agent-access', weight: 1 },
  { id: 'agentic-mcp-client', persona: 'ai-native', title: 't', theme: 'agenticness', group: 'agent-access', weight: 1 },
  { id: 'agentic-official-cli', persona: 'ai-native', title: 't', theme: 'agenticness', group: 'agent-access', weight: 1 },
  { id: 'agentic-public-api', persona: 'ai-native', title: 't', theme: 'agenticness', group: 'agent-access', weight: 1 },
]

function makeData(verdicts: Verdict[]): CategoryData {
  return {
    category, products, stories, evidence: {}, verdicts,
    rankings: { generatedAt: '2026-08-26T00:00:00.000Z', leaderboard: [], battles: [] },
    stacks: [],
    popularity: {},
  }
}

const v = (storyId: string, verdict: Verdict['verdict']): Verdict => ({
  productId: 'p', storyId, verdict, quality: verdict === 'none' || verdict === 'na' ? 0 : 5,
  confidence: 'high', rationale: 'r', evidenceIds: verdict === 'none' || verdict === 'na' ? [] : ['e1'],
})

describe('AgentAccessGlyphs', () => {
  it('renders a distinct "!" mark for a disputed verdict, not the "—" none/na mark', () => {
    const data = makeData([
      v('agentic-mcp-server', 'na'),
      v('agentic-mcp-client', 'disputed'),
      v('agentic-official-cli', 'full'),
      v('agentic-public-api', 'none'),
    ])
    render(<AgentAccessGlyphs data={data} productId="p" />)
    expect(screen.getByText('!')).toBeDefined()
    expect(screen.getByText('✓')).toBeDefined()
    expect(screen.getByText('—')).toBeDefined()
  })
})
