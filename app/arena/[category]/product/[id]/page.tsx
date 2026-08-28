import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AgenticBadge from '@/components/AgenticBadge'
import ContestLink from '@/components/ContestLink'
import ProductLogo from '@/components/ProductLogo'
import ScoreBar from '@/components/ScoreBar'
import VerdictBadge from '@/components/VerdictBadge'
import VerificationBadge from '@/components/VerificationBadge'
import { battleSlug, evidenceById, groupInOrder, loadAll, loadCategory, verdictFor } from '@/lib/data'
import type { Story } from '@/lib/schemas'
import { verificationLevel } from '@/lib/verification'

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
  const evidence = evidenceById(data)
  const tierCounts = data.evidence[id].reduce<Record<string, number>>((acc, e) => {
    acc[e.tier] = (acc[e.tier] ?? 0) + 1
    return acc
  }, {})
  const idx = (pid: string) => data.products.findIndex((p) => p.id === pid)
  const byTheme = groupInOrder<Story>(data.stories, (s) => s.theme)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Rank #{rank}</p>
        <div className="mt-1 flex items-center gap-4">
          <ProductLogo product={product} size={56} />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-zinc-500">
              {product.vendor} · {product.type === 'oss' ? 'open source' : 'commercial'} ·{' '}
              <a href={product.urls.site} className="underline decoration-zinc-700 hover:text-amber-300">
                site
              </a>
            </p>
          </div>
        </div>
        <div className="mt-4 flex max-w-md flex-wrap items-center gap-4">
          <ScoreBar score={entry.score} className="flex-1" />
          <AgenticBadge value={entry.agenticness} />
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
              <div key={t} className="rounded-lg border border-zinc-800 p-4">
                <p className="mb-2 text-sm text-zinc-400">{t}</p>
                {themeScore === null ? (
                  <p className="text-xs italic text-zinc-600">n/a</p>
                ) : (
                  <ScoreBar score={themeScore} />
                )}
              </div>
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
              <div key={theme}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-amber-400">{theme}</h3>
                <div className="space-y-4">
                  {byGroup.map(([group, stories]) => (
                    <div key={group}>
                      {group !== theme && <p className="mb-1 text-xs text-zinc-500">{group}</p>}
                      <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
                        {stories.map((s) => {
                          const v = verdictFor(data, id, s.id)
                          return (
                            <li key={s.id} className="p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-medium">{s.title}</p>
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
                              <div className="mt-1 text-right">
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
