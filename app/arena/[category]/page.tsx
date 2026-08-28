import type { Metadata } from 'next'
import LeaderboardTable from '@/components/LeaderboardTable'
import StacksSection from '@/components/StacksSection'
import StoryMatrix from '@/components/StoryMatrix'
import { loadAll, loadCategory } from '@/lib/data'

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
  return { title: `${data.category.name} Arena — Product Arena` }
}

export default async function ArenaPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const data = loadCategory(category)
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Arena</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{data.category.name}</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">{data.category.description}</p>
        <p className="mt-2 text-xs text-zinc-600">
          {data.stories.length} user stories · {data.verdicts.length} judged cells · updated{' '}
          {data.rankings.generatedAt.slice(0, 10)}
        </p>
      </div>
      <LeaderboardTable data={data} />
      <StacksSection data={data} />
      <div>
        <h2 className="mb-4 text-lg font-semibold">Story matrix</h2>
        <StoryMatrix data={data} />
      </div>
    </div>
  )
}
