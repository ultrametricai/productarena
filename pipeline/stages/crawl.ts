import fs from 'node:fs'
import path from 'node:path'
import { ProductSchema, type Product } from '../../lib/schemas'
import { fetchWithRetry, htmlToMarkdown } from '../fetch-page'
import { CACHE_DIR, DATA_DIR, readJson } from '../paths'

function githubReadmeUrl(githubUrl: string): string {
  const [, owner, repo] = new URL(githubUrl).pathname.split('/')
  return `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`
}

async function crawlProduct(product: Product): Promise<number> {
  const dir = path.join(CACHE_DIR, 'crawl', product.id)
  fs.mkdirSync(dir, { recursive: true })
  let saved = 0
  for (const [key, url] of Object.entries(product.urls) as [string, string][]) {
    try {
      const raw = await fetchWithRetry(key === 'github' ? githubReadmeUrl(url) : url)
      const markdown = key === 'github' ? raw : htmlToMarkdown(raw)
      fs.writeFileSync(path.join(dir, `${key}.md`), `<!-- source: ${url} -->\n\n${markdown}\n`)
      console.log(`crawl: ${product.id}/${key} (${markdown.length} chars)`)
      saved++
    } catch (err) {
      console.warn(`crawl: WARN ${product.id}/${key} failed: ${(err as Error).message}`)
    }
  }
  return saved
}

export async function runCrawl({ product }: { product?: string }): Promise<void> {
  const products = readJson(ProductSchema.array(), path.join(DATA_DIR, 'products.json')).filter(
    (p) => !product || p.id === product,
  )
  if (products.length === 0) throw new Error(`unknown product: ${product}`)
  for (const p of products) {
    const saved = await crawlProduct(p)
    if (saved === 0) throw new Error(`crawl: no pages saved for ${p.id}`)
  }
}
