import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {
  type Evidence, EvidenceSchema, ProductSchema, type Story, StorySchema,
  type Verdict, VerdictBaseSchema, VerdictSchema,
} from '../../lib/schemas'
import { llmJson } from '../llm'
import { CACHE_DIR, categoryDir, readJson, resolveCategories, writeJson } from '../paths'

export const PROMPT_VERSION = 'v2'

export function cellHash(story: Story, evidence: Evidence[], promptVersion: string): string {
  const payload = JSON.stringify({
    storyId: story.id,
    title: story.title,
    evidence: evidence.map((e) => [e.id, e.excerpt]),
    promptVersion,
  })
  return crypto.createHash('sha256').update(payload).digest('hex')
}

export function validateVerdictRules(verdict: Verdict, evidence: Evidence[]): string | null {
  const known = new Map(evidence.map((e) => [e.id, e]))
  for (const id of verdict.evidenceIds) {
    if (!known.has(id)) return `cites unknown evidence id "${id}"`
  }
  if (verdict.verdict !== 'none' && verdict.verdict !== 'na' && verdict.evidenceIds.length === 0) {
    return 'non-none verdict must cite evidence'
  }
  if (verdict.verdict === 'disputed') {
    const tiers = new Set(verdict.evidenceIds.map((id) => known.get(id)!.tier))
    if (tiers.size < 2) return 'disputed requires citations from at least two distinct tiers'
  }
  if ((verdict.verdict === 'none' || verdict.verdict === 'na') && verdict.quality !== 0) {
    return `${verdict.verdict} verdicts must have quality 0`
  }
  return null
}

const RawVerdictSchema = VerdictBaseSchema.omit({ productId: true, storyId: true })

const SYSTEM = `You are the judge in a product arena. Given ONE user story and ONE product's evidence pack, decide how well the product delivers that story.
Verdicts: "full" (clearly delivers), "partial" (delivers with significant caveats/extra tools), "none" (no evidence it delivers), "disputed" (vendor claims it but community/hands-on evidence contradicts — requires citing both sides), "na" (the story's axis does not apply to this product at all).
Verdict "na": ONLY when the story's axis fundamentally does not apply to this product's type (wrong axis), e.g. an OS-install story for a SaaS API. Lack of evidence for an applicable capability is "none", never "na". na must have quality 0.
quality: 0-10 how WELL it delivers (0 if none or na). confidence: high/medium/low based on evidence strength. rationale: 1-3 sentences. evidenceIds: cite the specific items you relied on (empty only for "none" or "na").
Judge ONLY from the evidence pack. Absence of evidence for a mainstream capability of a well-known product may still only ever yield "none" — do not use outside knowledge.
Return JSON: {"verdict":"...","quality":N,"confidence":"...","rationale":"...","evidenceIds":["..."]}`

function judgePrompt(productName: string, story: Story, evidence: Evidence[], extra = ''): string {
  const pack = evidence
    .map((e) => `[${e.id}] (${e.tier}) ${e.excerpt} — ${e.url}`)
    .join('\n')
  return `Product: ${productName}\n\nUser story: ${story.title}\n(persona: ${story.persona}, theme: ${story.theme})\n\nEvidence pack:\n${pack}\n${extra}`
}

export async function runJudge({ category, product }: { category?: string; product?: string }): Promise<void> {
  let matched = 0
  for (const cat of resolveCategories(category)) {
    const dataDir = categoryDir(cat.id)
    const products = readJson(ProductSchema.array(), path.join(dataDir, 'products.json'))
    const stories = readJson(StorySchema.array(), path.join(dataDir, 'stories.json'))
    const targets = products.filter((p) => !product || p.id === product)
    matched += targets.length

    for (const p of targets) {
      const evidence = readJson(EvidenceSchema.array(), path.join(dataDir, 'evidence', `${p.id}.json`))
      for (const story of stories) {
        const cacheFile = path.join(CACHE_DIR, 'judge', cat.id, p.id, `${story.id}.json`)
        const hash = cellHash(story, evidence, PROMPT_VERSION)
        if (fs.existsSync(cacheFile)) {
          const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as { hash: string }
          if (cached.hash === hash) continue
        }

        let raw = await llmJson({ schema: RawVerdictSchema, system: SYSTEM, prompt: judgePrompt(p.name, story, evidence) })
        let verdict: Verdict = { ...raw, productId: p.id, storyId: story.id }
        let violation = validateVerdictRules(verdict, evidence)
        if (violation) {
          raw = await llmJson({
            schema: RawVerdictSchema,
            system: SYSTEM,
            prompt: judgePrompt(p.name, story, evidence, `\nYour previous verdict violated a rule: ${violation}. Correct it.`),
          })
          verdict = { ...raw, productId: p.id, storyId: story.id }
          violation = validateVerdictRules(verdict, evidence)
          if (violation) throw new Error(`judge: ${cat.id}/${p.id}:${story.id} still violates rules: ${violation}`)
        }
        writeJson(cacheFile, { hash, verdict })
        console.log(`judge: ${cat.id}/${p.id}:${story.id} → ${verdict.verdict} q${verdict.quality}`)
      }
    }

    // Assemble verdicts.json from ALL cached cells for this category (not just targets)
    const all: Verdict[] = []
    let incomplete = false
    for (const p of products) {
      const currentEvidence = readJson(EvidenceSchema.array(), path.join(dataDir, 'evidence', `${p.id}.json`))
      for (const story of stories) {
        const cacheFile = path.join(CACHE_DIR, 'judge', cat.id, p.id, `${story.id}.json`)
        if (!fs.existsSync(cacheFile)) {
          console.warn(`judge: matrix incomplete for ${cat.id} — missing ${p.id}:${story.id}; not writing verdicts.json`)
          incomplete = true
          break
        }
        const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as { hash: string; verdict: unknown }
        const currentHash = cellHash(story, currentEvidence, PROMPT_VERSION)
        if (cached.hash !== currentHash) {
          throw new Error(`judge: stale cached verdict for ${cat.id}/${p.id}:${story.id} — evidence changed; re-run judge --category ${cat.id} --product ${p.id}`)
        }
        all.push(VerdictSchema.parse(cached.verdict))
      }
      if (incomplete) break
    }
    if (incomplete) continue

    all.sort((x, y) => x.productId.localeCompare(y.productId) || x.storyId.localeCompare(y.storyId))
    writeJson(path.join(dataDir, 'verdicts.json'), all)
    console.log(`judge: wrote ${all.length} verdicts for ${cat.id}`)
  }
  if (product && matched === 0) throw new Error(`unknown product: ${product}`)
}
