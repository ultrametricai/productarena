import type { MetadataRoute } from 'next'
import { battleSlug, loadAll } from '@/lib/data'
import { collectGlobalStories } from '@/lib/globalStories'
import { SITE_URL } from '@/lib/site'

// Static export safety: no dynamic segments, all data is bundled at build time.
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const categories = loadAll()
  const now = new Date()
  // One /alternatives/[product] page per unique product id (see that page's dedupe rule).
  const seenProductIds = new Set<string>()

  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now },
    { url: `${SITE_URL}/methodology`, lastModified: now },
    { url: `${SITE_URL}/llms.txt`, lastModified: now },
    { url: `${SITE_URL}/openapi.json`, lastModified: now },
    { url: `${SITE_URL}/proofs`, lastModified: now },
    { url: `${SITE_URL}/badges`, lastModified: now },
    { url: `${SITE_URL}/rankings/agentic`, lastModified: now },
    { url: `${SITE_URL}/rankings/ai-native`, lastModified: now },
    { url: `${SITE_URL}/rankings/claims-integrity`, lastModified: now },
  ]

  for (const data of categories) {
    const generatedAt = new Date(data.rankings.generatedAt)
    entries.push({ url: `${SITE_URL}/arena/${data.category.id}`, lastModified: generatedAt })
    entries.push({ url: `${SITE_URL}/arena/${data.category.id}/llms.md`, lastModified: generatedAt })

    for (const product of data.products) {
      entries.push({ url: `${SITE_URL}/arena/${data.category.id}/product/${product.id}`, lastModified: generatedAt })
      entries.push({ url: `${SITE_URL}/arena/${data.category.id}/product/${product.id}/llms.md`, lastModified: generatedAt })
      if (!seenProductIds.has(product.id)) {
        seenProductIds.add(product.id)
        entries.push({ url: `${SITE_URL}/alternatives/${product.id}`, lastModified: generatedAt })
      }
    }

    for (const battle of data.rankings.battles) {
      const slug = battleSlug(battle.a, battle.b)
      entries.push({ url: `${SITE_URL}/arena/${data.category.id}/battle/${slug}`, lastModified: generatedAt })
      // /vs/{slug} is the canonical top-level mirror of the same battle (see
      // app/vs/[slug]/page.tsx) — listed separately since it's a distinct indexable URL.
      entries.push({ url: `${SITE_URL}/vs/${slug}`, lastModified: generatedAt })
    }
  }

  // Cross-arena /global/[story] comparison pages — one per global story present in ≥2 arenas
  // (see lib/globalStories.ts and app/global/[story]/page.tsx).
  for (const story of collectGlobalStories(categories)) {
    entries.push({ url: `${SITE_URL}/global/${story.id}`, lastModified: now })
  }

  return entries
}
