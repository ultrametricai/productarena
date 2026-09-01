// Pure request-routing/formatting logic for each MCP tool, factored out of mcp/src/server.ts
// so it's testable without spinning up an MCP transport — each function takes a
// ProductArenaClient and returns plain data; mcp/src/server.ts just wraps these in
// registerTool() calls and formats the result as tool content.
import type { ProductArenaClient } from './client.js'
import type { Battle, Category, Evidence, Product, Rankings, Story, Verdict } from './types.js'

export class ProductArenaError extends Error {}

async function fetchCategories(client: ProductArenaClient): Promise<Category[]> {
  return client.fetchJson<Category[]>('/data/categories.json')
}

async function assertKnownCategory(client: ProductArenaClient, category: string): Promise<void> {
  const categories = await fetchCategories(client)
  if (!categories.some((c) => c.id === category)) {
    throw new ProductArenaError(`unknown category "${category}" — see list_arenas for valid ids`)
  }
}

export async function listArenas(client: ProductArenaClient): Promise<Category[]> {
  return fetchCategories(client)
}

export async function getRankings(client: ProductArenaClient, category: string): Promise<Rankings> {
  await assertKnownCategory(client, category)
  return client.fetchJson<Rankings>(`/data/${category}/rankings.json`)
}

export interface ProductVerdict {
  storyId: string
  storyTitle: string | null
  verdict: Verdict['verdict']
  quality: number
  confidence: Verdict['confidence']
  rationale: string
  evidenceUrls: string[]
}

export interface ProductDetail {
  category: string
  product: Product
  ranking: Rankings['leaderboard'][number] | null
  verdicts: ProductVerdict[]
}

export async function getProduct(client: ProductArenaClient, category: string, productId: string): Promise<ProductDetail> {
  await assertKnownCategory(client, category)
  const [products, stories, verdicts, rankings, evidence] = await Promise.all([
    client.fetchJson<Product[]>(`/data/${category}/products.json`),
    client.fetchJson<Story[]>(`/data/${category}/stories.json`),
    client.fetchJson<Verdict[]>(`/data/${category}/verdicts.json`),
    client.fetchJson<Rankings>(`/data/${category}/rankings.json`),
    client.fetchJson<Evidence[]>(`/data/${category}/evidence/${productId}.json`).catch(() => [] as Evidence[]),
  ])

  const product = products.find((p) => p.id === productId)
  if (!product) {
    throw new ProductArenaError(`unknown product "${productId}" in category "${category}"`)
  }

  const storyTitleById = new Map(stories.map((s) => [s.id, s.title]))
  const evidenceById = new Map(evidence.map((e) => [e.id, e]))
  const productVerdicts: ProductVerdict[] = verdicts
    .filter((v) => v.productId === productId)
    .map((v) => ({
      storyId: v.storyId,
      storyTitle: storyTitleById.get(v.storyId) ?? null,
      verdict: v.verdict,
      quality: v.quality,
      confidence: v.confidence,
      rationale: v.rationale,
      evidenceUrls: v.evidenceIds.map((id) => evidenceById.get(id)?.url).filter((url): url is string => Boolean(url)),
    }))

  const ranking = rankings.leaderboard.find((e) => e.productId === productId) ?? null

  return { category, product, ranking, verdicts: productVerdicts }
}

export async function getBattle(client: ProductArenaClient, category: string, a: string, b: string): Promise<Battle> {
  await assertKnownCategory(client, category)
  const rankings = await client.fetchJson<Rankings>(`/data/${category}/rankings.json`)
  const battle = rankings.battles.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
  if (!battle) {
    throw new ProductArenaError(`no battle found between "${a}" and "${b}" in category "${category}"`)
  }
  return battle
}

export interface SearchResult {
  category: string
  product: Product
}

// Fetches every category's products.json and filters by a case-insensitive substring match
// against id, name, or vendor. Deliberately simple (no ranking/fuzzy match) — this is meant
// for an agent to locate the right (category, productId) pair to feed into get_product, not
// as a general search engine.
export async function searchProducts(client: ProductArenaClient, query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const categories = await fetchCategories(client)
  const results: SearchResult[] = []
  for (const category of categories) {
    const products = await client.fetchJson<Product[]>(`/data/${category.id}/products.json`)
    for (const product of products) {
      if (
        product.id.toLowerCase().includes(q) ||
        product.name.toLowerCase().includes(q) ||
        product.vendor.toLowerCase().includes(q)
      ) {
        results.push({ category: category.id, product })
      }
    }
  }
  return results
}

export interface StoryVerdictCell {
  productId: string
  productName: string | null
  verdict: Verdict['verdict']
  quality: number
  confidence: Verdict['confidence']
  rationale: string
  evidenceUrls: string[]
}

export interface StoryVerdictsResult {
  category: string
  story: Story
  verdicts: StoryVerdictCell[]
}

export async function getStoryVerdicts(client: ProductArenaClient, category: string, storyId: string): Promise<StoryVerdictsResult> {
  await assertKnownCategory(client, category)
  const [stories, verdicts, products] = await Promise.all([
    client.fetchJson<Story[]>(`/data/${category}/stories.json`),
    client.fetchJson<Verdict[]>(`/data/${category}/verdicts.json`),
    client.fetchJson<Product[]>(`/data/${category}/products.json`),
  ])

  const story = stories.find((s) => s.id === storyId)
  if (!story) {
    throw new ProductArenaError(`unknown story "${storyId}" in category "${category}"`)
  }

  const productById = new Map(products.map((p) => [p.id, p]))
  const cells: StoryVerdictCell[] = await Promise.all(
    verdicts
      .filter((v) => v.storyId === storyId)
      .map(async (v) => {
        const evidence = await client
          .fetchJson<Evidence[]>(`/data/${category}/evidence/${v.productId}.json`)
          .catch(() => [] as Evidence[])
        const evidenceById = new Map(evidence.map((e) => [e.id, e]))
        return {
          productId: v.productId,
          productName: productById.get(v.productId)?.name ?? null,
          verdict: v.verdict,
          quality: v.quality,
          confidence: v.confidence,
          rationale: v.rationale,
          evidenceUrls: v.evidenceIds.map((id) => evidenceById.get(id)?.url).filter((url): url is string => Boolean(url)),
        }
      }),
  )

  return { category, story, verdicts: cells }
}
