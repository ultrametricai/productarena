import Link from 'next/link'
import type { ReactNode } from 'react'

const PALETTES = {
  emerald: {
    high: 'bg-emerald-950 text-emerald-300 ring-emerald-800',
    mid: 'bg-emerald-950/70 text-emerald-400/90 ring-emerald-900',
    low: 'bg-zinc-900 text-emerald-700 ring-zinc-800',
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
  'agentic-app': 'AI-NATIVE',
}

// Hover text spelling out the distinction the short labels can't carry — the two indexes are
// easy to conflate ("agent-ready vs agentic sounds like the same thing") but measure opposite
// directions: can YOUR agent drive the product, vs does the product itself act agentically.
const TITLES: Record<AgenticBadgeKind, string> = {
  'agent-ready': 'Agent-ready — can an outside agent access and operate it: API, MCP, CLI, headless runs, agent docs',
  'agentic-app': 'AI-native — how much the product itself acts agentically for its users: built-in assistants, autonomous features',
}

const COLORS: Record<AgenticBadgeKind, keyof typeof PALETTES> = {
  'agent-ready': 'emerald',
  'agentic-app': 'violet',
}

// Renders one of the two group-scoped agenticness indexes: agent-ready ("can your agent
// drive it" — group agent-access, emerald) or agentic-app ("does the product act agentically
// itself" — group agentic-features, violet). null renders a muted n/a badge in the same
// color family so the pair always reads as a matched set.
// Since v2.4 (the PA Score), these badges are secondary to AiEraBadge wherever both appear —
// `size="sm"` shrinks padding/type for those contexts (leaderboard rows, the PA Score strip).
// `showLabel={false}` drops the metric name from the pill (kept in the title + sr-only text) —
// for table columns whose header already says AGENT-READY/AI-NATIVE, where repeating the label
// on every row says the same word N times.
export default function AgenticBadge({
  kind,
  value,
  size = 'md',
  showLabel = true,
  href,
}: {
  kind: AgenticBadgeKind
  value: number | null
  size?: 'md' | 'sm'
  showLabel?: boolean
  // Optional click-through to where the index is explained (usually /methodology#ai-era, the
  // PA-Score component table these two indexes feed). Callers must NOT set this when the badge
  // already renders inside another link — nested anchors are invalid.
  href?: string
}) {
  const label = LABELS[kind]
  const palette = PALETTES[COLORS[kind]]
  const sizeClass = size === 'md' ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-0 text-[10px]'
  const wrap = (badge: ReactNode) =>
    href ? (
      <Link
        href={href}
        title={`${TITLES[kind]} — how it's measured, on /methodology`}
        className="inline-flex w-fit rounded-full transition hover:brightness-125 hover:ring-1 hover:ring-emerald-400/60"
      >
        {badge}
      </Link>
    ) : (
      badge
    )
  if (value === null) {
    return wrap(
      <span title={href ? undefined : TITLES[kind]} className={`inline-flex w-fit items-center rounded-full bg-zinc-900 font-medium italic text-zinc-400 ring-1 ring-zinc-800 ${sizeClass}`}>
        {showLabel ? `${label} n/a` : 'n/a'}
      </span>,
    )
  }
  const style = value >= 66 ? palette.high : value >= 33 ? palette.mid : palette.low
  return wrap(
    <span title={href ? undefined : TITLES[kind]} className={`inline-flex w-fit items-center gap-1 rounded-full font-medium ring-1 ${style} ${sizeClass}`}>
      {showLabel ? label : <span className="sr-only">{label}</span>}
      <span className="font-mono tabular-nums">{value.toFixed(0)}</span>
    </span>,
  )
}
