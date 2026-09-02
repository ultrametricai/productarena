import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AgentAccessGlyphs from '@/components/AgentAccessGlyphs'
import AgenticBadge from '@/components/AgenticBadge'
import AiEraBadge from '@/components/AiEraBadge'
import AiModeBadge from '@/components/AiModeBadge'
import { BusinessModelSection } from '@/components/BusinessModel'
import ContestLink from '@/components/ContestLink'
import OssPill from '@/components/OssPill'
import ProductLinkChips from '@/components/ProductLinkChips'
import ProductLogo from '@/components/ProductLogo'
import ScoreBar from '@/components/ScoreBar'
import { originLabel } from '@/components/StoryMatrix'
import ThemeIcon from '@/components/ThemeIcon'
import VerdictBadge from '@/components/VerdictBadge'
import VerificationBadge from '@/components/VerificationBadge'
import { battleSlug, evidenceById, groupInOrder, loadAll, loadCategory, type CategoryData, verdictFor } from '@/lib/data'
import { productFreshness } from '@/lib/freshness'
import type { Product, Story } from '@/lib/schemas'
import { SITE_URL } from '@/lib/site'
import { strongestEvidence, verificationLevel } from '@/lib/verification'

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
  const evidence = evidenceById(data)
  const tierCounts = data.evidence[id].reduce<Record<string, number>>((acc, e) => {
    acc[e.tier] = (acc[e.tier] ?? 0) + 1
    return acc
  }, {})
  const idx = (pid: string) => data.products.findIndex((p) => p.id === pid)
  const byTheme = groupInOrder<Story>(data.stories, (s) => s.theme)

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(data, product)) }}
      />
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Rank #{rank}</p>
        <div className="mt-1 flex flex-wrap items-center gap-4">
          <ProductLogo product={product} size={56} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              {product.type === 'oss' && <OssPill />}
              <AiModeBadge data={data} productId={id} href={`#story-${AI_MODE_STORY_ID}`} />
            </div>
            <p className="text-zinc-500">
              {product.vendor} · {product.type === 'oss' ? 'open source' : 'commercial'}
            </p>
            {freshness && <p className="text-xs text-zinc-600">Evidence as of {freshness}</p>}
          </div>
          <a
            href={product.urls.site}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0 rounded-lg border border-amber-400/60 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/10"
          >
            Visit {product.name} ↗
          </a>
        </div>
        <div className="mt-3">
          <ProductLinkChips product={product} variant="label" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600">INIT Score</span>
            <AiEraBadge value={entry.aiEra} components={{ agentReady: entry.agentReady, apiQuality: entry.apiQuality, openness: entry.themeScores['openness'] ?? null, agenticApp: entry.agenticApp, automation: entry.themeScores['automation-depth'] ?? null }} />
          </div>
          <AgentAccessGlyphs data={data} productId={id} />
        </div>
        <div className="mt-2 flex max-w-md items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">coverage</span>
          <ScoreBar score={entry.score} className="flex-1" />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <AgenticBadge kind="agent-ready" value={entry.agentReady} size="sm" />
          <AgenticBadge kind="agentic-app" value={entry.agenticApp} size="sm" />
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          {entry.applicable}/{entry.total} stories applicable · evidence:{' '}
          {Object.entries(tierCounts)
            .map(([t, n]) => `${t} ×${n}`)
            .join(' · ') || 'none'}
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">By theme</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {byTheme.map(([t]) => {
            const themeScore = entry.themeScores[t] ?? null
            return (
              <a
                key={t}
                href={`#theme-${t}`}
                title={`See the judged stories and evidence behind the ${t} score`}
                className="group rounded-lg border border-zinc-800 p-4 transition hover:border-amber-400/60"
              >
                <p className="mb-2 flex items-center justify-between text-sm text-zinc-400">
                  {t}
                  <span className="text-xs text-zinc-600 opacity-0 transition group-hover:opacity-100">
                    evidence →
                  </span>
                </p>
                {themeScore === null ? (
                  <p className="text-xs italic text-zinc-600">n/a</p>
                ) : (
                  <ScoreBar score={themeScore} />
                )}
              </a>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Story verdicts</h2>
        <div className="space-y-6">
          {byTheme.map(([theme, storiesInTheme]) => {
            const byGroup = groupInOrder<Story>(storiesInTheme, (s) => s.group)
            return (
              <div key={theme} id={`theme-${theme}`} className="scroll-mt-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-amber-400">
                  <ThemeIcon theme={theme} className="text-amber-400" />
                  {theme}
                </h3>
                <div className="space-y-4">
                  {byGroup.map(([group, stories]) => (
                    <div key={group}>
                      {group !== theme && <p className="mb-1 text-xs text-zinc-500">{group}</p>}
                      <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
                        {stories.map((s) => {
                          const v = verdictFor(data, id, s.id)
                          const proof = strongestEvidence(v, evidence)
                          return (
                            <li key={s.id} id={`story-${s.id}`} className="scroll-mt-4 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-medium" title={originLabel(s)}>{s.title}</p>
                                <span className="flex items-center gap-2">
                                  <VerdictBadge verdict={v.verdict} />
                                  <VerificationBadge level={verificationLevel(v, evidence)} />
                                  {v.verdict !== 'na' && (
                                    <span className="font-mono text-sm tabular-nums text-zinc-400">{v.quality}/10</span>
                                  )}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-zinc-500">{v.rationale}</p>
                              {v.evidenceIds.length > 0 && (
                                <p className="mt-1 text-xs text-zinc-600">
                                  {v.evidenceIds.map((eid, i) => {
                                    const e = evidence.get(eid)!
                                    return (
                                      <a key={eid} href={e.url} className="underline decoration-zinc-800 hover:text-amber-300">
                                        {i > 0 ? ' · ' : ''}[{e.tier}]
                                      </a>
                                    )
                                  })}
                                </p>
                              )}
                              <div className="mt-1 flex items-center justify-end gap-3">
                                {proof && (
                                  <a
                                    href={proof.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-zinc-600 hover:text-amber-300"
                                  >
                                    proof ↗
                                  </a>
                                )}
                                <ContestLink category={category} productId={id} storyId={s.id} verdict={v} />
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <BusinessModelSection product={product} />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Battles</h2>
        <div className="flex flex-wrap gap-2">
          {data.products
            .filter((p) => p.id !== id)
            .map((rival) => {
              const [a, b] = idx(id) <= idx(rival.id) ? [id, rival.id] : [rival.id, id]
              return (
                <Link
                  key={rival.id}
                  href={`/arena/${category}/battle/${battleSlug(a, b)}`}
                  className="rounded-full border border-zinc-800 px-3 py-1 text-sm hover:border-amber-400 hover:text-amber-300"
                >
                  vs {rival.name}
                </Link>
              )
            })}
        </div>
      </div>
    </div>
  )
}
