import type { Metadata } from 'next'
import AgenticIndexTable from '@/components/AgenticIndexTable'
import { loadAll } from '@/lib/data'

export function generateMetadata(): Metadata {
  const categories = loadAll()
  const totalProducts = categories.reduce((sum, data) => sum + data.products.length, 0)
  return {
    title: `Full agentic ranking — all ${totalProducts} products — INIT`,
    description: `Every product across every arena ranked by AGENTREADYNESS — can an agent reach it at all (API/CLI/MCP/webhooks/SDKs/docs)? Evidence-graded, no opinion.`,
  }
}

// Static page — no dynamic segments, all data bundled at build time. Full companion to the
// homepage's top-12 preview table (see app/page.tsx's "Global rankings" section).
export const dynamic = 'force-static'

export default function AgenticRankingPage() {
  const categories = loadAll()
  const totalProducts = categories.reduce((sum, data) => sum + data.products.length, 0)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Global ranking</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Most agentic — best for AI agents</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          All {totalProducts} products across every arena, ranked by AGENTREADYNESS: can an agent reach the product
          at all (API/CLI/MCP/webhooks/SDKs/docs)? Ties break on API quality, then INIT Score.
        </p>
      </div>
      <AgenticIndexTable categories={categories} />
    </div>
  )
}
