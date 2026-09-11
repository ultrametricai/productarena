import type { Metadata } from 'next'
import Link from 'next/link'
import GeoMark from '@/components/GeoMark'
import { IntegrationChip, chipTitle, type IntegrationChipData } from '@/components/IntegrationChips'
import { classifyClassicPairs, loadClassicPairs } from '@/lib/classicPairs'
import { loadAll } from '@/lib/data'
import {
  integrationStats,
  loadIntegrationGraph,
  neighborsOf,
  productRefIndex,
  type IntegrationGraph,
  type ProductRef,
} from '@/lib/integrations'
import { hasLogo } from '@/lib/logos'

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
    hasLogo: hasLogo(productId),
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

  // Classic pairings: curated expectations classified against the verified graph — a pair only
  // ever renders as "verified" (edge + quote exists) or "no evidence found yet". Pairs whose ids
  // don't resolve to tracked products are dropped defensively (tests forbid them anyway).
  const classic = classifyClassicPairs(
    loadClassicPairs().filter((p) => refs.has(p.a) && refs.has(p.b)),
    graph,
  )

  return (
    <div className="space-y-10">
      <section className="mx-auto max-w-3xl text-center">
        {/* seed "integrations": same concept mark as the Explore menu's Integration graph entry. */}
        <h1 className="font-display leading-[1.1] mt-1 flex items-center justify-center gap-2.5 text-3xl font-bold tracking-tight">
          <GeoMark seed="integrations" title="Integration graph — who verifiably connects to whom" size={26} className="text-zinc-500" />
          Integration graph
        </h1>
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
          { id: 'connections', label: 'verified connections', value: stats.totalPairs, note: 'unique product pairs with ≥1 evidence-backed edge' },
          { id: 'mentions', label: 'evidence-backed mentions', value: stats.totalMentions, note: 'verbatim integration quotes behind those pairs' },
          { id: 'connected-products', label: 'connected products', value: stats.connectedProducts, note: `of ${refs.size} tracked products fleet-wide` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-zinc-800 p-4 text-center">
            <p className="font-mono text-3xl font-semibold tabular-nums text-emerald-300">{stat.value}</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-400">
              <GeoMark seed={stat.id} title={stat.label} size={14} className="text-zinc-600" />
              {stat.label}
            </p>
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

      <section aria-label="classic pairings">
        <h2 className="font-display leading-[1.1] flex items-center gap-2 text-lg font-semibold">
          <GeoMark seed="classic-pairs" title="Classic pairings — the interconnects everyone expects, checked against our evidence" size={18} className="text-zinc-500" />
          Classic pairings
        </h2>
        <p className="mb-3 mt-1 max-w-2xl text-xs text-zinc-500">
          {classic.statuses.length} pairings the industry simply expects (payments↔accounting,
          chat↔issues, repo↔deploys…), checked against the evidence graph:{' '}
          <span className="text-emerald-300">{classic.verified} verified</span> ·{' '}
          <span className="text-zinc-400">{classic.unverified} no evidence found yet</span>.
          &ldquo;No evidence yet&rdquo; means exactly that — our corpus hasn&rsquo;t surfaced a
          quote — never that the integration doesn&rsquo;t exist. The unverified half is our
          evidence-coverage to-do list.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {classic.statuses.map((s) => {
            const a = refs.get(s.a)!
            const b = refs.get(s.b)!
            return (
              <div
                key={s.key}
                title={
                  s.verified
                    ? `${s.expectation}\n\n${chipTitle(s.sources, (pid) => refs.get(pid)?.name ?? pid)}`
                    : `${s.expectation}\n\nNo evidence-backed edge in our corpus yet — not a claim that they don't integrate.`
                }
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                  s.verified ? 'border-emerald-400/30 bg-emerald-400/[0.04]' : 'border-zinc-800'
                }`}
              >
                <p className="min-w-0 truncate text-sm">
                  <Link href={`/arena/${a.arenaId}/product/${s.a}`} className="font-medium text-zinc-200 transition hover:text-emerald-300">
                    {a.name}
                  </Link>
                  <span aria-hidden className="mx-1.5 text-zinc-600">↔</span>
                  <Link href={`/arena/${b.arenaId}/product/${s.b}`} className="font-medium text-zinc-200 transition hover:text-emerald-300">
                    {b.name}
                  </Link>
                </p>
                {s.verified ? (
                  <span className="shrink-0 rounded bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                    ✓ verified
                  </span>
                ) : (
                  <span className="shrink-0 rounded bg-zinc-800/60 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                    no evidence yet
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </section>

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
