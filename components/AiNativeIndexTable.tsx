import Link from 'next/link'
import AgenticBadge from '@/components/AgenticBadge'
import AiEraBadge from '@/components/AiEraBadge'
import AiModeBadge from '@/components/AiModeBadge'
import ProductLogo from '@/components/ProductLogo'
import type { CategoryData } from '@/lib/data'

interface IndexRow {
  data: CategoryData
  product: CategoryData['products'][number]
  entry: CategoryData['rankings']['leaderboard'][number]
}

// Sibling of AgenticIndexTable, answering the other half of "which products are most
// AI-friendly": this one sorts by AGENTIC_APP ("does the product act agentically itself" / how
// AI-native the product's own UX is) instead of AGENTREADYNESS ("can your agent drive it").
// Ties break on the automation-depth theme score, then aiEra/INIT Score, both desc/nulls-last.
function buildIndex(categories: CategoryData[]): IndexRow[] {
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
    const xr = x.entry.agenticApp
    const yr = y.entry.agenticApp
    if (xr === null && yr === null) return tiebreak(x, y)
    if (xr === null) return 1
    if (yr === null) return -1
    return yr - xr || tiebreak(x, y)
  })
}

function tiebreak(x: IndexRow, y: IndexRow): number {
  const xa = x.entry.themeScores['automation-depth'] ?? null
  const ya = y.entry.themeScores['automation-depth'] ?? null
  if (xa !== ya) {
    if (xa === null) return 1
    if (ya === null) return -1
    return ya - xa
  }
  const xe = x.entry.aiEra
  const ye = y.entry.aiEra
  if (xe === null && ye === null) return 0
  if (xe === null) return 1
  if (ye === null) return -1
  return ye - xe
}

// `limit` truncates to the top N rows (homepage preview mode); omit it for the full ranking
// (the /rankings/ai-native page). Truncation happens after the sort, never before, so a
// preview is always a strict prefix of the full ranking.
export default function AiNativeIndexTable({ categories, limit }: { categories: CategoryData[]; limit?: number }) {
  const allRows = buildIndex(categories)
  const rows = limit === undefined ? allRows : allRows.slice(0, limit)
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-widest text-zinc-500">
            <th className="sticky left-0 z-10 w-10 bg-zinc-950 px-3 py-2 font-normal">#</th>
            <th className="sticky left-10 z-10 w-[170px] bg-zinc-950 px-3 py-2 font-normal">Product</th>
            <th className="px-3 py-2 font-normal">Arena</th>
            <th className="px-3 py-2 font-normal">Agentic</th>
            <th className="hidden px-3 py-2 font-normal sm:table-cell">Automation</th>
            <th className="px-3 py-2 font-normal">INIT Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/70">
          {rows.map((row, i) => {
            const automation = row.entry.themeScores['automation-depth'] ?? null
            return (
              <tr key={`${row.data.category.id}:${row.product.id}`} className="group transition hover:bg-zinc-900/50">
                <td className="px-3 py-2 font-mono tabular-nums text-zinc-400">{i + 1}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/arena/${row.data.category.id}/product/${row.product.id}`}
                    className="flex items-center gap-2 hover:text-amber-300"
                  >
                    <ProductLogo product={row.product} size={24} />
                    <span className="min-w-0 truncate font-medium">{row.product.name}</span>
                  </Link>
                  <div className="mt-1">
                    <AiModeBadge
                      data={row.data}
                      productId={row.product.id}
                      href={`/arena/${row.data.category.id}/product/${row.product.id}#story-agentic-builtin-assistant`}
                    />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/arena/${row.data.category.id}`} className="text-zinc-400 hover:text-amber-300">
                    {row.data.category.name}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <AgenticBadge kind="agentic-app" value={row.entry.agenticApp} size="sm" />
                </td>
                <td className="hidden px-3 py-2 font-mono tabular-nums text-zinc-400 sm:table-cell">
                  {automation === null ? '—' : automation.toFixed(0)}
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
                      automation,
                    }}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
