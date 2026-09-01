import type { Metadata } from 'next'
import Link from 'next/link'
import LeaderboardTable from '@/components/LeaderboardTable'
import QuestionRankStrip from '@/components/QuestionRankStrip'
import StacksSection from '@/components/StacksSection'
import StoryMatrix from '@/components/StoryMatrix'
import { loadAll, loadCategory, type CategoryData } from '@/lib/data'
import { SITE_URL } from '@/lib/site'

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
  return { title: `${data.category.name} Arena — AIness` }
}

export default async function ArenaPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const data = loadCategory(category)
  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(arenaJsonLd(data)) }}
      />
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Arena</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{data.category.name}</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">{data.category.description}</p>
        <p className="mt-2 text-xs text-zinc-600">
          {data.stories.length} user stories · {data.verdicts.length} judged cells · updated{' '}
          {data.rankings.generatedAt.slice(0, 10)}
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
            AI-Era Index
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
