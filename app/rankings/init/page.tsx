import type { Metadata } from 'next'
import InitIndexTable, { buildInitIndex } from '@/components/InitIndexTable'
import { loadAll } from '@/lib/data'

export function generateMetadata(): Metadata {
  const categories = loadAll()
  const totalProducts = categories.reduce((sum, data) => sum + data.products.length, 0)
  return {
    title: `Full INIT Score ranking — all ${totalProducts} products — INIT`,
    description: `Every product across every arena ranked by the blended INIT Score (agent-ready, API quality, openness, agentic app, automation). Evidence-graded, no opinion.`,
  }
}

// Static page — no dynamic segments, all data bundled at build time. Third global ranking,
// alongside /rankings/agentic and /rankings/ai-native.
export const dynamic = 'force-static'

export default function InitRankingPage() {
  const categories = loadAll()
  const totalProducts = categories.reduce((sum, data) => sum + data.products.length, 0)
  const rows = buildInitIndex(categories)
  const maxScore = rows.reduce((max, row) => (row.entry.aiEra !== null && row.entry.aiEra > max ? row.entry.aiEra : max), 0)
  const leader = rows.find((r) => r.entry.aiEra === maxScore)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Global ranking</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Highest INIT Score</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          All {totalProducts} products across every arena, ranked by the blended INIT Score — agent-ready, API
          quality, openness, agentic app, and automation, all evidence-graded. Ties break on the raw coverage score.
        </p>
      </div>
      <div className="rounded-xl border border-amber-800/60 bg-amber-400/5 p-4">
        <p className="text-xs uppercase tracking-widest text-amber-400">Highest score found</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-amber-300">
          {maxScore.toFixed(0)}/100
          {leader && <span className="ml-2 text-sm font-normal text-zinc-400">— {leader.product.name}</span>}
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          {maxScore > 50
            ? `At least one product has broken 50/100 — the evidence-graded ceiling is climbing.`
            : `No product scores above 50/100 yet — the AI-ready era is young.`}
        </p>
      </div>
      <InitIndexTable categories={categories} />
    </div>
  )
}
