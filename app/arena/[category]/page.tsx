import type { Metadata } from 'next'
import Link from 'next/link'
import LeaderboardTable from '@/components/LeaderboardTable'
import QuestionRankStrip from '@/components/QuestionRankStrip'
import StacksSection from '@/components/StacksSection'
import StoryMatrix from '@/components/StoryMatrix'
import { loadAll, loadCategory, type CategoryData } from '@/lib/data'
import { categoryFreshness } from '@/lib/freshness'
import { SITE_URL } from '@/lib/site'

// The leaderboard already sorts primarily by aiEra/INIT Score (see lib/scoring.ts), so entry 0
// is the "most agent-friendly" product for both metadata and the FAQ answer below — no
// fabricated ratings, just the same number rendered on the page.
function topEntry(data: CategoryData) {
  const entry = data.rankings.leaderboard[0]
  const product = data.products.find((p) => p.id === entry.productId)!
  return { entry, product }
}

function scoreText(aiEra: number | null): string {
  return aiEra === null ? 'the top evidence-graded coverage score' : `an INIT Score of ${aiEra.toFixed(0)}/100`
}

// Honest FAQPage JSON-LD — both answers are derived straight from this arena's own computed
// data (leaderboard order + aiEra), never a fabricated star rating or invented claim.
function arenaFaqJsonLd(data: CategoryData) {
  const { entry, product } = topEntry(data)
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Which ${data.category.name} product is most agent-friendly?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${product.name} ranks first in INIT's ${data.category.name} arena, with ${scoreText(entry.aiEra)} — see the full evidence-graded leaderboard at ${SITE_URL}/arena/${data.category.id}.`,
        },
      },
      {
        '@type': 'Question',
        name: 'How is this measured?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Every product is judged against a shared taxonomy of user stories using cited evidence (vendor docs, GitHub, community sources, or a hands-on probe) — never opinion. See ${SITE_URL}/methodology for the full scoring writeup.`,
        },
      },
    ],
  }
}

// schema.org ItemList of SoftwareApplication entries — one per product in the arena's
// leaderboard order. Deliberately no aggregateRating: we don't have star ratings, and faking
// one would be dishonest. Our own custom metrics (aiEra, coverage score) are instead exposed
// as additionalProperty PropertyValue entries, which is what schema.org intends for
// non-standard, honestly-labeled metrics.
function arenaJsonLd(data: CategoryData) {
  const productById = new Map(data.products.map((p) => [p.id, p]))
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${data.category.name} Arena`,
    description: data.category.description,
    itemListElement: data.rankings.leaderboard.map((entry, i) => {
      const product = productById.get(entry.productId)!
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: product.name,
          url: `${SITE_URL}/arena/${data.category.id}/product/${product.id}`,
          applicationCategory: data.category.name,
          additionalProperty: [
            { '@type': 'PropertyValue', name: 'aiEra', value: entry.aiEra },
            { '@type': 'PropertyValue', name: 'score', value: entry.score },
          ],
        },
      }
    }),
  }
}

export function generateStaticParams() {
  return loadAll().map((data) => ({ category: data.category.id }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const data = loadCategory(category)
  const { entry, product } = topEntry(data)
  const year = new Date().getFullYear()
  return {
    title: `Best ${data.category.name} for AI agents (${year}) — INIT`,
    description: `Which ${data.category.name} product is most agent-friendly? ${product.name} leads with ${scoreText(entry.aiEra)} in INIT's evidence-graded ${data.category.name} rankings.`,
  }
}

export default async function ArenaPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const data = loadCategory(category)
  const freshness = categoryFreshness(data)
  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(arenaJsonLd(data)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(arenaFaqJsonLd(data)) }}
      />
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Arena</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{data.category.name}</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">{data.category.description}</p>
        <p className="mt-2 text-xs text-zinc-600">
          {data.stories.length} user stories · {data.verdicts.length} judged cells · updated{' '}
          {data.rankings.generatedAt.slice(0, 10)}
          {freshness && <> · Evidence as of {freshness}</>}
        </p>
      </div>
      <QuestionRankStrip
        data={data}
        title="Easiest for AI to use"
        badgeKind="agent-ready"
        rankBy={(entry) => entry.agentReady}
        secondaryLabel="API quality"
        secondaryValue={(entry) => entry.apiQuality}
        showAccessGlyphs
      />
      <QuestionRankStrip
        data={data}
        title="Best AI experience for humans"
        badgeKind="agentic-app"
        rankBy={(entry) => entry.agenticApp}
        secondaryLabel="Automation"
        secondaryValue={(entry) => entry.themeScores['automation-depth'] ?? null}
      />
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Leaderboard <span className="font-normal text-zinc-500">— ranked by</span>{' '}
          <Link href="/methodology#ai-era" className="text-amber-400 underline decoration-amber-400/40 hover:text-amber-300">
            INIT Score
          </Link>
        </h2>
        <LeaderboardTable data={data} />
      </div>
      <StacksSection data={data} />
      <div>
        <h2 className="mb-4 text-lg font-semibold">Story matrix</h2>
        <StoryMatrix data={data} />
      </div>
    </div>
  )
}
