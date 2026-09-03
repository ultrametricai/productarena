// Server-side row builder for components/MegaTable.tsx (the homepage's global mega-table over
// every product in every arena). Deliberately produces a flat, minimal MegaTableRow per product
// — no evidence, verdicts, stories, or claims — since this gets serialized as a client-component
// prop and every extra field is bundle weight the table's columns never use.
import { computeAccessGlyphs, type AccessGlyph } from './accessGlyphs'
import { isGroupUntested, type CategoryData } from './data-helpers'
import { hasLogo } from './logos'
import { type MegaTableAccessGlyph, type MegaTableRow } from './megaTableSort'

function toClientGlyph(glyph: AccessGlyph, arenaId: string, productId: string): MegaTableAccessGlyph {
  return {
    char: glyph.char,
    className: glyph.className,
    title: glyph.title,
    href: `/arena/${arenaId}/product/${productId}#story-${glyph.storyId}`,
  }
}

export function buildMegaTableRows(categories: CategoryData[]): MegaTableRow[] {
  const rows: MegaTableRow[] = []
  for (const data of categories) {
    const productById = new Map(data.products.map((p) => [p.id, p]))
    for (const entry of data.rankings.leaderboard) {
      const product = productById.get(entry.productId)
      if (!product) continue
      const glyphs = computeAccessGlyphs(data, product.id)
      const arenaId = data.category.id
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
        apiUntested: isGroupUntested(data, product.id, 'api-quality'),
        popularity: data.popularity[product.id]?.stars ?? null,
        ycBatch: product.ycBatch,
        access: {
          MCP: toClientGlyph(glyphs.MCP, arenaId, product.id),
          CLI: toClientGlyph(glyphs.CLI, arenaId, product.id),
          API: toClientGlyph(glyphs.API, arenaId, product.id),
        },
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
