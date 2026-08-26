import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { type Evidence, EvidenceSchema, ProductSchema } from '../../lib/schemas'
import { fetchWithRetry, htmlToMarkdown } from '../fetch-page'
import { llmJson } from '../llm'
import { DATA_DIR, readJson, writeJson } from '../paths'

const CommunityItemsSchema = z.object({
  items: z.array(z.object({ url: z.string().url(), excerpt: z.string().min(10).max(400) })).min(5).max(20),
})

const SYSTEM = `You distill community discussion about a software product into evidence items.
Each item: a real user experience or claim from the discussion (praise, complaint, workaround, comparison), paraphrased tightly or quoted, max 400 chars, with the URL it came from.
Exclude marketing, vendor statements, and speculation. Cover both positives and negatives.
Return JSON: {"items":[{"url":"...","excerpt":"..."}]}`

async function hnCorpus(name: string): Promise<{ url: string; text: string }[]> {
  const search = JSON.parse(
    await fetchWithRetry(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(name)}&tags=story&hitsPerPage=5`),
  ) as { hits: { objectID: string; title: string; num_comments: number }[] }
  const out: { url: string; text: string }[] = []
  for (const hit of search.hits.filter((h) => h.num_comments > 0)) {
    const item = JSON.parse(await fetchWithRetry(`https://hn.algolia.com/api/v1/items/${hit.objectID}`)) as {
      title: string
      children: { text: string | null }[]
    }
    const comments = item.children
      .map((c) => (c.text ? htmlToMarkdown(c.text) : ''))
      .filter(Boolean)
      .slice(0, 30)
      .join('\n---\n')
    out.push({ url: `https://news.ycombinator.com/item?id=${hit.objectID}`, text: `# ${item.title}\n${comments}` })
  }
  return out
}

export async function runCollectCommunity({ product }: { product?: string }): Promise<void> {
  const products = readJson(ProductSchema.array(), path.join(DATA_DIR, 'products.json')).filter(
    (p) => !product || p.id === product,
  )
  if (products.length === 0) throw new Error(`unknown product: ${product}`)
  const seeds = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'seeds', 'community.json'), 'utf8')) as Record<string, string[]>

  for (const p of products) {
    const sources = await hnCorpus(`${p.name}`)
    for (const url of seeds[p.id] ?? []) {
      try {
        sources.push({ url, text: htmlToMarkdown(await fetchWithRetry(url)).slice(0, 20_000) })
      } catch (err) {
        console.warn(`collect-community: WARN seed ${url} failed: ${(err as Error).message}`)
      }
    }
    if (sources.length === 0) {
      console.warn(`collect-community: WARN no community sources found for ${p.id}; skipping`)
      continue
    }
    const corpus = sources.map((s) => `=== ${s.url} ===\n${s.text}`).join('\n\n').slice(0, 80_000)
    const { items } = await llmJson({
      schema: CommunityItemsSchema,
      system: SYSTEM,
      prompt: `Product: ${p.name}\n\nDiscussions:\n\n${corpus}`,
      maxTokens: 8192,
    })
    const now = new Date().toISOString()
    const community: Evidence[] = items.map((item, i) => ({
      id: `${p.id}-comm-${i + 1}`,
      tier: 'community',
      url: item.url,
      excerpt: item.excerpt,
      fetchedAt: now,
    }))
    const file = path.join(DATA_DIR, 'evidence', `${p.id}.json`)
    const existing = fs.existsSync(file) ? readJson(EvidenceSchema.array(), file) : []
    writeJson(file, [...existing.filter((e) => e.tier !== 'community'), ...community])
    console.log(`collect-community: ${p.id} → ${community.length} items from ${sources.length} sources`)
  }
}
