import Link from 'next/link'
import AgenticBadge from '@/components/AgenticBadge'
import ProductLogo from '@/components/ProductLogo'
import type { CategoryData } from '@/lib/data'

// Compact horizontal ranking by agentReady (desc, nulls last), shown above the main
// leaderboard so "can your agent drive it" is scannable at a glance per arena.
export default function AgenticnessStrip({ data }: { data: CategoryData }) {
  const categoryId = data.category.id
  const productById = new Map(data.products.map((p) => [p.id, p]))
  const ranked = [...data.rankings.leaderboard].sort((x, y) => {
    if (x.agentReady === null && y.agentReady === null) return 0
    if (x.agentReady === null) return 1
    if (y.agentReady === null) return -1
    return y.agentReady - x.agentReady
  })

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">Agenticness</h2>
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
              <div className="flex flex-col gap-1">
                <AgenticBadge kind="agent-ready" value={entry.agentReady} />
                <AgenticBadge kind="agentic-app" value={entry.agenticApp} />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
