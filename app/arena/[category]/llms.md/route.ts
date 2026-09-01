import { loadAll, loadCategory } from '@/lib/data'
import { renderArenaMarkdown } from '@/lib/markdown'
import { SITE_URL } from '@/lib/site'

// Static export safety: every {category} value is enumerated at build time below
// (generateStaticParams + dynamicParams = false), so this never needs to run at request time.
export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return loadAll().map((data) => ({ category: data.category.id }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const data = loadCategory(category)
  const body = renderArenaMarkdown(data, SITE_URL)
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
