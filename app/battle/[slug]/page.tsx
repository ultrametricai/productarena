import { notFound } from 'next/navigation'
import BattleView from '@/components/BattleView'
import { battleSlug, loadData, parseBattleSlug } from '@/lib/data'

export function generateStaticParams() {
  const data = loadData()
  return data.rankings.battles.map((b) => ({ slug: battleSlug(b.a, b.b) }))
}

export const dynamicParams = false

export default async function BattlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = loadData()
  const pair = parseBattleSlug(slug, data.products)
  if (!pair) notFound()
  const battle = data.rankings.battles.find((b) => b.a === pair.a && b.b === pair.b)
  if (!battle) notFound()
  return <BattleView data={data} battle={battle} />
}
