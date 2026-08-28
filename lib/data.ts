import fs from 'node:fs'
import path from 'node:path'
import {
  type Category, CategorySchema, type Evidence, EvidenceSchema,
  type Product, ProductSchema, type Rankings, RankingsSchema,
  type Stack, StackSchema, type Story, StorySchema, type Verdict, VerdictSchema,
} from './schemas'

export interface CategoryData {
  category: Category
  products: Product[]
  stories: Story[]
  evidence: Record<string, Evidence[]>
  verdicts: Verdict[]
  rankings: Rankings
  stacks: Stack[]
}

const DEFAULT_DIR = () => path.join(process.cwd(), 'data')

const categoriesCache = new Map<string, Category[]>()
const categoryCache = new Map<string, CategoryData>()

export function loadCategories(dir: string = DEFAULT_DIR()): Category[] {
  const hit = categoriesCache.get(dir)
  if (hit) return hit

  const raw = JSON.parse(fs.readFileSync(path.join(dir, 'categories.json'), 'utf8'))
  const categories = CategorySchema.array().parse(raw)
  categoriesCache.set(dir, categories)
  return categories
}

const REQUIRED_POPULATED_FILES = ['stories.json', 'verdicts.json', 'rankings.json']

export function isPopulated(categoryId: string, dir: string = DEFAULT_DIR()): boolean {
  const base = path.join(dir, categoryId)
  return REQUIRED_POPULATED_FILES.every((file) => fs.existsSync(path.join(base, file)))
}

export function loadCategory(categoryId: string, dir: string = DEFAULT_DIR()): CategoryData {
  const cacheKey = `${dir}::${categoryId}`
  const hit = categoryCache.get(cacheKey)
  if (hit) return hit

  const category = loadCategories(dir).find((c) => c.id === categoryId)
  if (!category) throw new Error(`unknown category ${categoryId}`)

  const catDir = path.join(dir, categoryId)
  const read = (file: string) => JSON.parse(fs.readFileSync(path.join(catDir, file), 'utf8'))
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

  const stacksPath = path.join(catDir, 'stacks.json')
  const stacks = fs.existsSync(stacksPath) ? StackSchema.array().parse(read('stacks.json')) : []
  for (const stack of stacks) {
    for (const pid of stack.productIds) {
      if (!productIds.has(pid)) throw new Error(`stack ${stack.id} references unknown product ${pid}`)
    }
  }

  const data: CategoryData = { category, products, stories, evidence, verdicts, rankings, stacks }
  categoryCache.set(cacheKey, data)
  return data
}

export function loadAll(dir: string = DEFAULT_DIR()): CategoryData[] {
  return loadCategories(dir)
    .filter((c) => isPopulated(c.id, dir))
    .map((c) => loadCategory(c.id, dir))
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

export function verdictFor(data: CategoryData, productId: string, storyId: string): Verdict {
  const v = data.verdicts.find((x) => x.productId === productId && x.storyId === storyId)
  if (!v) throw new Error(`missing verdict for cell ${productId}:${storyId}`)
  return v
}

export function evidenceById(data: CategoryData): Map<string, Evidence> {
  return new Map(Object.values(data.evidence).flat().map((e) => [e.id, e]))
}

// Buckets items by a key, preserving the order each key was first seen. Used to group
// stories/rounds by theme→group without imposing an alphabetical or schema-declared order.
export function groupInOrder<T>(items: T[], keyOf: (item: T) => string): Array<[string, T[]]> {
  const order: string[] = []
  const buckets = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    if (!buckets.has(key)) {
      buckets.set(key, [])
      order.push(key)
    }
    buckets.get(key)!.push(item)
  }
  return order.map((key) => [key, buckets.get(key)!])
}
