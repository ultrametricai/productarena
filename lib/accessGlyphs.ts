// Pure, server-safe agent-access glyph logic shared by components/AgentAccessGlyphs.tsx (per-row
// glyph strip on a single arena's table) and components/MegaTable.tsx (which needs the same
// MCP/CLI/API glyphs but precomputed server-side into plain strings — MegaTable's rows are
// serialized to the client and must not drag full CategoryData/verdicts along for the ride).
import { verdictFor, type CategoryData } from './data-helpers'
import type { Verdict } from './schemas'

export type AccessGlyphLabel = 'MCP' | 'CLI' | 'API'

// See components/AgentAccessGlyphs.tsx's original doc comment: MCP is two stories (server +
// client) because for an agent product only the "consumes MCP" question is fair to ask; this
// picks whichever of the two verdicts is stronger.
export const ACCESS_COLUMNS: Array<{ label: AccessGlyphLabel; storyIds: string[] }> = [
  { label: 'MCP', storyIds: ['agentic-mcp-server', 'agentic-mcp-client'] },
  { label: 'CLI', storyIds: ['agentic-official-cli'] },
  { label: 'API', storyIds: ['agentic-public-api'] },
]

const VERDICT_RANK: Record<Verdict['verdict'], number> = { full: 3, partial: 2, disputed: 1, none: 0, na: 0 }

export function bestAccessVerdict(data: CategoryData, productId: string, storyIds: string[]): Verdict {
  const candidates = storyIds
    .filter((id) => data.stories.some((s) => s.id === id))
    .map((id) => verdictFor(data, productId, id))
  return candidates.reduce((best, v) => (VERDICT_RANK[v.verdict] > VERDICT_RANK[best.verdict] ? v : best))
}

export interface AccessGlyph {
  char: string
  className: string
  title: string
  // The story whose verdict this glyph renders — lets table cells link the glyph straight to
  // that story's evidence section on the product page (#story-<id>).
  storyId: string
}

export function accessGlyphFor(label: AccessGlyphLabel, verdict: Verdict): AccessGlyph {
  const title = `${label}: ${verdict.verdict} — ${verdict.rationale}`
  const storyId = verdict.storyId
  if (verdict.verdict === 'full') return { char: '✓', className: 'text-emerald-400', title, storyId }
  if (verdict.verdict === 'partial') return { char: '~', className: 'text-emerald-400', title, storyId }
  // `disputed` gets its own mark, distinct from "—" (none/na): the vendor claims this access
  // mode works, but independent evidence disagrees — see components/Legend.tsx.
  if (verdict.verdict === 'disputed') return { char: '!', className: 'text-red-400', title, storyId }
  return { char: '—', className: 'text-zinc-400', title, storyId }
}

// Precomputes all three glyphs for one product — the shape MegaTable's serialized rows carry
// (plain strings, no Verdict/Evidence objects).
export function computeAccessGlyphs(data: CategoryData, productId: string): Record<AccessGlyphLabel, AccessGlyph> {
  const entries = ACCESS_COLUMNS.map(({ label, storyIds }) => {
    const verdict = bestAccessVerdict(data, productId, storyIds)
    return [label, accessGlyphFor(label, verdict)] as const
  })
  return Object.fromEntries(entries) as Record<AccessGlyphLabel, AccessGlyph>
}
