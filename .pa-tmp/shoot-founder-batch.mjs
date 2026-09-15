// Screenshot-verify the founder batch against a running `next start` (default port 3000,
// basePath /productarena): product pages (workos + the multi-arena sentry) at 1280 and 375,
// plus the new /processes/operating-rhythm page. Playwright comes from the main checkout's
// .proof-scratch (the repo deliberately doesn't depend on it — see pipeline scripts).
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const MAIN = path.resolve(HERE, '..', '..', '..', '..') // worktree -> .claude/worktrees -> .claude -> main
const { chromium } = await import(path.join(MAIN, '.proof-scratch/node_modules/playwright/index.mjs'))

const BASE = process.env.PA_BASE ?? 'http://localhost:3000/productarena'
const OUT = path.join(HERE, 'screens')
fs.mkdirSync(OUT, { recursive: true })

const PAGES = [
  ['workos-product', '/arena/auth-platforms/product/workos'],
  ['sentry-product', '/arena/observability/product/sentry'],
  ['operating-rhythm', '/processes/operating-rhythm'],
  ['email-marketing-arena', '/arena/email-marketing'],
  ['loops-product', '/arena/email-marketing/product/loops'],
]
const VIEWPORTS = [
  ['1280', { width: 1280, height: 900 }],
  ['375', { width: 375, height: 812 }],
]

const browser = await chromium.launch()
for (const [name, route] of PAGES) {
  for (const [tag, viewport] of VIEWPORTS) {
    const page = await browser.newPage({ viewport })
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('requestfailed', (r) => errors.push(`REQFAIL ${r.url()}`))
    const res = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 })
    const status = res?.status()
    await page.waitForTimeout(800)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    const file = path.join(OUT, `${name}-${tag}.png`)
    await page.screenshot({ path: file, fullPage: true })
    console.log(`${name}@${tag}: status=${status} overflow=${overflow} errors=${errors.length} -> ${file}`)
    for (const e of errors.slice(0, 5)) console.log('  !', e)
    await page.close()
  }
}
await browser.close()
