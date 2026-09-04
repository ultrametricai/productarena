// Generates the OG share card (app/opengraph-image.png, 1200×630) by screenshotting a styled
// HTML template with Playwright — the only way to get the site's real display font (Satoshi via
// Fontshare) and the real rankings table into the card. Golden-ratio horizontal split: brand
// panel left (38.2%), live table screenshot right (61.8%).
//
// Prereqs: `npm install --prefix .proof-scratch playwright` (browsers come from the ms-playwright
// cache) and a current docs/assets/rankings-snapshot.png (see README screenshot workflow).
// Run: node scripts/generate-og.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SNAPSHOT = path.join(ROOT, 'docs/assets/rankings-snapshot.png')
const OUT = path.join(ROOT, 'app/opengraph-image.png')

const { chromium } = await import(path.join(ROOT, '.proof-scratch/node_modules/playwright/index.mjs'))

const snapshotB64 = fs.readFileSync(SNAPSHOT).toString('base64')

const html = `<!doctype html>
<html><head>
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@700,900&display=swap">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #09090b; font-family: 'Satoshi', sans-serif; overflow: hidden; display: flex; }
  .left { width: 38.2%; padding: 56px 8px 56px 52px; display: flex; flex-direction: column; justify-content: center; gap: 22px; position: relative; z-index: 2; }
  .crumb { font-family: ui-monospace, monospace; font-size: 17px; color: #71717a; letter-spacing: 0.04em; }
  .wordmark { font-weight: 900; font-size: 64px; letter-spacing: -0.03em; color: #fafafa; line-height: 0.95; }
  .wordmark em { font-style: normal; color: #34d399; }
  .tag { font-weight: 700; font-size: 24px; color: #a1a1aa; line-height: 1.35; max-width: 360px; }
  .url { font-family: ui-monospace, monospace; font-size: 16px; color: #34d399; }
  .right { width: 61.8%; position: relative; }
  .shot-wrap { position: absolute; top: 54px; left: 12px; width: 780px; height: 640px; border: 1px solid #27272a; border-radius: 18px; overflow: hidden; box-shadow: -24px 0 80px rgba(52,211,153,0.10), 0 0 0 1px rgba(52,211,153,0.12); background: #09090b; }
  .shot { position: absolute; top: -430px; left: -80px; width: 1440px; }
  .fade { position: absolute; inset: 0; background: linear-gradient(90deg, #09090b 0%, transparent 18%); z-index: 1; pointer-events: none; }
</style></head>
<body>
  <div class="left">
    <div class="crumb">ultrametric /</div>
    <div class="wordmark">Product<em>Arena</em></div>
    <div class="tag">Evidence-based software rankings for the AI era</div>
    <div class="url">ultrametric.ai/productarena</div>
  </div>
  <div class="right">
    <div class="shot-wrap">
      <img class="shot" src="data:image/png;base64,${snapshotB64}">
    </div>
    <div class="fade"></div>
  </div>
</body></html>`

const tmp = path.join(ROOT, '.proof-scratch/og-template.html')
fs.writeFileSync(tmp, html)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto('file://' + tmp)
await page.waitForTimeout(2500) // Fontshare webfont load
await page.screenshot({ path: OUT })
await browser.close()
fs.unlinkSync(tmp)
console.log('wrote', OUT, fs.statSync(OUT).size, 'bytes')
