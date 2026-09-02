import { verdictFor, type CategoryData } from '@/lib/data-helpers'
import type { Verdict } from '@/lib/schemas'

// Three mono glyph columns derived straight from canonical agent-access verdicts — no new
// scoring, just a compact visual citation of full/partial/none-or-na for the three questions
// that matter most for "can an agent even get to this product": MCP, CLI, API.
//
// MCP is two stories, not one: `agentic-mcp-server` (does the product SHIP an MCP server for
// other agents to connect to) and `agentic-mcp-client` (does the product itself CONSUME MCP
// servers). For an agent product (e.g. a coding-agent CLI), only the second question is a fair
// one to ask — the product IS the agent, so "does it ship a server" is often correctly `na`.
// Showing only the `-server` verdict here would silently repeat that wrong-axis mistake in the
// UI even after the judge got it right, so this glyph shows whichever of the two verdicts is
// stronger.
const COLUMNS: Array<{ label: string; storyIds: string[] }> = [
  { label: 'MCP', storyIds: ['agentic-mcp-server', 'agentic-mcp-client'] },
  { label: 'CLI', storyIds: ['agentic-official-cli'] },
  { label: 'API', storyIds: ['agentic-public-api'] },
]

const VERDICT_RANK: Record<Verdict['verdict'], number> = { full: 3, partial: 2, disputed: 1, none: 0, na: 0 }

function bestVerdict(data: CategoryData, productId: string, storyIds: string[]): Verdict {
  const candidates = storyIds
    .filter((id) => data.stories.some((s) => s.id === id))
    .map((id) => verdictFor(data, productId, id))
  return candidates.reduce((best, v) => (VERDICT_RANK[v.verdict] > VERDICT_RANK[best.verdict] ? v : best))
}

function glyphFor(verdict: Verdict['verdict']): { char: string; className: string } {
  if (verdict === 'full') return { char: '✓', className: 'text-emerald-400' }
  if (verdict === 'partial') return { char: '~', className: 'text-amber-400' }
  // `disputed` gets its own mark, distinct from "—" (none/na): the vendor claims this access
  // mode works, but independent evidence disagrees — that's a live disagreement worth a glance,
  // not the same as "no evidence found" or "not applicable". See components/Legend.tsx.
  if (verdict === 'disputed') return { char: '!', className: 'text-red-400' }
  return { char: '—', className: 'text-zinc-400' }
}

export default function AgentAccessGlyphs({ data, productId }: { data: CategoryData; productId: string }) {
  return (
    <div className="flex items-center gap-3 font-mono text-xs">
      {COLUMNS.map(({ label, storyIds }) => {
        const v = bestVerdict(data, productId, storyIds)
        const { char, className } = glyphFor(v.verdict)
        return (
          <span
            key={label}
            className="flex items-center gap-1"
            title={`${label}: ${v.verdict} — ${v.rationale}`}
          >
            <span className="text-zinc-400">{label}</span>
            <span className={className}>{char}</span>
          </span>
        )
      })}
    </div>
  )
}
