// Fleet-wide audit of every product's urls.site — the link the product page's header and
// "Visit" CTA send people to. A site URL should be the vendor's primary marketing/product
// domain, so this flags the anti-patterns that creep in during curation:
//
//   1. subdomain-as-site — site points at about./docs./www2./get./try. etc. instead of the
//      apex domain (the about.gitlab.com mistake). Sometimes legitimate (crawl4ai.com
//      itself redirects to docs.crawl4ai.com), so these are findings to review, not
//      auto-fixes.
//   2. redirects-to-different-host — the URL 301s somewhere else entirely (rebrand, dead
//      domain parked, or the apex now lives elsewhere).
//   3. 4xx/5xx — the link is broken outright. 403s are usually bot walls, reported
//      separately so a human can eyeball them instead of "fixing" a working site.
//
// Report-only by design: it prints a table and always exits 0 (network flakes and bot
// walls make a hard-failing version useless in CI). Run it manually after curation passes:
//
//   node scripts/audit-site-urls.mjs            # full fleet (network, ~1–2 min)
//   node scripts/audit-site-urls.mjs --offline  # static anti-pattern scan only
//
// Plain node, no deps (global fetch, Node 18+).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OFFLINE = process.argv.includes('--offline')
const CONCURRENCY = 12
const TIMEOUT_MS = 20_000

// Subdomains that are almost never the primary product/marketing site. `www.` is fine —
// it's the canonical apex alias, not a section of the site.
const SUSPICIOUS_SUBDOMAIN = /^(about|docs|doc|www2|home|web|get|go|try|hello|start|info|help|support|developer|developers)\./i

function loadProducts() {
  const out = []
  for (const arena of fs.readdirSync(path.join(ROOT, 'data'))) {
    const file = path.join(ROOT, 'data', arena, 'products.json')
    if (!fs.existsSync(file)) continue
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
    const products = Array.isArray(parsed) ? parsed : parsed.products
    for (const p of products) {
      if (p?.urls?.site) out.push({ arena, id: p.id, site: p.urls.site })
    }
  }
  return out
}

const hostOf = (url) => new URL(url).hostname.replace(/^www\./, '').toLowerCase()

// Registrable-domain-ish comparison so app.example.com → example.com doesn't count as a
// cross-host redirect. Naive last-two-labels heuristic — good enough for an audit report.
const baseDomain = (host) => host.split('.').slice(-2).join('.')

async function probe(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    // GET, not HEAD: plenty of marketing sites 405 or hang on HEAD. Body is never read.
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ProductArena-link-audit' },
    })
    res.body?.cancel?.()
    return { status: res.status, finalUrl: res.url }
  } catch (err) {
    return { status: 0, finalUrl: url, error: err?.cause?.code ?? err?.name ?? String(err) }
  } finally {
    clearTimeout(timer)
  }
}

async function auditOne(product) {
  const findings = []
  const host = hostOf(product.site)
  if (SUSPICIOUS_SUBDOMAIN.test(new URL(product.site).hostname)) {
    findings.push(`subdomain-as-site (${host})`)
  }
  let probed = null
  if (!OFFLINE) {
    probed = await probe(product.site)
    if (probed.status === 0) {
      findings.push(`unreachable (${probed.error})`)
    } else if (probed.status === 403) {
      findings.push('403 — likely bot wall, verify by hand')
    } else if (probed.status >= 400) {
      findings.push(`HTTP ${probed.status}`)
    }
    const finalHost = hostOf(probed.finalUrl)
    if (probed.status > 0 && baseDomain(finalHost) !== baseDomain(host)) {
      findings.push(`redirects off-domain → ${finalHost}`)
    } else if (probed.status > 0 && finalHost !== host && SUSPICIOUS_SUBDOMAIN.test(finalHost)) {
      // Same domain but the vendor itself lands visitors on about./docs. — context worth
      // having when judging a subdomain-as-site finding (it may be intentional).
      findings.push(`vendor redirects to ${finalHost}`)
    }
  }
  return { ...product, findings }
}

async function main() {
  const products = loadProducts()
  const queue = [...products]
  const results = []
  await Promise.all(
    Array.from({ length: OFFLINE ? 1 : CONCURRENCY }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        results.push(await auditOne(job))
      }
    }),
  )
  const flagged = results
    .filter((r) => r.findings.length > 0)
    .sort((a, b) => a.arena.localeCompare(b.arena) || a.id.localeCompare(b.id))
  console.log(`Audited ${results.length} site URLs (${OFFLINE ? 'offline' : 'network'} mode) — ${flagged.length} flagged\n`)
  for (const r of flagged) {
    console.log(`${r.arena}/${r.id}\n  ${r.site}\n  → ${r.findings.join('; ')}`)
  }
}

main()
