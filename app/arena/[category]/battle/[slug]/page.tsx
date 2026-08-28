import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BattleView from '@/components/BattleView'
import { battleSlug, loadAll, loadCategory, parseBattleSlug } from '@/lib/data'

export function generateStaticParams() {
  return loadAll().flatMap((data) =>
    data.rankings.battles.map((b) => ({ category: data.category.id, slug: battleSlug(b.a, b.b) })),
  )
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}): Promise<Metadata> {
  const { category, slug } = await params
  const data = loadCategory(category)
  const pair = parseBattleSlug(slug, data.products)
  if (!pair) return { title: `Battle — ${data.category.name} Arena` }
  const a = data.products.find((p) => p.id === pair.a)!
  const b = data.products.find((p) => p.id === pair.b)!
  return { title: `${a.name} vs ${b.name} — ${data.category.name}` }
}

export default async function BattlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}) {
  const { category, slug } = await params
  const data = loadCategory(category)
  const pair = parseBattleSlug(slug, data.products)
  if (!pair) notFound()
  const battle = data.rankings.battles.find((b) => b.a === pair.a && b.b === pair.b)
  if (!battle) notFound()
  return <BattleView data={data} battle={battle} />
}
