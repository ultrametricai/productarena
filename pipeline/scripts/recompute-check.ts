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
  'ai-memory',
  'ai-research-agents',
  'ai-search-apis',
  'api-platforms',
  'auth-platforms',
  'backend-as-a-service',
  'browser-agents',
  'code-hosting',
  'crm',
  'desktop-os',
  'edge-platforms',
  'frontend-frameworks',
  'inference-providers',
  'infra-as-code',
  'legal-ops',
  'llm-evals-observability',
  'local-llm-runtimes',
  'mcp-infrastructure',
  'mobile-dev',
  'mobile-payments',
  'package-managers',
  'payments',
  'model-gateways',
  'payroll',
  'product-analytics',
  'product-feedback',
  'robotics-platforms',
  'project-management',
  'security-scanners',
  'software-factory',
  'startup-banking',
  'team-chat',
  'terminals',
  'vector-databases',
  'vibe-coding',
  'voice-agents',
  'web-scraping',
  'workflow-automation',
  'observability',
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
