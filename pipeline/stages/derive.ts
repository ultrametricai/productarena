import path from 'node:path'
import { ProductSchema, RankingsSchema, StorySchema, VerdictSchema } from '../../lib/schemas'
import { buildRankings } from '../../lib/scoring'
import { DATA_DIR, readJson, writeJson } from '../paths'

export async function runDerive(): Promise<void> {
  const products = readJson(ProductSchema.array(), path.join(DATA_DIR, 'products.json'))
  const stories = readJson(StorySchema.array(), path.join(DATA_DIR, 'stories.json'))
  const verdicts = readJson(VerdictSchema.array(), path.join(DATA_DIR, 'verdicts.json'))
  const rankings = buildRankings(products, stories, verdicts, new Date().toISOString())
  writeJson(path.join(DATA_DIR, 'rankings.json'), RankingsSchema.parse(rankings))
  console.log(`derive: wrote rankings for ${products.length} products, ${rankings.battles.length} battles`)
}
