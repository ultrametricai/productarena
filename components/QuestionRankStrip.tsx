import Link from 'next/link'
import AgentAccessGlyphs from '@/components/AgentAccessGlyphs'
import AgenticBadge, { type AgenticBadgeKind } from '@/components/AgenticBadge'
import ProductLogo from '@/components/ProductLogo'
import type { CategoryData } from '@/lib/data'
import type { LeaderboardEntry } from '@/lib/schemas'

// Shared, parameterized version of what used to be the single AgenticnessStrip: a compact
// horizontal ranking answering one explicit question. An arena page renders two instances —
// "Easiest for AI to use" (ranked by agentReady) and "Best AI experience for humans" (ranked by
// agenticApp) — each with its own badge kind and secondary metric, but identical layout/sort
// logic (desc, nulls last).
export default function QuestionRankStrip({
  data,
  title,
  badgeKind,
  rankBy,
  secondaryLabel,
  secondaryValue,
  showAccessGlyphs = false,
}: {
  data: CategoryData
  title: string
  badgeKind: AgenticBadgeKind
  rankBy: (entry: LeaderboardEntry) => number | null
  secondaryLabel: string
  secondaryValue: (entry: LeaderboardEntry) => number | null
  showAccessGlyphs?: boolean
}) {
  const categoryId = data.category.id
  const productById = new Map(data.products.map((p) => [p.id, p]))
  const ranked = [...data.rankings.leaderboard].sort((x, y) => {
    const xv = rankBy(x)
    const yv = rankBy(y)
    if (xv === null && yv === null) return 0
    if (xv === null) return 1
    if (yv === null) return -1
    return yv - xv
  })

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ranked.map((entry) => {
          const product = productById.get(entry.productId)!
          const secondary = secondaryValue(entry)
          return (
            <Link
              key={entry.productId}
              href={`/arena/${categoryId}/product/${product.id}`}
              className="flex shrink-0 flex-col items-center gap-2 rounded-lg border border-zinc-800 p-3 text-center transition hover:border-amber-400/60"
            >
              <ProductLogo product={product} size={32} />
              <p className="max-w-[7rem] truncate text-xs font-medium">{product.name}</p>
              <AgenticBadge kind={badgeKind} value={rankBy(entry)} size="sm" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                {secondaryLabel} {secondary === null ? 'n/a' : secondary.toFixed(0)}
              </p>
              {showAccessGlyphs && <AgentAccessGlyphs data={data} productId={product.id} />}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
