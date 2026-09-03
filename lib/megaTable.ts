// Server-side row builder for components/MegaTable.tsx (the homepage's global mega-table over
// every product in every arena). Deliberately produces a flat, minimal MegaTableRow per product
// — no evidence, verdicts, stories, or claims — since this gets serialized as a client-component
// prop and every extra field is bundle weight the table's columns never use.
import { computeAccessGlyphs } from './accessGlyphs'
import type { CategoryData } from './data-helpers'
import { hasLogo } from './logos'
import { type MegaTableRow } from './megaTableSort'

export function buildMegaTableRows(categories: CategoryData[]): MegaTableRow[] {
  const rows: MegaTableRow[] = []
  for (const data of categories) {
    const productById = new Map(data.products.map((p) => [p.id, p]))
    for (const entry of data.rankings.leaderboard) {
      const product = productById.get(entry.productId)
      if (!product) continue
      const glyphs = computeAccessGlyphs(data, product.id)
      rows.push({
        productId: product.id,
        name: product.name,
        vendor: product.vendor,
        type: product.type,
        arenaId: data.category.id,
        arenaName: data.category.name,
        hasLogo: hasLogo(product.id),
        initScore: entry.aiEra,
        agentReady: entry.agentReady,
        agenticApp: entry.agenticApp,
        apiQuality: entry.apiQuality,
        popularity: data.popularity[product.id]?.stars ?? null,
        ycBatch: product.ycBatch,
        access: { MCP: glyphs.MCP, CLI: glyphs.CLI, API: glyphs.API },
      })
    }
  }
  return rows
}

export interface MegaTableArenaOption {
  id: string
  name: string
}

export function buildMegaTableArenaOptions(categories: CategoryData[]): MegaTableArenaOption[] {
  return categories.map((data) => ({ id: data.category.id, name: data.category.name }))
}
