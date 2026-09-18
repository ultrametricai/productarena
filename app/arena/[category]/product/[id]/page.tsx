import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import arenaIcons from '@/data/arena-icons.json'
import AgentAccessGlyphs from '@/components/AgentAccessGlyphs'
import { AuthGatedChip } from '@/components/AuthGatedMarker'
import AgenticBadge from '@/components/AgenticBadge'
import AiEraBadge from '@/components/AiEraBadge'
import AiModeBadge from '@/components/AiModeBadge'
import { BusinessModelSection } from '@/components/BusinessModel'
import ClaimsSection from '@/components/ClaimsSection'
import CoverageMapSection from '@/components/CoverageMapSection'
import FamilySection from '@/components/FamilySection'
import GeoMark from '@/components/GeoMark'
import IntegrationChips, { chipTitle } from '@/components/IntegrationChips'
import MomentumChip from '@/components/MomentumChip'
import MomentumTrend from '@/components/MomentumTrend'
import OpportunitiesSection from '@/components/OpportunitiesSection'
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
import EnterpriseBadge from '@/components/EnterpriseBadge'
import ShutdownBadge from '@/components/ShutdownBadge'
import YcBadge from '@/components/YcBadge'
import { arenaMembershipsOf } from '@/lib/alternatives'
import {
  groupInOrder, loadAll, loadCategory, type CategoryData,
} from '@/lib/data'
import { isGroupUntested } from '@/lib/data-helpers'
import { globalStoryIds } from '@/lib/globalStories'
import { humanizeTheme, themeExplanation } from '@/lib/icons'
import { loadIntegrationGraph, neighborsOf, productRefIndex } from '@/lib/integrations'
import { hasLogo } from '@/lib/logos'
import { loadPopularityHistory, popularitySeries } from '@/lib/popularityHistory'
import { loadPricing } from '@/lib/pricing'
import { loadScoreHistory } from '@/lib/scoreHistory'
import { aiEraBandFor, loadScoreIntervals } from '@/lib/scoreIntervals'
import type { Product, Story } from '@/lib/schemas'
import { authGatedProbeCount } from '@/lib/verification'
import { SITE_URL } from '@/lib/site'
import { loadStoryTiers, storyTiersByCell, tierCountsFor } from '@/lib/storyTiers'
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
  // "— ProductArena" suffix like every other page title on the site.
  return { title: `${product ? product.name : id} — ${data.category.name} Arena — ProductArena` }
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
  const naDims = new Set(data.category.naDimensions ?? [])
  const byTheme = groupInOrder<Story>(data.stories, (s) => s.theme)
  // Flattened, serializable (story, verdict) rows for the client-side sortable table — the
  // full CategoryData never crosses the server/client boundary. globalStoryIds(loadAll())
  // lets a global story's [G] chip link to its /global/[story] cross-arena page (loadAll is
  // cached in lib/data.ts, so this costs nothing extra at build time).
  // Pricing-tier annotations (lib/storyTiers.ts) — tolerant-optional: an unclassified arena
  // loads an empty list, rows carry no tier, and the "What's free" line below renders nothing.
  const storyTiers = loadStoryTiers(category)
  const verdictRows = buildStoryVerdictRows(data, id, globalStoryIds(loadAll()), storyTiersByCell(storyTiers))
  const tierCounts = tierCountsFor(storyTiers, id)
  const gatedCount = tierCounts.free + tierCounts.paid + tierCounts.enterprise
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
  // Every arena this product id competes in (sentry: observability AND error-tracking; brex:
  // startup-banking AND expense-management), each with its live rank there — the header's
  // arenas strip, so a user can jump straight to any leaderboard the vendor is a member of.
  const memberships = arenaMembershipsOf(allCategories, id)

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(data, product)) }}
      />
      <div>
        {/* Arena identity, instantly (Stripe-employee feedback: "hard to tell what category this
            product was in"). Breadcrumb for orientation, then the eyebrow names the arena — with
            its emoji — as a prominent link to the leaderboard the rank comes from. This is the
            page's own category; FamilySection below covers sibling products, not this. */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-500">
          <Link href="/" className="transition hover:text-emerald-300">Arenas</Link>
          <span aria-hidden className="text-zinc-700">→</span>
          <Link href={`/arena/${category}`} className="transition hover:text-emerald-300">
            {data.category.name}
          </Link>
          <span aria-hidden className="text-zinc-700">→</span>
          <span className="text-zinc-400">{product.name}</span>
        </nav>
        {/* Founder 2026-09-18: no "Rank #X of Y in <arena>" eyebrow — the arenas strip below
            already carries the arena chips with live ranks; saying it twice wasted the top. */}
        <div className="mt-1 flex flex-wrap items-center gap-4">
          <ProductLogo product={product} size={56} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display leading-[1.1] text-3xl font-bold tracking-tight">{product.name}</h1>
              {product.type === 'oss' && <OssPill />}
              <YcBadge ycBatch={product.ycBatch} />
              <EnterpriseBadge enterprise={product.enterprise} />
              <ShutdownBadge shutdown={product.shutdown} source={product.shutdownSource} />
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
        {/* PRIMARY metrics row — the "should I care" read: PA Score (+68% band), the three
            agenticness indexes, and the MCP/CLI/API access glyphs. Everything below this row
            is deliberately quieter (secondary: momentum/vendor responses; then the arenas
            strip). Every pill clicks through to THIS product's transparent calculation page
            (/score, per-dimension anchors) — the exact stories, verdicts, evidence, and
            arithmetic behind its number (founder 2026-09-15). */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Founder 2026-09-15: "PA Score" lives INSIDE the pill (label prop), consistent with
              the self-labeled Agent-ready / Built-in AI pills beside it. */}
          <AiEraBadge label="PA Score" value={entry.aiEra} href={`/arena/${category}/product/${id}/score`} interval={aiEraBandFor(loadScoreIntervals(category), id)} showBand components={{ agentReady: entry.agentReady, apiQuality: entry.apiQuality, openness: entry.themeScores['openness'] ?? null, agenticApp: entry.agenticApp, automation: entry.themeScores['automation-depth'] ?? null }} />
          {/* naDimensions (hardware arenas): a suppressed dimension renders the muted "n/a"
              pill (value=null path) — a chip has no agent-drivable surface or API of its own,
              and a number would overstate; the PA Score above still applies. */}
          <AgenticBadge kind="agent-ready" value={naDims.has('agentReady') ? null : entry.agentReady} untested={!naDims.has('agentReady') && isGroupUntested(data, id, 'agent-access')} href={naDims.has('agentReady') ? undefined : `/arena/${category}/product/${id}/score#agent-ready`} />
          <AgenticBadge kind="agentic-app" value={naDims.has('agenticApp') ? null : entry.agenticApp} untested={!naDims.has('agenticApp') && isGroupUntested(data, id, 'agentic-features')} href={naDims.has('agenticApp') ? undefined : `/arena/${category}/product/${id}/score#built-in-ai`} />
          <AgenticBadge kind="api-quality" value={naDims.has('apiQuality') ? null : entry.apiQuality} untested={!naDims.has('apiQuality') && isGroupUntested(data, id, 'api-quality')} href={naDims.has('apiQuality') ? undefined : `/arena/${category}/product/${id}/score#api-quality`} />
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
        {/* Arenas strip — one chip per arena this product id is ranked in, emoji + name +
            live rank, each linking to that leaderboard (founder: members-of arenas belong at
            the top; the old tertiary "Evidence as of · story coverage" line that held this
            slot is now provenance fine print in ProductFinePrint at the page bottom). The
            current arena is included, highlighted, so multi-arena products (sentry, brex)
            read as one roster rather than "this arena + others". */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">Arenas</span>
          {memberships.map((m) => (
            <Link
              key={m.arenaId}
              href={`/arena/${m.arenaId}`}
              title={`${m.arenaName} — ${product.name} is ranked #${m.rank} of ${m.fieldSize} in this arena. See the full leaderboard.`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition ${
                m.arenaId === category
                  ? 'border-emerald-400/50 bg-emerald-400/5 text-emerald-300 hover:border-emerald-400/80'
                  : 'border-zinc-800 text-zinc-300 hover:border-emerald-400/60 hover:text-emerald-300'
              }`}
            >
              {(arenaIcons as Record<string, string>)[m.arenaId] && (
                <span aria-hidden>{(arenaIcons as Record<string, string>)[m.arenaId]}</span>
              )}
              {m.arenaName}
              <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                #{m.rank}/{m.fieldSize}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Founder 2026-09-15: only the human essentials above the fold (Access, Install,
          Compare). Try/Flag/Badge/For agents/Data live in the bottom rail near the page end. */}
      <ProductActions data={data} productId={id} variant="top" />

      {/* Showcase (screenshots) above the microterminal — founder rule: show what the product
          looks like before the hands-on replay. */}
      <ProductShowcase product={product} />

      {/* Multi-product vendors: the family breakdown block (lib/families.ts) — renders for any
          product with a data/product-families.json entry, nothing for everyone else. Founder
          2026-09-15: Products above Try it — the portfolio orients before the hands-on replay. */}
      <FamilySection arenaId={category} productId={id} />

      <TryItSection category={category} productId={id} productName={product.name} stories={data.stories} />

      {/* Verified integrations, right after the family/trend block (founder: more useful than
          its old bottom-of-page slot) — each chip's tooltip quotes the evidence excerpt(s) the
          edge rests on. Renders nothing when the product has no verified edges. */}
      <IntegrationChips chips={integrationChips} />

      {product.affiliation && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200/90">
          <span className="mr-2 rounded border border-emerald-400/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Affiliation
          </span>
          {product.affiliation}
        </div>
      )}

      <div>
        <h2 className="font-display leading-[1.1] mb-3 flex items-center gap-2 text-lg font-semibold">
          <GeoMark seed="themes" title="By theme — the product's score on each story theme" size={18} className="text-zinc-500" />
          By theme
        </h2>
        {/* grid-cols-1 (not the bare implicit column): Tailwind's template is minmax(0, 1fr),
            which lets the truncate/nowrap card rows shrink — the implicit auto column sizes to
            max-content and horizontally scrolled the whole page at 375px. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <p className="flex items-center justify-between text-sm text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <ThemeIcon theme={t} />
                    {humanizeTheme(t)}
                  </span>
                  <span className="text-xs text-zinc-400 opacity-0 transition group-hover:opacity-100">
                    evidence →
                  </span>
                </p>
                {/* Visible one-line explanation of what this grouping means (founder rule:
                    don't hide it behind the icon tooltip) — truncated, never wrapping the card. */}
                <p className="mb-2 mt-0.5 truncate text-xs text-zinc-500">{themeExplanation(t)}</p>
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
        <h2 className="font-display leading-[1.1] mb-3 flex items-center gap-2 text-lg font-semibold">
          <GeoMark seed="story-verdicts" title="Story verdicts — every judged story with its evidence" size={18} className="text-zinc-500" />
          Story verdicts
        </h2>
        {/* "What's free" — the pricing-tier dimension in one line: of the stories this product
            delivers (full/partial), how many the cited evidence says work free / need a paid
            plan / are enterprise-gated. `unknown` stays visible so silence never reads as
            free. Renders only when at least one cell was actually classified. */}
        {gatedCount > 0 && (
          <p className="mb-3 text-xs text-zinc-400">
            <Link
              href="/methodology#story-tiers"
              title="Pricing-tier annotation, classified from each verdict's cited evidence and the vendor's pricing evidence only — 'unknown' means the evidence never states gating. Never affects verdicts or scores."
              className="uppercase tracking-widest text-zinc-500 underline decoration-zinc-800 underline-offset-2 transition hover:text-emerald-300"
            >
              What&rsquo;s free
            </Link>
            {': '}
            <span className="text-emerald-300">{tierCounts.free} free</span>
            {' · '}
            <span className="text-zinc-300">{tierCounts.paid} paid</span>
            {' · '}
            <span className="text-violet-300">{tierCounts.enterprise} enterprise</span>
            {tierCounts.unknown > 0 && (
              <span className="text-zinc-500"> · {tierCounts.unknown} not stated in evidence</span>
            )}
          </p>
        )}
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

      {/* The vendor's to-do list: every none/partial verdict above, ranked by score headroom
          (lib/opportunities.ts) — collapsed by default, pure derivation from the verdicts. */}
      <OpportunitiesSection data={data} productId={id} productName={product.name} />

      {/* The inverse of the table's per-row "Covered by" chips: each evidence surface with the
          stories it covers (lib/storyCoverage.ts) — collapsed by default, pure derivation from
          the citations above. */}
      <CoverageMapSection data={data} productId={id} />

      <ProofsSection category={category} productId={id} stories={data.stories} />

      <ClaimsSection data={data} category={category} productId={id} />

      {/* Pricing-covered arenas only (lib/pricing.ts): renders nothing when this product has no
          pricing entry, "pricing unclear" when the vendor's page couldn't be read honestly. */}
      <PricingSignals entry={loadPricing(category)[id]} />

      <BusinessModelSection product={product} />

      {/* Founder 2026-09-15: score trend + the utility rail (Try/Flag/Badge/For agents/Data)
          and the auth-gated probe chip live at the page end — provenance and tooling for readers
          who scrolled the evidence, not prime above-the-fold space. */}
      <ScoreTrend entries={loadScoreHistory(category).get(id) ?? []} />
      <ProductActions data={data} productId={id} tryIt={tryable} variant="bottom" />
      <div>
        <AuthGatedChip count={authGatedProbeCount(data, id)} />
      </div>
      {/* No bottom "Battles" section: ProductActions' "Compare head-to-head" rail above is the
          single authoritative list of this product's battles (same pairings, canonical /vs URLs). */}

      {/* Ops fine print, dead last (founder: educate first, ops last): 30-day agent-surface
          uptime (renders nothing until slo-check has history — lib/slo.ts). The "Evidence as
          of · story coverage" provenance line stays removed entirely (founder 2026-09-15 —
          the later ruling supersedes the earlier "demote to bottom" re-scope). */}
      <SloUptimeLine arena={category} productId={id} />
    </div>
  )
}
