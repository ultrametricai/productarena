import Link from 'next/link'
import GeoMark from '@/components/GeoMark'

// The one list of global (cross-arena) rankings, in the same order as the header's Explore
// menu. `id` doubles as the GeoMark seed, so every ranking wears the same concept mark here,
// in the Explore menu, and on its own page header.
export const GLOBAL_RANKINGS = [
  { id: 'agentic', name: 'Most agent-ready', href: '/rankings/agentic' },
  { id: 'init', name: 'Highest PA Score', href: '/rankings/init' },
  { id: 'ai-native', name: 'Most AI-native', href: '/rankings/ai-native' },
  { id: 'claims-integrity', name: 'Claims vs reality', href: '/rankings/claims-integrity' },
  { id: 'most-connected', name: 'Most connected', href: '/rankings/most-connected' },
  { id: 'most-tested', name: 'Most tested', href: '/rankings/most-tested' },
  { id: 'rising', name: 'Rising & falling', href: '/rankings/rising' },
  { id: 'most-open', name: 'Most open', href: '/rankings/most-open' },
  { id: 'best-api', name: 'Best API', href: '/rankings/best-api' },
] as const

export type GlobalRankingId = (typeof GLOBAL_RANKINGS)[number]['id']

// Cross-link footer for the /rankings/* pages: every sibling ranking, with the current one
// rendered as quiet text (never a self-link). Server-safe, no state.
export default function RankingsNav({ current }: { current: GlobalRankingId }) {
  return (
    <nav aria-label="all global rankings" className="rounded-xl border border-zinc-800 p-4">
      <p className="text-xs uppercase tracking-widest text-zinc-500">More global rankings</p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
        {GLOBAL_RANKINGS.map((r) => (
          <li key={r.id} className="flex items-center gap-1.5">
            <GeoMark seed={r.id} title={r.name} size={13} className="text-zinc-600" />
            {r.id === current ? (
              <span className="text-zinc-500" aria-current="page">
                {r.name}
              </span>
            ) : (
              <Link href={r.href} className="text-zinc-300 transition hover:text-emerald-300">
                {r.name}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
