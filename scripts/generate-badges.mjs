// Embeddable score badges: renders two static shield-style SVGs per ranked product into
// public/badges/ — `<id>-agent-ready.svg` (the leaderboard's agentReady component) and
// `<id>-arena-score.svg` (the blended Arena Score, internally `aiEra`). Plain node, no deps.
//
// The SVGs are COMMITTED build inputs, not build artifacts (unlike public/data/): they only
// change when rankings change, so the workflow is "re-run after a re-judge, commit the diff"
// (see README's pipeline section), keeping `pnpm build` badge-free. Badge consumers hotlink
// the deployed URL (see app/badges/page.tsx), so a redeploy is what updates everyone's badge.
//
// The pure string helpers (textWidth, badgeSvg) are exported for unit tests
// (lib/__tests__/badges.test.ts); main() only runs when invoked directly.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Site palette (Tailwind zinc/emerald, see app/globals.css usage):
const ZINC_950 = '#09090b' // left panel
const ZINC_700 = '#3f3f46' // right panel when untested
const ZINC_200 = '#e4e4e7' // untested text
const ZINC_50 = '#fafafa' // "Product" wordmark text
const EMERALD_400 = '#34d399' // "Arena" wordmark text
const EMERALD_600 = '#059669' // right panel when scored

const FONT = 'Verdana,Geneva,DejaVu Sans,sans-serif'
const PAD_X = 7
const HEIGHT = 20

/**
 * Approximate rendered width of `text` at 11px Verdana. Exactness doesn't matter: every
 * <text> carries a textLength pin, so the browser stretches/squeezes glyphs to the estimate
 * and panels always line up. Narrow glyphs count less so estimates stay close to reality.
 *
 * @param {string} text
 * @param {{ bold?: boolean }} [opts]
 * @returns {number} integer px
 */
export function textWidth(text, { bold = false } = {}) {
  const narrow = /[iljtfrI1.,:;'"()[\]\/ -]/
  let w = 0
  for (const ch of text) w += narrow.test(ch) ? 4.3 : 7.0
  if (bold) w *= 1.08
  return Math.ceil(w)
}

/**
 * One shield-style badge: zinc-950 left panel carrying the ProductArena wordmark, right panel
 * carrying `<label> <score>/100` on emerald — or `<label> untested` on zinc when the score is
 * null (a product whose axis genuinely has no applicable data, never rendered as a fake 0).
 *
 * @param {{ label: string, score: number | null }} input
 * @returns {string} a complete standalone SVG document
 */
export function badgeSvg({ label, score }) {
  const value = score === null ? 'untested' : `${Math.round(score)}/100`
  const rightText = `${label} ${value}`
  const rightBg = score === null ? ZINC_700 : EMERALD_600
  const rightFg = score === null ? ZINC_200 : ZINC_50

  const productW = textWidth('Product', { bold: true })
  const arenaW = textWidth('Arena', { bold: true })
  const leftW = PAD_X + productW + arenaW + PAD_X
  const rightTextW = textWidth(rightText)
  const rightW = PAD_X + rightTextW + PAD_X
  const total = leftW + rightW
  const title = `ProductArena: ${label} ${value}`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${HEIGHT}" role="img" aria-label="${title}">
  <title>${title}</title>
  <clipPath id="r"><rect width="${total}" height="${HEIGHT}" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftW}" height="${HEIGHT}" fill="${ZINC_950}"/>
    <rect x="${leftW}" width="${rightW}" height="${HEIGHT}" fill="${rightBg}"/>
  </g>
  <g font-family="${FONT}" font-size="11">
    <text x="${PAD_X}" y="14" textLength="${productW}" font-weight="bold" fill="${ZINC_50}">Product</text>
    <text x="${PAD_X + productW}" y="14" textLength="${arenaW}" font-weight="bold" fill="${EMERALD_400}">Arena</text>
    <text x="${leftW + PAD_X}" y="14" textLength="${rightTextW}" fill="${rightFg}">${rightText}</text>
  </g>
</svg>
`
}

/**
 * The two badge files for one leaderboard entry, as [filename, svg] pairs.
 *
 * @param {string} productId
 * @param {{ agentReady: number | null, aiEra: number | null } | undefined} entry
 * @returns {Array<[string, string]>}
 */
export function badgeFiles(productId, entry) {
  return [
    [`${productId}-agent-ready.svg`, badgeSvg({ label: 'agent-ready', score: entry?.agentReady ?? null })],
    [`${productId}-arena-score.svg`, badgeSvg({ label: 'arena score', score: entry?.aiEra ?? null })],
  ]
}

function main() {
  const dataDir = path.join(ROOT, 'data')
  const outDir = path.join(ROOT, 'public', 'badges')
  fs.mkdirSync(outDir, { recursive: true })

  const categories = JSON.parse(fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf8'))
  let written = 0
  // A product id can (rarely) be ranked in two arenas — e.g. `square` in both payments and
  // mobile-payments. One badge file per id: the FIRST category in categories.json order wins,
  // deterministically, and the duplicate is logged rather than silently overwritten.
  const seen = new Map()
  for (const category of categories) {
    const productsFile = path.join(dataDir, category.id, 'products.json')
    const rankingsFile = path.join(dataDir, category.id, 'rankings.json')
    if (!fs.existsSync(productsFile) || !fs.existsSync(rankingsFile)) continue
    const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'))
    const rankings = JSON.parse(fs.readFileSync(rankingsFile, 'utf8'))
    for (const product of products) {
      if (seen.has(product.id)) {
        console.log(`generate-badges: ${product.id} already rendered from ${seen.get(product.id)}, skipping its ${category.id} entry`)
        continue
      }
      seen.set(product.id, category.id)
      const entry = rankings.leaderboard.find((e) => e.productId === product.id)
      for (const [file, svg] of badgeFiles(product.id, entry)) {
        fs.writeFileSync(path.join(outDir, file), svg)
        written++
      }
    }
  }
  console.log(`generate-badges: wrote ${written} SVGs -> ${outDir}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
