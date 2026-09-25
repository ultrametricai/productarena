// One-off browser-UA prefetch for the 9950X3D's amd.com crawl surface (site, docs, and the
// three appended extras). Same mechanics and rationale as pipeline/scripts/prefetch-amd-crawl.ts:
// www.amd.com bot-walls the pipeline UA, so we populate pipeline/cache/crawl/ with real page
// content fetched under a browser UA, then run the standard extract path over it.
import fs from 'node:fs'
import path from 'node:path'
import { htmlToMarkdown } from '../pipeline/fetch-page'

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
const ROOT = path.resolve(__dirname, '..')
const CACHE = path.join(ROOT, 'pipeline', 'cache', 'crawl', 'processors', 'amd-ryzen-9-9950x3d')

async function main() {
  const products = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data', 'processors', 'products.json'), 'utf8'),
  ) as Array<{ id: string; urls: { site?: string; docs?: string; extra?: string[] } }>
  const p = products.find((x) => x.id === 'amd-ryzen-9-9950x3d')!
  const jobs: Array<[string, string]> = []
  if (p.urls.site) jobs.push(['site', p.urls.site])
  if (p.urls.docs) jobs.push(['docs', p.urls.docs])
  for (const [i, url] of (p.urls.extra ?? []).entries()) {
    if (new URL(url).hostname.endsWith('amd.com')) jobs.push([`extra-${i}`, url])
  }
  fs.mkdirSync(CACHE, { recursive: true })
  for (const [key, url] of jobs) {
    const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA }, redirect: 'follow' })
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
    const markdown = htmlToMarkdown(await res.text())
    fs.writeFileSync(path.join(CACHE, `${key}.md`), `<!-- source: ${url} -->\n\n${markdown}\n`)
    console.log(`prefetch: ${key} <- ${url} (${markdown.length} chars)`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
