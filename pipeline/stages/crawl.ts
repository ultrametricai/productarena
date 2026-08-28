import fs from 'node:fs'
import path from 'node:path'
import { ProductSchema, type Product } from '../../lib/schemas'
import { fetchWithRetry, htmlToMarkdown } from '../fetch-page'
import { CACHE_DIR, categoryDir, readJson, resolveCategories } from '../paths'

function githubReadmeUrl(githubUrl: string): string {
  const [, owner, repo] = new URL(githubUrl).pathname.split('/')
  return `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`
}

async function crawlProduct(categoryId: string, product: Product): Promise<number> {
  const dir = path.join(CACHE_DIR, 'crawl', categoryId, product.id)
  fs.mkdirSync(dir, { recursive: true })
  const { extra, ...singleUrls } = product.urls
  const sources: [string, string][] = [
    ...(Object.entries(singleUrls) as [string, string][]),
    ...(extra ?? []).map((url, i): [string, string] => [`extra-${i}`, url]),
  ]
  let saved = 0
  for (const [key, url] of sources) {
    try {
      const raw = await fetchWithRetry(key === 'github' ? githubReadmeUrl(url) : url)
      const markdown = key === 'github' ? raw : htmlToMarkdown(raw)
      fs.writeFileSync(path.join(dir, `${key}.md`), `<!-- source: ${url} -->\n\n${markdown}\n`)
      console.log(`crawl: ${categoryId}/${product.id}/${key} (${markdown.length} chars)`)
      saved++
    } catch (err) {
      console.warn(`crawl: WARN ${categoryId}/${product.id}/${key} failed: ${(err as Error).message}`)
    }
  }
  return saved
}

export async function runCrawl({ category, product }: { category?: string; product?: string }): Promise<void> {
  let matched = 0
  for (const cat of resolveCategories(category)) {
    const products = readJson(ProductSchema.array(), path.join(categoryDir(cat.id), 'products.json')).filter(
      (p) => !product || p.id === product,
    )
    matched += products.length
    for (const p of products) {
      const saved = await crawlProduct(cat.id, p)
      if (saved === 0) throw new Error(`crawl: no pages saved for ${cat.id}/${p.id}`)
    }
  }
  if (product && matched === 0) throw new Error(`unknown product: ${product}`)
}
