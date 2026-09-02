// `pnpm stats`: recomputes the top-line arena/product/verdict counts from data/ and rewrites
// the marked block in README.md (<!-- stats:start -->...<!-- stats:end -->). Keeps the README
// from going stale as arenas/products/verdicts are added — never hand-edit the numbers inside
// the marked block, run this script instead. Idempotent: running it twice with no data changes
// produces no diff.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = path.join(ROOT, 'data')
const README_PATH = path.join(ROOT, 'README.md')

const START_MARKER = '<!-- stats:start -->'
const END_MARKER = '<!-- stats:end -->'
const LEADERS_START_MARKER = '<!-- leaders:start -->'
const LEADERS_END_MARKER = '<!-- leaders:end -->'

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function computeStats() {
  const categories = readJson(path.join(DATA_DIR, 'categories.json'))
  let productCount = 0
  let verdictCount = 0

  for (const category of categories) {
    const categoryDir = path.join(DATA_DIR, category.id)
    const productsPath = path.join(categoryDir, 'products.json')
    const verdictsPath = path.join(categoryDir, 'verdicts.json')

    if (fs.existsSync(productsPath)) {
      productCount += readJson(productsPath).length
    }
    if (fs.existsSync(verdictsPath)) {
      verdictCount += readJson(verdictsPath).length
    }
  }

  return {
    arenas: categories.length,
    products: productCount,
    verdicts: verdictCount,
  }
}

// Mirrors the site's leaderboard sort: primarily by INIT Score (aiEra), nulls last, ties
// broken by coverage score (see README "Why lead with this instead of the coverage score").
function computeLeaders() {
  const categories = readJson(path.join(DATA_DIR, 'categories.json'))
  const leaders = []

  for (const category of categories) {
    const categoryDir = path.join(DATA_DIR, category.id)
    const rankingsPath = path.join(categoryDir, 'rankings.json')
    const productsPath = path.join(categoryDir, 'products.json')
    if (!fs.existsSync(rankingsPath) || !fs.existsSync(productsPath)) continue

    const rankings = readJson(rankingsPath)
    const products = readJson(productsPath)
    const nameById = new Map(products.map((p) => [p.id, p.name]))
    const leaderboard = rankings.leaderboard ?? []
    if (leaderboard.length === 0) continue

    const sorted = [...leaderboard].sort((a, b) => {
      const aNull = a.aiEra == null
      const bNull = b.aiEra == null
      if (aNull !== bNull) return aNull ? 1 : -1
      if (!aNull && a.aiEra !== b.aiEra) return b.aiEra - a.aiEra
      return (b.score ?? 0) - (a.score ?? 0)
    })
    const leader = sorted[0]

    leaders.push({
      arena: category.name,
      product: nameById.get(leader.productId) ?? leader.productId,
      aiEra: leader.aiEra,
    })
  }

  return leaders
}

function renderBlock(stats) {
  return [
    START_MARKER,
    `As of the last full pipeline run: **${stats.arenas} arenas, ${stats.products} products, ${stats.verdicts.toLocaleString('en-US')} judged verdicts.**`,
    END_MARKER,
  ].join('\n')
}

function renderLeadersBlock(leaders) {
  const rows = leaders.map(
    (l) => `| ${l.arena} | ${l.product} | ${l.aiEra == null ? '—' : l.aiEra.toFixed(1)} |`,
  )
  return [
    LEADERS_START_MARKER,
    '| Arena | Leader | INIT Score |',
    '|---|---|---|',
    ...rows,
    LEADERS_END_MARKER,
  ].join('\n')
}

function replaceBetween(text, startMarker, endMarker, block) {
  const startIdx = text.indexOf(startMarker)
  const endIdx = text.indexOf(endMarker)

  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`update-readme-stats: could not find ${startMarker} / ${endMarker} markers in README.md`)
  }

  const before = text.slice(0, startIdx)
  const after = text.slice(endIdx + endMarker.length)
  return `${before}${block}${after}`
}

function updateReadme(stats, leaders) {
  const readme = fs.readFileSync(README_PATH, 'utf8')

  let next = replaceBetween(readme, START_MARKER, END_MARKER, renderBlock(stats))
  next = replaceBetween(next, LEADERS_START_MARKER, LEADERS_END_MARKER, renderLeadersBlock(leaders))

  if (next === readme) {
    console.log('update-readme-stats: README already up to date, no changes written')
    return
  }

  fs.writeFileSync(README_PATH, next)
  console.log(
    `update-readme-stats: wrote ${stats.arenas} arenas, ${stats.products} products, ${stats.verdicts} verdicts, ${leaders.length} leaders`,
  )
}

const stats = computeStats()
const leaders = computeLeaders()
updateReadme(stats, leaders)
