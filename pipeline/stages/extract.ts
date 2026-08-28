import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { type Evidence, EvidenceSchema, type Product, ProductSchema } from '../../lib/schemas'
import { llmJson } from '../llm'
import { CACHE_DIR, categoryDir, readJson, resolveCategories, writeJson } from '../paths'

export const ExtractionSchema = z.object({
  stories: z
    .array(
      z.object({
        persona: z.string().min(1),
        title: z.string().min(1),
        quote: z.string().min(1),
        sourceKey: z.string().regex(/^(site|docs|changelog|github|extra-\d+)$/),
      }),
    )
    .min(5)
    .max(40),
})
export type Extraction = z.infer<typeof ExtractionSchema>
export type CandidateStory = { persona: string; title: string; evidenceId: string }

// Resolves a candidate's sourceKey (one of site/docs/changelog/github, or extra-N for the
// Nth urls.extra entry) to the actual URL it was crawled from, falling back to the site
// url if the referenced source is missing (e.g. an out-of-range extra index).
function resolveSourceUrl(sourceKey: string, sourceUrls: Product['urls']): string {
  const extraMatch = sourceKey.match(/^extra-(\d+)$/)
  if (extraMatch) {
    return sourceUrls.extra?.[Number(extraMatch[1])] ?? sourceUrls.site
  }
  return sourceUrls[sourceKey as 'site' | 'docs' | 'changelog' | 'github'] ?? sourceUrls.site
}

export function buildEvidence(
  productId: string,
  extraction: Extraction,
  sourceUrls: Product['urls'],
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
        url: resolveSourceUrl(s.sourceKey, sourceUrls),
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
Sources are labeled "=== SOURCE <key> ===" in the materials below; use that exact key. Besides site/docs/changelog/github, a source may be labeled extra-0, extra-1, etc. (additional vendor pages) — use the matching extra-N key, not "docs" or "site", when a quote comes from one of those.
Return JSON: {"stories":[{"persona":"...","title":"As a ..., I can ...","quote":"...","sourceKey":"site|docs|changelog|github|extra-N"}]}`

export async function runExtract({ category, product }: { category?: string; product?: string }): Promise<void> {
  let matched = 0
  for (const cat of resolveCategories(category)) {
    const dataDir = categoryDir(cat.id)
    const products = readJson(ProductSchema.array(), path.join(dataDir, 'products.json')).filter(
      (p) => !product || p.id === product,
    )
    matched += products.length

    for (const p of products) {
      const crawlDir = path.join(CACHE_DIR, 'crawl', cat.id, p.id)
      if (!fs.existsSync(crawlDir)) throw new Error(`extract: no crawl cache for ${cat.id}/${p.id} — run crawl first`)
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

      const evidenceFile = path.join(dataDir, 'evidence', `${p.id}.json`)
      const existing = fs.existsSync(evidenceFile) ? readJson(EvidenceSchema.array(), evidenceFile) : []
      const kept = existing.filter((e) => e.tier === 'community' || e.tier === 'probe')
      writeJson(evidenceFile, [...evidence, ...kept])
      writeJson(path.join(CACHE_DIR, 'extract', cat.id, `${p.id}.json`), candidates)
      console.log(`extract: ${cat.id}/${p.id} → ${candidates.length} candidate stories, ${evidence.length} evidence items`)
    }
  }
  if (product && matched === 0) throw new Error(`unknown product: ${product}`)
}
