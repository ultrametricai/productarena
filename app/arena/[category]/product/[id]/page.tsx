import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AgentAccessGlyphs from '@/components/AgentAccessGlyphs'
import AgenticBadge from '@/components/AgenticBadge'
import AiEraBadge from '@/components/AiEraBadge'
import AiModeBadge from '@/components/AiModeBadge'
import { BusinessModelSection } from '@/components/BusinessModel'
import ClaimsSection from '@/components/ClaimsSection'
import MomentumChip from '@/components/MomentumChip'
import OssPill from '@/components/OssPill'
import ProductActions from '@/components/ProductActions'
import ProductLogo from '@/components/ProductLogo'
import ProductShowcase from '@/components/ProductShowcase'
import ProofsSection from '@/components/ProofsSection'
import ScoreBar from '@/components/ScoreBar'
import ScoreTrend from '@/components/ScoreTrend'
import StoryVerdictsTable from '@/components/StoryVerdictsTable'
import WatchButton from '@/components/WatchButton'
import YcBadge from '@/components/YcBadge'
import {
  groupInOrder, loadAll, loadCategory, type CategoryData,
} from '@/lib/data'
import { productFreshness } from '@/lib/freshness'
import { globalStoryIds } from '@/lib/globalStories'
import { loadScoreHistory } from '@/lib/scoreHistory'
import type { Product, Story } from '@/lib/schemas'
import { SITE_URL } from '@/lib/site'
import { buildStoryVerdictRows } from '@/lib/storyVerdictsSort'

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
  const tierCounts = data.evidence[id].reduce<Record<string, number>>((acc, e) => {
    acc[e.tier] = (acc[e.tier] ?? 0) + 1
    return acc
  }, {})
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
            {freshness && <p className="text-xs text-zinc-400">Evidence as of {freshness}</p>}
            <div className="mt-1">
              <MomentumChip popularity={data.popularity[id]} />
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <WatchButton productId={id} productName={product.name} />
            <a
              href={product.urls.site}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg border border-emerald-400/60 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/10"
            >
              Visit {product.name} ↗
            </a>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400">Arena Score</span>
            <AiEraBadge value={entry.aiEra} components={{ agentReady: entry.agentReady, apiQuality: entry.apiQuality, openness: entry.themeScores['openness'] ?? null, agenticApp: entry.agenticApp, automation: entry.themeScores['automation-depth'] ?? null }} />
          </div>
          <AgentAccessGlyphs data={data} productId={id} />
        </div>
        <div className="mt-2 flex max-w-md items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400">coverage</span>
          <ScoreBar score={entry.score} className="flex-1" />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <AgenticBadge kind="agent-ready" value={entry.agentReady} size="sm" />
          <AgenticBadge kind="agentic-app" value={entry.agenticApp} size="sm" />
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
        <p className="mt-2 text-xs text-zinc-400">
          {entry.applicable}/{entry.total} stories applicable · evidence:{' '}
          {Object.entries(tierCounts)
            .map(([t, n]) => `${t} ×${n}`)
            .join(' · ') || 'none'}
        </p>
      </div>

      <ProductActions data={data} productId={id} />

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
                title={`See the judged stories and evidence behind the ${t} score`}
                className="group rounded-xl border border-zinc-800 p-4 transition hover:border-emerald-400/60"
              >
                <p className="mb-2 flex items-center justify-between text-sm text-zinc-400">
                  {t}
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
        <StoryVerdictsTable category={category} productId={id} rows={verdictRows} />
      </div>

      <ProofsSection category={category} productId={id} stories={data.stories} />

      <ClaimsSection data={data} category={category} productId={id} />

      <BusinessModelSection product={product} />
      {/* No bottom "Battles" section: ProductActions' "Compare head-to-head" rail above is the
          single authoritative list of this product's battles (same pairings, canonical /vs URLs). */}
    </div>
  )
}
