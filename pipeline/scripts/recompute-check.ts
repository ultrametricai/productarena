// Standalone determinism check: calls buildRankings() directly against on-disk data for every
// category and deep-compares against the persisted rankings.json. Used as a sanity gate after
// any manual verdicts.json edit (e.g. pipeline/scripts/revert-churn.ts) to confirm the derive
// step was applied cleanly and rankings.json isn't stale/drifted.
import fs from 'node:fs'
import path from 'node:path'
import { ProductSchema, RankingsSchema, StorySchema, VerdictSchema } from '../../lib/schemas'
import { buildRankings } from '../../lib/scoring'

const ROOT = path.resolve(__dirname, '..', '..')
const CATEGORIES = [
  'accounting',
  'agent-frameworks',
  'agent-sandboxes',
  'ai-assistants',
  'ai-coding',
  'ai-research-agents',
  'ai-search-apis',
  'api-platforms',
  'backend-as-a-service',
  'code-hosting',
  'crm',
  'desktop-os',
  'edge-platforms',
  'frontend-frameworks',
  'infra-as-code',
  'llm-evals-observability',
  'local-llm-runtimes',
  'mobile-dev',
  'mobile-payments',
  'payments',
  'model-gateways',
  'payroll',
  'product-analytics',
  'product-feedback',
  'project-management',
  'security-scanners',
  'software-factory',
  'startup-banking',
  'team-chat',
  'terminals',
  'vibe-coding',
  'web-scraping',
]

function readJson<T>(schema: { parse: (v: unknown) => T }, file: string): T {
  return schema.parse(JSON.parse(fs.readFileSync(file, 'utf8')))
}

let allMatch = true
const results: string[] = []
for (const cat of CATEGORIES) {
  const dataDir = path.join(ROOT, 'data', cat)
  const products = readJson(ProductSchema.array(), path.join(dataDir, 'products.json'))
  const stories = readJson(StorySchema.array(), path.join(dataDir, 'stories.json'))
  const verdicts = readJson(VerdictSchema.array(), path.join(dataDir, 'verdicts.json'))
  const persisted = readJson(RankingsSchema, path.join(dataDir, 'rankings.json'))
  const recomputed = buildRankings(products, stories, verdicts, persisted.generatedAt)
  const match = JSON.stringify(recomputed) === JSON.stringify(persisted)
  results.push(`${cat} ${match ? 'MATCH' : 'MISMATCH'}`)
  if (!match) allMatch = false
}

console.log(results.join(' · '))
console.log(allMatch ? 'ALL DETERMINISTIC' : 'MISMATCH DETECTED')
process.exit(allMatch ? 0 : 1)
