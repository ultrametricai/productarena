// Server-side builder for the lean catalog /my-stack and /stacks/battle pass to their client
// components — same rationale as lib/compareData.ts (the client picks over every product on
// the site, so each row is flattened to exactly what those UIs render/compute on) plus the two
// fields the recommendation engine needs that CompareProduct lacks: vendor (GROUP recs) and
// the confidence grade (the D-gap suppression rule). Kept separate from lib/myStack.ts because
// this side imports node-flavored modules (lib/logos.ts reads the filesystem).
import { loadAiStacks } from './aiStacks'
import { confidenceFor } from './confidence'
import type { CategoryData } from './data-helpers'
import { hasLogo } from './logos'
import type { MyStackProduct } from './myStack'

export function buildMyStackProducts(categories: CategoryData[]): MyStackProduct[] {
  const out: MyStackProduct[] = []
  for (const data of categories) {
    const productById = new Map(data.products.map((p) => [p.id, p]))
    const fieldSize = data.rankings.leaderboard.length
    data.rankings.leaderboard.forEach((entry, i) => {
      const product = productById.get(entry.productId)
      if (!product) return
      out.push({
        id: product.id,
        name: product.name,
        vendor: product.vendor,
        arenaId: data.category.id,
        arenaName: data.category.name,
        type: product.type,
        aiEra: entry.aiEra,
        agentReady: entry.agentReady,
        confidence: confidenceFor(data, product.id).grade,
        rank: i + 1,
        fieldSize,
        hasLogo: hasLogo(product.id),
      })
    })
  }
  return out
}

// The arena-id pattern of every curated stack's SCORED slots (data/ai-stacks.json) — the
// "slot patterns" input to lib/myStack.ts's ADD rule. Editorial slots have no arena, so they
// simply don't appear in the pattern.
export function curatedStackArenaPatterns(dataDir?: string): string[][] {
  return loadAiStacks(dataDir).map((stack) =>
    stack.slots.flatMap((slot) => (slot.pick.kind === 'editorial' ? [] : [slot.pick.arenaId])),
  )
}
