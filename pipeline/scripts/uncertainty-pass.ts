// Multi-judge uncertainty pass (Lane A, judge calibration + uncertainty). For arenas where the
// #1 and #2 leaderboard products are within CLOSE_RACE_THRESHOLD INIT points of each other, the
// ranking is a "close race" — worth knowing how much of that gap is real signal vs. judge noise.
// For each qualifying arena, re-judges BOTH contenders' decisive cells (every story under the
// agenticness theme: agent-access, agentic-features, api-quality — the axes that feed the INIT
// Score's agentReady/agenticApp/apiQuality components) two ADDITIONAL times against the same
// on-disk evidence pack, and records agreement across those 2 fresh samples plus the tier already
// cached in verdicts.json.
//
// Writes data/{cat}/uncertainty.json (array of UncertaintyEntry — see lib/schemas.ts). Entirely
// additive/display-only: never touches verdicts.json, never feeds lib/scoring.ts, and a category
// that isn't a close race gets no file at all (see lib/data.ts's tolerant-optional load).
//
// Costs ~2 live LLM calls per decisive cell per qualifying product — deliberately NOT part of
// `pnpm test`. Usage: pnpm exec tsx pipeline/scripts/uncertainty-pass.ts
import fs from 'node:fs'
import path from 'node:path'
import {
  type Evidence, EvidenceSchema, ProductSchema, RankingsSchema, type Story, StorySchema,
  type UncertaintyEntry, type Verdict, VerdictSchema,
} from '../../lib/schemas'
import { agreementOf, isCloseRace } from '../../lib/uncertainty'
import { llmJson } from '../llm'
import { categoryDir, readCategories, readJson, writeJson } from '../paths'
import { judgePrompt, RawVerdictSchema, SYSTEM } from '../stages/judge'

const CLOSE_RACE_THRESHOLD = 3.0

async function judgeOnce(productName: string, story: Story, evidence: Evidence[]) {
  const raw = await llmJson({ schema: RawVerdictSchema, system: SYSTEM, prompt: judgePrompt(productName, story, evidence) })
  return raw.verdict
}

async function main(): Promise<void> {
  const categories = readCategories()
  const summary: string[] = []

  for (const cat of categories) {
    const dataDir = categoryDir(cat.id)
    const rankingsPath = path.join(dataDir, 'rankings.json')
    if (!fs.existsSync(rankingsPath)) continue
    const rankings = readJson(RankingsSchema, rankingsPath)
    const [top1, top2] = rankings.leaderboard
    if (!top1 || !top2) continue

    if (!isCloseRace(top1.aiEra, top2.aiEra, CLOSE_RACE_THRESHOLD)) {
      const diff = top1.aiEra === null || top2.aiEra === null ? 'n/a' : Math.abs(top1.aiEra - top2.aiEra).toFixed(1)
      summary.push(`${cat.id}: not a close race (Δ${diff}) — skipped`)
      continue
    }

    const diff = Math.abs(top1.aiEra! - top2.aiEra!).toFixed(1)
    console.log(`\nuncertainty: ${cat.id} QUALIFIES — ${top1.productId} vs ${top2.productId} (Δ${diff} INIT points)`)

    const products = readJson(ProductSchema.array(), path.join(dataDir, 'products.json'))
    const stories = readJson(StorySchema.array(), path.join(dataDir, 'stories.json'))
    const verdicts = readJson(VerdictSchema.array(), path.join(dataDir, 'verdicts.json'))
    // The "decisive canon": every story under the agenticness theme, which spans all three
    // groups that feed the INIT Score's agent-readiness components (agent-access -> agentReady,
    // agentic-features -> agenticApp, api-quality -> apiQuality).
    const decisive = stories.filter((s) => s.theme === 'agenticness')

    const entries: UncertaintyEntry[] = []
    let splitCount = 0

    for (const productId of [top1.productId, top2.productId]) {
      const product = products.find((p) => p.id === productId)
      if (!product) throw new Error(`uncertainty-pass: unknown product ${cat.id}/${productId}`)
      const evidence = readJson(EvidenceSchema.array(), path.join(dataDir, 'evidence', `${productId}.json`))

      for (const story of decisive) {
        const cached = verdicts.find((v) => v.productId === productId && v.storyId === story.id)
        if (!cached) {
          console.warn(`uncertainty-pass: no cached verdict for ${cat.id}/${productId}:${story.id} — skipping`)
          continue
        }
        const extra1 = await judgeOnce(product.name, story, evidence)
        const extra2 = await judgeOnce(product.name, story, evidence)
        const judgments: [Verdict['verdict'], Verdict['verdict'], Verdict['verdict']] = [cached.verdict, extra1, extra2]
        const agreement = agreementOf(judgments)
        if (agreement !== '3/3') splitCount++
        entries.push({ productId, storyId: story.id, judgments, agreement })
        console.log(`  ${productId}:${story.id} → [${judgments.join(', ')}] (${agreement})`)
      }
    }

    writeJson(path.join(dataDir, 'uncertainty.json'), entries)
    const rate = entries.length > 0 ? ((splitCount / entries.length) * 100).toFixed(0) : '0'
    summary.push(`${cat.id}: QUALIFIED (Δ${diff}) — ${entries.length} decisive cells, ${splitCount} split (${rate}% disagreement)`)
  }

  console.log('\n=== uncertainty pass summary ===')
  console.log(summary.join('\n'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
