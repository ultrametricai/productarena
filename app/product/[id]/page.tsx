import Link from 'next/link'
import { notFound } from 'next/navigation'
import ScoreBar from '@/components/ScoreBar'
import VerdictBadge from '@/components/VerdictBadge'
import { battleSlug, evidenceById, loadData, verdictFor } from '@/lib/data'

export function generateStaticParams() {
  return loadData().products.map((p) => ({ id: p.id }))
}

export const dynamicParams = false

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = loadData()
  const product = data.products.find((p) => p.id === id)
  if (!product) notFound()
  const entry = data.rankings.leaderboard.find((e) => e.productId === id)!
  const rank = data.rankings.leaderboard.indexOf(entry) + 1
  const evidence = evidenceById(data)
  const tierCounts = data.evidence[id].reduce<Record<string, number>>((acc, e) => {
    acc[e.tier] = (acc[e.tier] ?? 0) + 1
    return acc
  }, {})
  const themes = [...new Set(data.stories.map((s) => s.theme))]
  const idx = (pid: string) => data.products.findIndex((p) => p.id === pid)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Rank #{rank}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{product.name}</h1>
        <p className="mt-1 text-zinc-500">
          {product.vendor} · {product.type === 'oss' ? 'open source' : 'commercial'} ·{' '}
          <a href={product.urls.site} className="underline decoration-zinc-700 hover:text-amber-300">site</a>
        </p>
        <ScoreBar score={entry.score} className="mt-4 max-w-md" />
        <p className="mt-2 text-xs text-zinc-600">
          evidence: {Object.entries(tierCounts).map(([t, n]) => `${t} ×${n}`).join(' · ') || 'none'}
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">By theme</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {themes.map((t) => (
            <div key={t} className="rounded-lg border border-zinc-800 p-4">
              <p className="mb-2 text-sm text-zinc-400">{t}</p>
              <ScoreBar score={entry.themeScores[t] ?? 0} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Story verdicts</h2>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
          {data.stories.map((s) => {
            const v = verdictFor(data, id, s.id)
            return (
              <li key={s.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{s.title}</p>
                  <span className="flex items-center gap-2">
                    <VerdictBadge verdict={v.verdict} />
                    <span className="font-mono text-sm tabular-nums text-zinc-400">{v.quality}/10</span>
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
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Battles</h2>
        <div className="flex flex-wrap gap-2">
          {data.products.filter((p) => p.id !== id).map((rival) => {
            const [a, b] = idx(id) <= idx(rival.id) ? [id, rival.id] : [rival.id, id]
            return (
              <Link key={rival.id} href={`/battle/${battleSlug(a, b)}`}
                className="rounded-full border border-zinc-800 px-3 py-1 text-sm hover:border-amber-400 hover:text-amber-300">
                vs {rival.name}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
