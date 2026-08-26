import LeaderboardTable from '@/components/LeaderboardTable'
import { loadData } from '@/lib/data'

export default function Home() {
  const data = loadData()
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Arena 001</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{data.category.name}</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">{data.category.description}</p>
        <p className="mt-2 text-xs text-zinc-600">
          {data.stories.length} user stories · {data.verdicts.length} judged cells · updated{' '}
          {data.rankings.generatedAt.slice(0, 10)}
        </p>
      </div>
      <LeaderboardTable data={data} />
    </div>
  )
}
