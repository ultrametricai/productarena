// Accuracy Program wave 1, applicability correction #1: for the 5 ai-coding products,
// `agentic-mcp-server` ("I can connect an agent via an official MCP server") is the wrong
// axis. These products ARE the agent — the meaningful question is whether they CONSUME MCP
// servers (see the new `agentic-mcp-client` canonical story), not whether they ship one for
// something else to connect to. This is a documented cache-edit: we hand-write the verdict
// (na, quality 0) and stamp the cache file with the CURRENT cellHash (post evidence-pack
// deepening) so `pnpm pipeline judge` treats it as already judged and doesn't overwrite it
// with an LLM call that has no way to know about this applicability ruling.
//
// Usage: pnpm exec tsx pipeline/scripts/apply-mcp-server-na.ts [--write]
import fs from 'node:fs'
import path from 'node:path'
import { EvidenceSchema, StorySchema } from '../../lib/schemas'
import { categoryDir, readJson } from '../paths'
import { cellHash, PROMPT_VERSION, validateVerdictRules } from '../stages/judge'

const WRITE = process.argv.includes('--write')
const CATEGORY = 'ai-coding'
const STORY_ID = 'agentic-mcp-server'
const PRODUCTS = ['codex', 'claude-code', 'cursor', 'github-copilot', 'gemini-cli']

const RATIONALE =
  'This product is an AI agent — it consumes MCP servers rather than shipping one; the serving axis does not apply. See agentic-mcp-client. (Applicability corrected after reader review.)'

function main(): void {
  const dataDir = categoryDir(CATEGORY)
  const stories = readJson(StorySchema.array(), path.join(dataDir, 'stories.json'))
  const story = stories.find((s) => s.id === STORY_ID)
  if (!story) throw new Error(`apply-mcp-server-na: story ${STORY_ID} not found in ${CATEGORY}`)

  for (const productId of PRODUCTS) {
    const evidence = readJson(EvidenceSchema.array(), path.join(dataDir, 'evidence', `${productId}.json`))
    const hash = cellHash(story, evidence, PROMPT_VERSION)
    const verdict = {
      verdict: 'na' as const,
      quality: 0,
      confidence: 'high' as const,
      rationale: RATIONALE,
      evidenceIds: [] as string[],
      productId,
      storyId: STORY_ID,
    }
    const violation = validateVerdictRules(verdict, evidence)
    if (violation) throw new Error(`apply-mcp-server-na: ${productId} verdict violates rules: ${violation}`)

    const cacheFile = path.join('pipeline', 'cache', 'judge', CATEGORY, productId, `${STORY_ID}.json`)
    console.log(`${WRITE ? 'WRITE' : 'DRY RUN'}: ${cacheFile} -> na (hash ${hash.slice(0, 12)}...)`)
    if (WRITE) {
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true })
      fs.writeFileSync(cacheFile, JSON.stringify({ hash, verdict }, null, 2) + '\n')
    }
  }
  if (!WRITE) console.log('\nDry run only — pass --write to apply.')
}

main()
