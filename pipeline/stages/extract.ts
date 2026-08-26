import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { type Evidence, EvidenceSchema, ProductSchema } from '../../lib/schemas'
import { llmJson } from '../llm'
import { CACHE_DIR, DATA_DIR, readJson, writeJson } from '../paths'

export const ExtractionSchema = z.object({
  stories: z
    .array(
      z.object({
        persona: z.string().min(1),
        title: z.string().min(1),
        quote: z.string().min(1),
        sourceKey: z.enum(['site', 'docs', 'changelog', 'github']),
      }),
    )
    .min(5)
    .max(40),
})
export type Extraction = z.infer<typeof ExtractionSchema>
export type CandidateStory = { persona: string; title: string; evidenceId: string }

export function buildEvidence(
  productId: string,
  extraction: Extraction,
  sourceUrls: Record<string, string>,
  fetchedAt: string,
): { candidates: CandidateStory[]; evidence: Evidence[] } {
  const evidence: Evidence[] = []
  const byQuote = new Map<string, string>()
  const counters = { docs: 0, gh: 0 }
  const candidates = extraction.stories.map((s) => {
    let evidenceId = byQuote.get(s.quote)
    if (!evidenceId) {
      const isGithub = s.sourceKey === 'github'
      const abbrev = isGithub ? 'gh' : 'docs'
      counters[abbrev]++
      evidenceId = `${productId}-${abbrev}-${counters[abbrev]}`
      evidence.push({
        id: evidenceId,
        tier: isGithub ? 'github' : 'claimed-docs',
        url: sourceUrls[s.sourceKey] ?? sourceUrls.site,
        excerpt: s.quote,
        fetchedAt,
      })
      byQuote.set(s.quote, evidenceId)
    }
    return { persona: s.persona, title: s.title, evidenceId }
  })
  return { candidates, evidence }
}

const SYSTEM = `You extract user stories from a software product's own marketing and documentation.
A user story is a concrete capability a user gains: "As a <persona>, I can <do something specific>."
Only include capabilities the materials actually claim. Each story needs a short verbatim-ish quote (max 200 chars) from the materials as evidence and which source file it came from.
Personas must be drawn from: developer, designer, switcher, power-user.
Return JSON: {"stories":[{"persona":"...","title":"As a ..., I can ...","quote":"...","sourceKey":"site|docs|changelog|github"}]}`

export async function runExtract({ product }: { product?: string }): Promise<void> {
  const products = readJson(ProductSchema.array(), path.join(DATA_DIR, 'products.json')).filter(
    (p) => !product || p.id === product,
  )
  if (products.length === 0) throw new Error(`unknown product: ${product}`)

  for (const p of products) {
    const crawlDir = path.join(CACHE_DIR, 'crawl', p.id)
    if (!fs.existsSync(crawlDir)) throw new Error(`extract: no crawl cache for ${p.id} — run crawl first`)
    const parts = fs.readdirSync(crawlDir).map((f) => {
      const key = f.replace(/\.md$/, '')
      return `=== SOURCE ${key} ===\n${fs.readFileSync(path.join(crawlDir, f), 'utf8')}`
    })
    const corpus = parts.join('\n\n').slice(0, 60_000)

    const extraction = await llmJson({
      schema: ExtractionSchema,
      system: SYSTEM,
      prompt: `Product: ${p.name} (${p.vendor})\n\nMaterials:\n\n${corpus}`,
      maxTokens: 8192,
    })

    const { candidates, evidence } = buildEvidence(p.id, extraction, p.urls, new Date().toISOString())

    const evidenceFile = path.join(DATA_DIR, 'evidence', `${p.id}.json`)
    const existing = fs.existsSync(evidenceFile) ? readJson(EvidenceSchema.array(), evidenceFile) : []
    const kept = existing.filter((e) => e.tier === 'community' || e.tier === 'probe')
    writeJson(evidenceFile, [...evidence, ...kept])
    writeJson(path.join(CACHE_DIR, 'extract', `${p.id}.json`), candidates)
    console.log(`extract: ${p.id} → ${candidates.length} candidate stories, ${evidence.length} evidence items`)
  }
}
