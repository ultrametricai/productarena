const PALETTES = {
  amber: {
    high: 'bg-amber-950 text-amber-300 ring-amber-800',
    mid: 'bg-amber-950/70 text-amber-400/90 ring-amber-900',
    low: 'bg-zinc-900 text-amber-700 ring-zinc-800',
  },
  violet: {
    high: 'bg-violet-950 text-violet-300 ring-violet-800',
    mid: 'bg-violet-950/70 text-violet-400/90 ring-violet-900',
    low: 'bg-zinc-900 text-violet-700 ring-zinc-800',
  },
} as const

export type AgenticBadgeKind = 'agent-ready' | 'agentic-app'

const LABELS: Record<AgenticBadgeKind, string> = {
  'agent-ready': 'AGENT-READY',
  'agentic-app': 'AGENTIC',
}

const COLORS: Record<AgenticBadgeKind, keyof typeof PALETTES> = {
  'agent-ready': 'amber',
  'agentic-app': 'violet',
}

// Renders one of the two group-scoped agenticness indexes: agent-ready ("can your agent
// drive it" — group agent-access, amber) or agentic-app ("does the product act agentically
// itself" — group agentic-features, violet). null renders a muted n/a badge in the same
// color family so the pair always reads as a matched set.
// Since v2.4 (AI-Era Index), these badges are secondary to AiEraBadge wherever both appear —
// `size="sm"` shrinks padding/type for those contexts (leaderboard rows, the AI-Era strip).
export default function AgenticBadge({
  kind,
  value,
  size = 'md',
}: {
  kind: AgenticBadgeKind
  value: number | null
  size?: 'md' | 'sm'
}) {
  const label = LABELS[kind]
  const palette = PALETTES[COLORS[kind]]
  const sizeClass = size === 'md' ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-0 text-[10px]'
  if (value === null) {
    return (
      <span className={`inline-flex w-fit items-center rounded-full bg-zinc-900 font-medium italic text-zinc-600 ring-1 ring-zinc-800 ${sizeClass}`}>
        {label} n/a
      </span>
    )
  }
  const style = value >= 66 ? palette.high : value >= 33 ? palette.mid : palette.low
  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-full font-medium ring-1 ${style} ${sizeClass}`}>
      {label} <span className="font-mono tabular-nums">{value.toFixed(0)}</span>
    </span>
  )
}
