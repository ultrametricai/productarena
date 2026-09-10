import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AgentAccessGlyphs from '@/components/AgentAccessGlyphs'
import AgenticBadge from '@/components/AgenticBadge'
import AiEraBadge from '@/components/AiEraBadge'
import AiModeBadge from '@/components/AiModeBadge'
import { BusinessModelSection } from '@/components/BusinessModel'
import ClaimsSection from '@/components/ClaimsSection'
import IntegrationChips, { chipTitle } from '@/components/IntegrationChips'
import MomentumChip from '@/components/MomentumChip'
import MomentumTrend from '@/components/MomentumTrend'
import OssPill from '@/components/OssPill'
import ProductActions from '@/components/ProductActions'
import PricingSignals from '@/components/PricingSignals'
import ProductLogo from '@/components/ProductLogo'
import ProductShowcase from '@/components/ProductShowcase'
import ProofsSection from '@/components/ProofsSection'
import ScoreBar from '@/components/ScoreBar'
import ScoreTrend from '@/components/ScoreTrend'
import SloUptimeLine from '@/components/SloUptimeLine'
import StoryMap from '@/components/StoryMap'
import StoryVerdictsTable from '@/components/StoryVerdictsTable'
import ThemeIcon from '@/components/ThemeIcon'
import StoryViewToggle from '@/components/StoryViewToggle'
import TryItSection from '@/components/TryIt/TryItSection'
import WatchButton from '@/components/WatchButton'
import YcBadge from '@/components/YcBadge'
import {
  groupInOrder, loadAll, loadCategory, type CategoryData,
} from '@/lib/data'
import { productFreshness } from '@/lib/freshness'
import { globalStoryIds } from '@/lib/globalStories'
import { humanizeTheme } from '@/lib/icons'
import { loadIntegrationGraph, neighborsOf, productRefIndex } from '@/lib/integrations'
import { hasLogo } from '@/lib/logos'
import { loadPopularityHistory, popularitySeries } from '@/lib/popularityHistory'
import { loadPricing } from '@/lib/pricing'
import { loadScoreHistory } from '@/lib/scoreHistory'
import { aiEraBandFor, loadScoreIntervals } from '@/lib/scoreIntervals'
import type { Product, Story } from '@/lib/schemas'
import { SITE_URL } from '@/lib/site'
import { buildStoryVerdictRows } from '@/lib/storyVerdictsSort'
import { hasTryIt } from '@/lib/tryit'

const AI_MODE_STORY_ID = 'agentic-builtin-assistant'

// schema.org SoftwareApplication for one product. No aggregateRating (see arena page's
// comment) — our custom metrics go in additionalProperty instead.
function productJsonLd(data: CategoryData, product: Product) {
  const entry = data.rankings.leaderboard.find((e) => e.productId === product.id)!
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    url: `${SITE_URL}/arena/${data.category.id}/product/${product.id}`,
    applicationCategory: data.category.name,
    ...(product.vendor ? { author: { '@type': 'Organization', name: product.vendor } } : {}),
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'aiEra', value: entry.aiEra },
      { '@type': 'PropertyValue', name: 'score', value: entry.score },
      { '@type': 'PropertyValue', name: 'agentReady', value: entry.agentReady },
      { '@type': 'PropertyValue', name: 'apiQuality', value: entry.apiQuality },
    ],
  }
}

export function generateStaticParams() {
  return loadAll().flatMap((data) => data.products.map((p) => ({ category: data.category.id, id: p.id })))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; id: string }>
}): Promise<Metadata> {
  const { category, id } = await params
  const data = loadCategory(category)
  const product = data.products.find((p) => p.id === id)
  return { title: `${product ? product.name : id} — ${data.category.name} Arena` }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>
}) {
  const { category, id } = await params
  const data = loadCategory(category)
  const product = data.products.find((p) => p.id === id)
  if (!product) notFound()
  const entry = data.rankings.leaderboard.find((e) => e.productId === id)!
  const rank = data.rankings.leaderboard.indexOf(entry) + 1
  const freshness = productFreshness(data, id)
  const byTheme = groupInOrder<Story>(data.stories, (s) => s.theme)
  // Flattened, serializable (story, verdict) rows for the client-side sortable table — the
  // full CategoryData never crosses the server/client boundary. globalStoryIds(loadAll())
  // lets a global story's [G] chip link to its /global/[story] cross-arena page (loadAll is
  // cached in lib/data.ts, so this costs nothing extra at build time).
  const verdictRows = buildStoryVerdictRows(data, id, globalStoryIds(loadAll()))
  // Verified official vendor responses for this product (see docs/VENDOR-RESPONSES.md) — the
  // header chip links down to the verdicts table, where each response renders inside its
  // story's expanded row.
  const vendorResponseCount = data.vendorResponses.filter((r) => r.productId === id).length
  // "Try it" (components/TryIt/*) exists for products with ≥1 replayable recorded proof or an
  // allowlisted live MCP endpoint. Only then does the header's primary CTA become hands-on —
  // products with neither keep "Visit" as primary (no fake try).
  const tryable = hasTryIt(category, id)
  // Momentum sparklines beside the chip — stars/downloads over time from
  // popularity-history.jsonl (tolerant-optional; series with <2 distinct snapshots render
  // nothing — see components/MomentumTrend.tsx).
  const popularityLines = loadPopularityHistory(category).get(id) ?? []
  const momentumSeries = [
    { label: '★', points: popularitySeries(popularityLines, 'stars') },
    { label: 'npm/wk', points: popularitySeries(popularityLines, 'npmWeekly') },
    { label: 'pypi/wk', points: popularitySeries(popularityLines, 'pypiWeekly') },
  ]
  // Verified integration neighbors from the fleet-wide graph (lib/integrations.ts) — each chip's
  // tooltip quotes the evidence excerpt(s) the edge rests on, verbatim. Renders nothing when the
  // product has no verified edges (absence of evidence, displayed as absence).
  const allCategories = loadAll()
  const refs = productRefIndex(allCategories)
  const nameOf = (pid: string) => refs.get(pid)?.name ?? pid
  const integrationChips = neighborsOf(loadIntegrationGraph(allCategories.map((d) => d.category.id)), id)
    .flatMap((n) => {
      const ref = refs.get(n.productId)
      if (!ref) return []
      return [{
        productId: n.productId,
        name: ref.name,
        arenaId: ref.arenaId,
        arenaName: ref.arenaName,
        title: chipTitle(n.sources, nameOf),
        hasLogo: hasLogo(n.productId),
      }]
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(data, product)) }}
      />
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">Rank #{rank}</p>
        <div className="mt-1 flex flex-wrap items-center gap-4">
          <ProductLogo product={product} size={56} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display leading-[1.1] text-3xl font-bold tracking-tight">{product.name}</h1>
              {product.type === 'oss' && <OssPill />}
              <YcBadge ycBatch={product.ycBatch} />
              <AiModeBadge data={data} productId={id} href={`#story-${AI_MODE_STORY_ID}`} />
            </div>
            {/* The OssPill beside the name is the one open-source signal — repeating "open
                source" here would say it twice, so the prose only ever adds "commercial". */}
            <p className="text-zinc-500">
              {product.vendor}
              {product.type === 'commercial' && ' · commercial'}
            </p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <WatchButton productId={id} productName={product.name} />
            {tryable ? (
              <>
                {/* Vendor link stays, demoted to plain domain text — trying beats bouncing. */}
                <a
                  href={product.urls.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-mono text-sm text-zinc-400 underline decoration-zinc-700 underline-offset-2 transition hover:text-emerald-300"
                >
                  {new URL(product.urls.site).hostname.replace(/^www\./, '')} ↗
                </a>
                <a
                  href="#try-it"
                  className="shrink-0 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
                >
                  Try it →
                </a>
              </>
            ) : (
              <a
                href={product.urls.site}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 font-mono text-sm text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 transition hover:text-emerald-200"
              >
                {new URL(product.urls.site).hostname.replace(/^www\./, '')} ↗
              </a>
            )}
          </div>
        </div>
        {/* PRIMARY metrics row — the "should I care" read: PA Score (+68% band), the two
            agenticness indexes, and the MCP/CLI/API access glyphs. Everything below this row
            is deliberately quieter (secondary: momentum/vendor responses/uptime; tertiary:
            freshness + coverage in the muted footer line). */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400">PA Score</span>
            {/* showBand renders the "±N" (68% interval, lib/scoreIntervals.ts) inline in muted
                smaller type — only when interval data exists for this product, never fabricated. */}
            <AiEraBadge value={entry.aiEra} interval={aiEraBandFor(loadScoreIntervals(category), id)} showBand components={{ agentReady: entry.agentReady, apiQuality: entry.apiQuality, openness: entry.themeScores['openness'] ?? null, agenticApp: entry.agenticApp, automation: entry.themeScores['automation-depth'] ?? null }} />
          </div>
          <AgenticBadge kind="agent-ready" value={entry.agentReady} />
          <AgenticBadge kind="agentic-app" value={entry.agenticApp} />
          <AgentAccessGlyphs data={data} productId={id} size="md" />
        </div>
        {/* SECONDARY row — adoption signals (registry data, never part of the PA Score) and the
            vendor-response chip. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <MomentumChip popularity={data.popularity[id]} />
          <MomentumTrend series={momentumSeries} />
          {vendorResponseCount > 0 && (
            <a
              href="#story-verdicts"
              title="Verified official statements from the vendor on specific verdicts — published verbatim, they never change a verdict by themselves. Expand the story's row below to read them."
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-400/5 px-2.5 py-0.5 text-xs text-sky-300 transition hover:border-sky-400/70"
            >
              <span className="rounded border border-sky-400/60 px-1 text-[9px] font-semibold uppercase tracking-wide">
                Vendor
              </span>
              {vendorResponseCount} vendor {vendorResponseCount === 1 ? 'response' : 'responses'}
            </a>
          )}
        </div>
        {/* 30-day uptime of the monitored agent surfaces (llms.txt / MCP / openapi.json) —
            renders nothing until slo-check has history for this product (lib/slo.ts). */}
        <SloUptimeLine arena={category} productId={id} />
        {/* TERTIARY footer line — provenance minutiae, demoted (not deleted): evidence
            freshness (lib/freshness.ts) and the story-coverage score, which used to be a
            full-width bar but mostly restates what PA Score + its confidence band already say. */}
        <p className="mt-3 text-[10px] text-zinc-500">
          {freshness && <span>Evidence as of {freshness} · </span>}
          <span title="Evidence-graded story coverage (0–100): how much of this arena's story set the product covers, weighted by story importance. The rank tie-breaker, not the PA Score.">
            story coverage <span className="font-mono tabular-nums">{entry.score.toFixed(1)}/100</span>
          </span>
        </p>
      </div>

      <ProductActions data={data} productId={id} tryIt={tryable} />

      <TryItSection category={category} productId={id} productName={product.name} stories={data.stories} />

      <ScoreTrend entries={loadScoreHistory(category).get(id) ?? []} />

      <ProductShowcase product={product} />

      {product.affiliation && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200/90">
          <span className="mr-2 rounded border border-emerald-400/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Affiliation
          </span>
          {product.affiliation}
        </div>
      )}

      <div>
        <h2 className="font-display leading-[1.1] mb-3 text-lg font-semibold">By theme</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {byTheme.map(([t]) => {
            const themeScore = entry.themeScores[t] ?? null
            // The old per-theme anchors died with the vertical list — the sortable table below
            // (id="story-verdicts") has its own theme dropdown, so every theme card lands on
            // the same table rather than leaving a dead #theme-<t> link.
            return (
              <a
                key={t}
                href="#story-verdicts"
                title={`See the judged stories and evidence behind the ${humanizeTheme(t)} score`}
                className="group rounded-xl border border-zinc-800 p-4 transition hover:border-emerald-400/60"
              >
                <p className="mb-2 flex items-center justify-between text-sm text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <ThemeIcon theme={t} />
                    {humanizeTheme(t)}
                  </span>
                  <span className="text-xs text-zinc-400 opacity-0 transition group-hover:opacity-100">
                    evidence →
                  </span>
                </p>
                {themeScore === null ? (
                  <p className="text-xs italic text-zinc-400">n/a</p>
                ) : (
                  <ScoreBar score={themeScore} />
                )}
              </a>
            )
          })}
        </div>
      </div>

      <div id="story-verdicts" className="scroll-mt-4">
        <h2 className="font-display leading-[1.1] mb-3 text-lg font-semibold">Story verdicts</h2>
        {/* Two server-rendered views of the same verdict rows, toggled client-side via `hidden`
            (static-export safe — both are in the HTML). Table = the flat, sortable evidence
            surface every #story-<id> deep link targets; Map = the capability DAG (curated canon
            graph + heuristic domain clusters) whose verdict-tinted blocks show where the
            product's capability frontier greys out. */}
        <StoryViewToggle
          map={<StoryMap rows={verdictRows} productName={product.name} />}
          table={<StoryVerdictsTable category={category} productId={id} rows={verdictRows} />}
        />
      </div>

      <ProofsSection category={category} productId={id} stories={data.stories} />

      <ClaimsSection data={data} category={category} productId={id} />

      <IntegrationChips chips={integrationChips} />

      {/* Pricing-covered arenas only (lib/pricing.ts): renders nothing when this product has no
          pricing entry, "pricing unclear" when the vendor's page couldn't be read honestly. */}
      <PricingSignals entry={loadPricing(category)[id]} />

      <BusinessModelSection product={product} />
      {/* No bottom "Battles" section: ProductActions' "Compare head-to-head" rail above is the
          single authoritative list of this product's battles (same pairings, canonical /vs URLs). */}
    </div>
  )
}
