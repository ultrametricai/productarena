import type { Metadata } from 'next'
import Link from 'next/link'
import { IntegrationChip, chipTitle, type IntegrationChipData } from '@/components/IntegrationChips'
import { loadAll } from '@/lib/data'
import {
  integrationStats,
  loadIntegrationGraph,
  neighborsOf,
  productRefIndex,
  type IntegrationGraph,
  type ProductRef,
} from '@/lib/integrations'

export const metadata: Metadata = {
  title: 'Integration graph — ProductArena',
  description:
    'Who verifiably connects to whom: every edge between tracked products is backed by a verbatim quote from collected evidence — no edge without a receipt, and a missing edge only ever means no evidence was found.',
}

function chipFor(
  productId: string,
  sources: Array<{ fromProductId: string; excerpt: string }>,
  refs: Map<string, ProductRef>,
): IntegrationChipData | null {
  const ref = refs.get(productId)
  if (!ref) return null
  return {
    productId,
    name: ref.name,
    arenaId: ref.arenaId,
    arenaName: ref.arenaName,
    title: chipTitle(sources, (pid) => refs.get(pid)?.name ?? pid),
  }
}

function neighborChips(graph: IntegrationGraph, productId: string, refs: Map<string, ProductRef>): IntegrationChipData[] {
  return neighborsOf(graph, productId)
    .flatMap((n) => chipFor(n.productId, n.sources, refs) ?? [])
    .sort((a, b) => a.name.localeCompare(b.name))
}

// The ecosystem view: a dense adjacency list grouped by arena (product → its verified
// integration chips) plus headline stats. Fully static — everything resolves from
// data/*/integrations.json at build time.
export default function IntegrationsPage() {
  const categories = loadAll()
  const refs = productRefIndex(categories)
  const graph = loadIntegrationGraph(categories.map((d) => d.category.id))
  const stats = integrationStats(graph, 10)

  // Group connected products under their home arena (a multi-arena product appears once, in its
  // canonical arena — same convention as productRefIndex).
  const arenaSections = categories.flatMap((data) => {
    const rows = data.products
      .filter((p) => refs.get(p.id)?.arenaId === data.category.id)
      .flatMap((p) => {
        const chips = neighborChips(graph, p.id, refs)
        return chips.length > 0 ? [{ product: p, chips }] : []
      })
    return rows.length > 0 ? [{ category: data.category, rows }] : []
  })

  const topChips = stats.topConnected.flatMap(({ productId, neighborCount }) => {
    const ref = refs.get(productId)
    return ref ? [{ productId, neighborCount, ...ref }] : []
  })

  return (
    <div className="space-y-10">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">Integration graph</h1>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
          Who verifiably connects to whom. Every edge is extracted from evidence we already
          collected and carries a verbatim quote from a specific evidence item — verified
          mechanically, or dropped. A missing edge means{' '}
          <span className="text-zinc-300">no evidence of an integration was found in our corpus</span>{' '}
          — never that two products don&rsquo;t integrate.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'verified connections', value: stats.totalPairs, note: 'unique product pairs with ≥1 evidence-backed edge' },
          { label: 'evidence-backed mentions', value: stats.totalMentions, note: 'verbatim integration quotes behind those pairs' },
          { label: 'connected products', value: stats.connectedProducts, note: `of ${refs.size} tracked products fleet-wide` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-zinc-800 p-4 text-center">
            <p className="font-mono text-3xl font-semibold tabular-nums text-emerald-300">{stat.value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">{stat.label}</p>
            <p className="mt-1 text-xs text-zinc-500">{stat.note}</p>
          </div>
        ))}
      </section>

      {topChips.length > 0 && (
        <section>
          <h2 className="font-display leading-[1.1] mb-3 text-lg font-semibold">Most connected</h2>
          <div className="flex flex-wrap gap-2">
            {topChips.map((t) => (
              <Link
                key={t.productId}
                href={`/arena/${t.arenaId}/product/${t.productId}`}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-emerald-400/60 hover:text-emerald-300"
              >
                <span className="font-medium">{t.name}</span>
                <span className="font-mono text-xs tabular-nums text-emerald-400">{t.neighborCount}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <h2 className="font-display leading-[1.1] text-lg font-semibold">By arena</h2>
        {arenaSections.map(({ category, rows }) => (
          <div key={category.id}>
            <h3 className="mb-2 text-sm font-semibold">
              <Link href={`/arena/${category.id}`} className="text-zinc-300 transition hover:text-emerald-300">
                {category.name}
              </Link>
            </h3>
            <div className="divide-y divide-zinc-800/70 rounded-2xl border border-zinc-800">
              {rows.map(({ product, chips }) => (
                <div key={product.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-2 px-4 py-2.5">
                  <Link
                    href={`/arena/${category.id}/product/${product.id}`}
                    className="w-40 shrink-0 truncate text-sm font-medium text-zinc-200 transition hover:text-emerald-300"
                  >
                    {product.name}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                    {chips.map((chip) => (
                      <IntegrationChip key={chip.productId} chip={chip} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {arenaSections.length === 0 && (
          <p className="rounded-2xl border border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
            No verified integration edges yet — the integrations pipeline stage hasn&rsquo;t run.
          </p>
        )}
      </section>

      <p className="text-xs text-zinc-500">
        Edges come from the existing evidence corpus only (product docs, GitHub, community posts we
        already collected — no extra crawling): an exact-name prefilter finds mentions of other
        tracked products, an LLM classifies each mention (real integration vs comparison vs
        coincidence), and every kept edge&rsquo;s quote is verified verbatim against its evidence
        item in code — unverifiable ones are dropped. Hover any chip to read the quote.
      </p>
    </div>
  )
}
