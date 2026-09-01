import { loadAll, loadCategory } from '@/lib/data'
import { renderProductMarkdown } from '@/lib/markdown'

// Static export safety: every (category, id) pair is enumerated at build time below
// (generateStaticParams + dynamicParams = false), so this never needs to run at request time.
export const dynamic = 'force-static'
export const dynamicParams = false

const SITE = 'https://productarena.vercel.app'

export function generateStaticParams() {
  return loadAll().flatMap((data) => data.products.map((p) => ({ category: data.category.id, id: p.id })))
}

export async function GET(_req: Request, { params }: { params: Promise<{ category: string; id: string }> }) {
  const { category, id } = await params
  const data = loadCategory(category)
  const body = renderProductMarkdown(data, id, SITE)
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
