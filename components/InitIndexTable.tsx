import Link from 'next/link'
import AgentAccessGlyphs from '@/components/AgentAccessGlyphs'
import AiEraBadge from '@/components/AiEraBadge'
import MomentumChip from '@/components/MomentumChip'
import OssPill from '@/components/OssPill'
import ProductLogo from '@/components/ProductLogo'
import type { CategoryData } from '@/lib/data'

interface IndexRow {
  data: CategoryData
  product: CategoryData['products'][number]
  entry: CategoryData['rankings']['leaderboard'][number]
}

// Third global index, alongside AgenticIndexTable (sorted by agentReady) and AiNativeIndexTable
// (sorted by agenticApp): this one sorts by the blended Arena Score itself — "which single
// product is most ready for the AI-agent era, all five axes considered." Ties break on the raw
// coverage score, both desc/nulls-last, matching lib/scoring.ts's own leaderboard tiebreak.
export function buildInitIndex(categories: CategoryData[]): IndexRow[] {
  const rows: IndexRow[] = []
  for (const data of categories) {
    const productById = new Map(data.products.map((p) => [p.id, p]))
    for (const entry of data.rankings.leaderboard) {
      const product = productById.get(entry.productId)
      if (!product) continue
      rows.push({ data, product, entry })
    }
  }
  return rows.sort((x, y) => {
    const xe = x.entry.aiEra
    const ye = y.entry.aiEra
    if (xe === null && ye === null) return y.entry.score - x.entry.score
    if (xe === null) return 1
    if (ye === null) return -1
    return ye - xe || y.entry.score - x.entry.score
  })
}

// `limit` truncates to the top N rows (homepage preview mode); omit it for the full ranking
// (the /rankings/init page). Truncation happens after the sort, never before, so a preview is
// always a strict prefix of the full ranking.
export default function InitIndexTable({ categories, limit }: { categories: CategoryData[]; limit?: number }) {
  const allRows = buildInitIndex(categories)
  const rows = limit === undefined ? allRows : allRows.slice(0, limit)
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-widest text-zinc-400">
            <th className="sticky left-0 z-10 w-10 bg-zinc-950 px-3 py-2 font-normal">#</th>
            <th className="sticky left-10 z-10 w-[170px] bg-zinc-950 px-3 py-2 font-normal">Product</th>
            <th className="px-3 py-2 font-normal">Arena</th>
            <th className="px-3 py-2 font-normal">Access</th>
            <th className="hidden px-3 py-2 font-normal sm:table-cell">Popularity</th>
            <th className="px-3 py-2 font-normal">Arena Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/70">
          {rows.map((row, i) => (
            <tr key={`${row.data.category.id}:${row.product.id}`} className="group transition hover:bg-zinc-900/50">
              <td className="sticky left-0 z-[5] w-10 bg-zinc-950 px-3 py-2 font-mono tabular-nums text-zinc-400 group-hover:bg-zinc-900/50">
                {i + 1}
              </td>
              <td className="sticky left-10 z-[5] w-[170px] bg-zinc-950 px-3 py-2 group-hover:bg-zinc-900/50">
                <Link
                  href={`/arena/${row.data.category.id}/product/${row.product.id}`}
                  className="flex items-center gap-2 hover:text-emerald-300"
                >
                  <ProductLogo product={row.product} size={24} />
                  <span className="min-w-0 truncate font-medium">{row.product.name}</span>
                </Link>
                {row.product.type === 'oss' && (
                  <div className="mt-1">
                    <OssPill />
                  </div>
                )}
              </td>
              <td className="px-3 py-2">
                <Link href={`/arena/${row.data.category.id}`} className="text-zinc-400 hover:text-emerald-300">
                  {row.data.category.name}
                </Link>
              </td>
              <td className="px-3 py-2">
                <AgentAccessGlyphs data={row.data} productId={row.product.id} />
              </td>
              <td className="hidden px-3 py-2 sm:table-cell">
                <MomentumChip popularity={row.data.popularity[row.product.id]} compact />
              </td>
              <td className="px-3 py-2">
                <AiEraBadge
                  value={row.entry.aiEra}
                  size="sm"
                  components={{
                    agentReady: row.entry.agentReady,
                    apiQuality: row.entry.apiQuality,
                    openness: row.entry.themeScores['openness'] ?? null,
                    agenticApp: row.entry.agenticApp,
                    automation: row.entry.themeScores['automation-depth'] ?? null,
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
