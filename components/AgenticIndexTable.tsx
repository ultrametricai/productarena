import Link from 'next/link'
import AgentAccessGlyphs from '@/components/AgentAccessGlyphs'
import AgenticBadge from '@/components/AgenticBadge'
import AiEraBadge from '@/components/AiEraBadge'
import AiModeBadge from '@/components/AiModeBadge'
import OssPill from '@/components/OssPill'
import ProductLogo from '@/components/ProductLogo'
import type { CategoryData } from '@/lib/data'

interface IndexRow {
  data: CategoryData
  product: CategoryData['products'][number]
  entry: CategoryData['rankings']['leaderboard'][number]
}

// Flattens every category's leaderboard into one global list, then sorts by the AGENT-READY
// score (desc, nulls last) — the whole point of "The Agentic Index" is a cross-arena view of
// how friendly products are to AI agents, so agentReady (not the per-category aiEra/score) is
// the primary sort key. Ties break on apiQuality, then aiEra, both desc/nulls-last.
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
    const xr = x.entry.agentReady
    const yr = y.entry.agentReady
    if (xr === null && yr === null) return tiebreak(x, y)
    if (xr === null) return 1
    if (yr === null) return -1
    return yr - xr || tiebreak(x, y)
  })
}

function tiebreak(x: IndexRow, y: IndexRow): number {
  const xq = x.entry.apiQuality
  const yq = y.entry.apiQuality
  if (xq !== yq) {
    if (xq === null) return 1
    if (yq === null) return -1
    return yq - xq
  }
  const xe = x.entry.aiEra
  const ye = y.entry.aiEra
  if (xe === null && ye === null) return 0
  if (xe === null) return 1
  if (ye === null) return -1
  return ye - xe
}

export default function AgenticIndexTable({ categories }: { categories: CategoryData[] }) {
  const rows = buildIndex(categories)
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-widest text-zinc-500">
            <th className="px-3 py-2 font-normal">#</th>
            <th className="px-3 py-2 font-normal">Product</th>
            <th className="px-3 py-2 font-normal">Arena</th>
            <th className="px-3 py-2 font-normal">Agent-ready</th>
            <th className="hidden px-3 py-2 font-normal sm:table-cell">API quality</th>
            <th className="px-3 py-2 font-normal">Access</th>
            <th className="px-3 py-2 font-normal">INIT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/70">
          {rows.map((row, i) => (
            <tr key={`${row.data.category.id}:${row.product.id}`} className="transition hover:bg-zinc-900/50">
              <td className="px-3 py-2 font-mono tabular-nums text-zinc-600">{i + 1}</td>
              <td className="px-3 py-2">
                <Link
                  href={`/arena/${row.data.category.id}/product/${row.product.id}`}
                  className="flex items-center gap-2 hover:text-amber-300"
                >
                  <ProductLogo product={row.product} size={24} />
                  <span className="min-w-0 truncate font-medium">{row.product.name}</span>
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {row.product.type === 'oss' && <OssPill />}
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
                <AgenticBadge kind="agent-ready" value={row.entry.agentReady} size="sm" />
              </td>
              <td className="hidden px-3 py-2 font-mono tabular-nums text-zinc-400 sm:table-cell">
                {row.entry.apiQuality === null ? '—' : row.entry.apiQuality.toFixed(0)}
              </td>
              <td className="px-3 py-2">
                <AgentAccessGlyphs data={row.data} productId={row.product.id} />
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
