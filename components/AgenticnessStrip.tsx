import Link from 'next/link'
import AgentAccessGlyphs from '@/components/AgentAccessGlyphs'
import AiEraBadge from '@/components/AiEraBadge'
import ProductLogo from '@/components/ProductLogo'
import type { CategoryData } from '@/lib/data'

// Compact horizontal ranking by the AI-Era Index (desc, nulls last), shown above the main
// leaderboard so "how AI-era-ready is this product" is scannable at a glance per arena. This
// is the same ordering as rankings.json's leaderboard array (see buildRankings), just
// re-sorted defensively here in case a caller ever passes an unsorted slice.
export default function AgenticnessStrip({ data }: { data: CategoryData }) {
  const categoryId = data.category.id
  const productById = new Map(data.products.map((p) => [p.id, p]))
  const ranked = [...data.rankings.leaderboard].sort((x, y) => {
    if (x.aiEra === null && y.aiEra === null) return y.score - x.score
    if (x.aiEra === null) return 1
    if (y.aiEra === null) return -1
    return y.aiEra - x.aiEra || y.score - x.score
  })

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">AI-Era</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ranked.map((entry) => {
          const product = productById.get(entry.productId)!
          return (
            <Link
              key={entry.productId}
              href={`/arena/${categoryId}/product/${product.id}`}
              className="flex shrink-0 flex-col items-center gap-2 rounded-lg border border-zinc-800 p-3 text-center transition hover:border-amber-400/60"
            >
              <ProductLogo product={product} size={32} />
              <p className="max-w-[7rem] truncate text-xs font-medium">{product.name}</p>
              <AiEraBadge value={entry.aiEra} size="sm" components={{ agentReady: entry.agentReady, apiQuality: entry.apiQuality, openness: entry.themeScores['openness'] ?? null, agenticApp: entry.agenticApp, automation: entry.themeScores['automation-depth'] ?? null }} />
              <AgentAccessGlyphs data={data} productId={product.id} />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
