import { loadAll, loadCategory } from '@/lib/data'
import { renderArenaMarkdown } from '@/lib/markdown'

// Static export safety: every {category} value is enumerated at build time below
// (generateStaticParams + dynamicParams = false), so this never needs to run at request time.
export const dynamic = 'force-static'
export const dynamicParams = false

const SITE = 'https://productarena.vercel.app'

export function generateStaticParams() {
  return loadAll().map((data) => ({ category: data.category.id }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const data = loadCategory(category)
  const body = renderArenaMarkdown(data, SITE)
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
