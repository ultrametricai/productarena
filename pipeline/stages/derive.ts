import path from 'node:path'
import { ProductSchema, RankingsSchema, StorySchema, VerdictSchema } from '../../lib/schemas'
import { buildRankings } from '../../lib/scoring'
import { categoryDir, readJson, resolveCategories, writeJson } from '../paths'

export async function runDerive({ category }: { category?: string; product?: string }): Promise<void> {
  for (const cat of resolveCategories(category)) {
    const dataDir = categoryDir(cat.id)
    const products = readJson(ProductSchema.array(), path.join(dataDir, 'products.json'))
    const stories = readJson(StorySchema.array(), path.join(dataDir, 'stories.json'))
    const verdicts = readJson(VerdictSchema.array(), path.join(dataDir, 'verdicts.json'))
    const rankings = buildRankings(products, stories, verdicts, new Date().toISOString())
    writeJson(path.join(dataDir, 'rankings.json'), RankingsSchema.parse(rankings))
    console.log(`derive: wrote rankings for ${cat.id}: ${products.length} products, ${rankings.battles.length} battles`)
  }
}
