import { verdictFor, type CategoryData } from '@/lib/data'
import type { Verdict } from '@/lib/schemas'

// Three mono glyph columns derived straight from canonical agent-access verdicts — no new
// scoring, just a compact visual citation of full/partial/none-or-na for the three stories
// that matter most for "can an agent even get to this product": MCP, CLI, API.
const COLUMNS: Array<{ label: string; storyId: string }> = [
  { label: 'MCP', storyId: 'agentic-mcp-server' },
  { label: 'CLI', storyId: 'agentic-official-cli' },
  { label: 'API', storyId: 'agentic-public-api' },
]

function glyphFor(verdict: Verdict['verdict']): { char: string; className: string } {
  if (verdict === 'full') return { char: '✓', className: 'text-emerald-400' }
  if (verdict === 'partial') return { char: '~', className: 'text-amber-400' }
  return { char: '—', className: 'text-zinc-600' }
}

export default function AgentAccessGlyphs({ data, productId }: { data: CategoryData; productId: string }) {
  return (
    <div className="flex items-center gap-3 font-mono text-xs">
      {COLUMNS.map(({ label, storyId }) => {
        const v = verdictFor(data, productId, storyId)
        const { char, className } = glyphFor(v.verdict)
        return (
          <span
            key={storyId}
            className="flex items-center gap-1"
            title={`${label}: ${v.verdict} — ${v.rationale}`}
          >
            <span className="text-zinc-600">{label}</span>
            <span className={className}>{char}</span>
          </span>
        )
      })}
    </div>
  )
}
