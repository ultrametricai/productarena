import fs from 'node:fs'
import path from 'node:path'
import {
  type Category, CategorySchema, type Evidence, EvidenceSchema,
  type Product, ProductSchema, type Rankings, RankingsSchema,
  type Story, StorySchema, type Verdict, VerdictSchema,
} from './schemas'

export interface AppData {
  category: Category
  products: Product[]
  stories: Story[]
  evidence: Record<string, Evidence[]>
  verdicts: Verdict[]
  rankings: Rankings
}

const cache = new Map<string, AppData>()

export function loadData(dir: string = path.join(process.cwd(), 'data')): AppData {
  const hit = cache.get(dir)
  if (hit) return hit

  const read = (file: string) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  const category = CategorySchema.parse(read('category.json'))
  const products = ProductSchema.array().parse(read('products.json'))
  const stories = StorySchema.array().parse(read('stories.json'))
  const verdicts = VerdictSchema.array().parse(read('verdicts.json'))
  const rankings = RankingsSchema.parse(read('rankings.json'))
  const evidence = Object.fromEntries(
    products.map((p) => [p.id, EvidenceSchema.array().parse(read(path.join('evidence', `${p.id}.json`)))]),
  )

  const productIds = new Set(products.map((p) => p.id))
  const storyIds = new Set(stories.map((s) => s.id))

  const cellKeys = new Set<string>()
  for (const v of verdicts) {
    if (!productIds.has(v.productId)) throw new Error(`verdict references unknown product ${v.productId}`)
    if (!storyIds.has(v.storyId)) throw new Error(`verdict references unknown story ${v.storyId}`)
    const key = `${v.productId}:${v.storyId}`
    if (cellKeys.has(key)) throw new Error(`duplicate verdict for cell ${key}`)
    cellKeys.add(key)
    const known = new Set(evidence[v.productId].map((e) => e.id))
    for (const id of v.evidenceIds) {
      if (!known.has(id)) throw new Error(`verdict ${key} cites missing evidence ${id}`)
    }
  }
  for (const p of products) for (const s of stories) {
    if (!cellKeys.has(`${p.id}:${s.id}`)) throw new Error(`missing verdict for cell ${p.id}:${s.id}`)
  }

  for (const entry of rankings.leaderboard) {
    if (!productIds.has(entry.productId)) throw new Error(`leaderboard references unknown product ${entry.productId}`)
  }
  const pairs = new Set<string>()
  for (const b of rankings.battles) {
    if (!productIds.has(b.a) || !productIds.has(b.b)) throw new Error(`battle ${b.a} vs ${b.b} references unknown product`)
    pairs.add([b.a, b.b].sort().join('|'))
  }
  const expectedPairs = (products.length * (products.length - 1)) / 2
  if (pairs.size !== expectedPairs || rankings.battles.length !== expectedPairs) {
    throw new Error(`expected ${expectedPairs} unique battles, found ${rankings.battles.length}`)
  }

  const data: AppData = { category, products, stories, evidence, verdicts, rankings }
  cache.set(dir, data)
  return data
}

export function battleSlug(a: string, b: string): string {
  return `${a}-vs-${b}`
}

export function parseBattleSlug(slug: string, products: Product[]): { a: string; b: string } | null {
  for (const a of products) {
    const prefix = `${a.id}-vs-`
    if (!slug.startsWith(prefix)) continue
    const b = slug.slice(prefix.length)
    if (b !== a.id && products.some((p) => p.id === b)) return { a: a.id, b }
  }
  return null
}

export function verdictFor(data: AppData, productId: string, storyId: string): Verdict {
  const v = data.verdicts.find((x) => x.productId === productId && x.storyId === storyId)
  if (!v) throw new Error(`missing verdict for cell ${productId}:${storyId}`)
  return v
}

export function evidenceById(data: AppData): Map<string, Evidence> {
  return new Map(Object.values(data.evidence).flat().map((e) => [e.id, e]))
}
