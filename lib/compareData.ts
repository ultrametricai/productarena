// Server-side builder for the lean all-products list that /compare (components/CompareBuilder)
// and /stacks/builder (components/StackBuilder) receive as a prop. Same rationale as
// lib/megaTable.ts: the client components search/pick over every product on the site, so each
// entry is flattened to exactly the fields those UIs render — no evidence, verdicts, or stories.
import { computeAccessGlyphs } from './accessGlyphs'
import type { CompareProduct } from './compare'
import type { CategoryData } from './data-helpers'
import { hasLogo } from './logos'

export function buildCompareProducts(categories: CategoryData[]): CompareProduct[] {
  const out: CompareProduct[] = []
  for (const data of categories) {
    const productById = new Map(data.products.map((p) => [p.id, p]))
    for (const entry of data.rankings.leaderboard) {
      const product = productById.get(entry.productId)
      if (!product) continue
      const glyphs = computeAccessGlyphs(data, product.id)
      out.push({
        id: product.id,
        name: product.name,
        arenaId: data.category.id,
        arenaName: data.category.name,
        type: product.type,
        aiEra: entry.aiEra,
        agentReady: entry.agentReady,
        agenticApp: entry.agenticApp,
        apiQuality: entry.apiQuality,
        themeScores: entry.themeScores,
        access: { MCP: glyphs.MCP.char, CLI: glyphs.CLI.char, API: glyphs.API.char },
        hasLogo: hasLogo(product.id),
      })
    }
  }
  return out
}
