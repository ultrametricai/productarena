import Link from 'next/link'
import GeoMark from '@/components/GeoMark'

// The one list of global (cross-arena) COMPANY rankings, in the same order as the header's
// Explore menu. `id` doubles as the GeoMark seed, so every ranking wears the same concept mark
// here, in the Explore menu, and on its own page header.
export const GLOBAL_RANKINGS = [
  { id: 'agentic', name: 'Most agent-ready', href: '/rankings/agentic' },
  { id: 'init', name: 'Highest PA Score', href: '/rankings/init' },
  { id: 'ai-native', name: 'Best built-in AI', href: '/rankings/ai-native' },
  { id: 'claims-integrity', name: 'Claims vs reality', href: '/rankings/claims-integrity' },
  { id: 'most-connected', name: 'Most connected', href: '/rankings/most-connected' },
  { id: 'most-tested', name: 'Most tested', href: '/rankings/most-tested' },
  { id: 'rising', name: 'Rising & falling', href: '/rankings/rising' },
  { id: 'popular', name: 'Most popular', href: '/rankings/popular' },
  { id: 'most-open', name: 'Most open', href: '/rankings/most-open' },
  { id: 'best-api', name: 'Best API', href: '/rankings/best-api' },
] as const

// The parallel list of PROCESS rankings (founder ask 2026-09-21: "Explore could include
// Process rankings as well; make it clear what is process and what is company") — end-to-end
// workflows ranked, not vendors. Same shape and same GeoMark-seed contract as GLOBAL_RANKINGS;
// pages live under /rankings/processes/* and every row links to a /processes/<slug> page.
export const PROCESS_RANKINGS = [
  { id: 'most-automatable', name: 'Most automatable', href: '/rankings/processes/most-automatable' },
  { id: 'best-covered', name: 'Best covered by the market', href: '/rankings/processes/best-covered' },
  { id: 'riskiest', name: 'Riskiest', href: '/rankings/processes/riskiest' },
  { id: 'most-annoying', name: 'Most annoying', href: '/rankings/processes/most-annoying' },
  { id: 'growth-drivers', name: 'Growth drivers', href: '/rankings/processes/growth-drivers' },
] as const

export type GlobalRankingId = (typeof GLOBAL_RANKINGS)[number]['id']
export type ProcessRankingId = (typeof PROCESS_RANKINGS)[number]['id']
export type RankingId = GlobalRankingId | ProcessRankingId

// The two labeled groups every /rankings/* page cross-links — company pages show the process
// group too (and vice versa): the clarity ask IS seeing both, clearly labeled.
const GROUPS = [
  { label: '🏢 Company rankings', rankings: GLOBAL_RANKINGS },
  { label: '🔁 Process rankings', rankings: PROCESS_RANKINGS },
] as const

// Cross-link footer for the /rankings/* pages: every sibling ranking in both groups, with the
// current one rendered as quiet text (never a self-link). Server-safe, no state.
export default function RankingsNav({ current }: { current: RankingId }) {
  return (
    <nav aria-label="all global rankings" className="space-y-3 rounded-xl border border-zinc-800 p-4">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-xs uppercase tracking-widest text-zinc-500">{group.label}</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            {group.rankings.map((r) => (
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
        </div>
      ))}
    </nav>
  )
}
