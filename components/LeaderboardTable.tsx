import Link from 'next/link'
import ScoreBar from '@/components/ScoreBar'
import { type AppData, battleSlug } from '@/lib/data'

export default function LeaderboardTable({ data }: { data: AppData }) {
  const { leaderboard } = data.rankings
  const productById = new Map(data.products.map((p) => [p.id, p]))
  const orderByProduct = (x: string, y: string): [string, string] => {
    const idx = (id: string) => data.products.findIndex((p) => p.id === id)
    return idx(x) <= idx(y) ? [x, y] : [y, x]
  }
  return (
    <ol className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
      {leaderboard.map((entry, i) => {
        const product = productById.get(entry.productId)!
        const rivals = leaderboard.filter((e) => e.productId !== entry.productId).slice(0, 2)
        return (
          <li key={entry.productId} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className="w-8 font-mono text-2xl tabular-nums text-zinc-600">{i + 1}</span>
              <div className="min-w-0">
                <Link href={`/product/${product.id}`} className="text-lg font-semibold hover:text-amber-300">
                  {product.name}
                </Link>
                <p className="truncate text-sm text-zinc-500">{product.vendor}</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <ScoreBar score={entry.score} />
              <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                {rivals.map((r) => (
                  <Link
                    key={r.productId}
                    href={`/battle/${battleSlug(...orderByProduct(entry.productId, r.productId))}`}
                    className="rounded-full border border-zinc-800 px-2 py-0.5 hover:border-amber-400 hover:text-amber-300"
                  >
                    vs {productById.get(r.productId)!.name}
                  </Link>
                ))}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
