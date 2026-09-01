import type { MetadataRoute } from 'next'
import { battleSlug, loadAll } from '@/lib/data'
import { SITE_URL } from '@/lib/site'

// Static export safety: no dynamic segments, all data is bundled at build time.
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const categories = loadAll()
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now },
    { url: `${SITE_URL}/methodology`, lastModified: now },
    { url: `${SITE_URL}/llms.txt`, lastModified: now },
    { url: `${SITE_URL}/openapi.json`, lastModified: now },
    { url: `${SITE_URL}/rankings/agentic`, lastModified: now },
    { url: `${SITE_URL}/rankings/ai-native`, lastModified: now },
  ]

  for (const data of categories) {
    const generatedAt = new Date(data.rankings.generatedAt)
    entries.push({ url: `${SITE_URL}/arena/${data.category.id}`, lastModified: generatedAt })
    entries.push({ url: `${SITE_URL}/arena/${data.category.id}/llms.md`, lastModified: generatedAt })

    for (const product of data.products) {
      entries.push({ url: `${SITE_URL}/arena/${data.category.id}/product/${product.id}`, lastModified: generatedAt })
      entries.push({ url: `${SITE_URL}/arena/${data.category.id}/product/${product.id}/llms.md`, lastModified: generatedAt })
    }

    for (const battle of data.rankings.battles) {
      entries.push({ url: `${SITE_URL}/arena/${data.category.id}/battle/${battleSlug(battle.a, battle.b)}`, lastModified: generatedAt })
    }
  }

  return entries
}
