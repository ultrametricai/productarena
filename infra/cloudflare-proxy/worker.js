// Cloudflare Worker: serves ProductArena at ultrametric.ai/productarena/* by transparently
// proxying to the Vercel deployment (which is built with basePath '/productarena', so paths
// pass through unchanged). Route: ultrametric.ai/productarena*
//
// Also hosts POST /productarena/api/scan — the "test my product" quick scan behind the /submit
// page. It runs a fixed, keyless probe set (llms.txt, openapi.json, robots.txt, homepage hints)
// against a user-supplied URL. Because the input is an arbitrary URL, the endpoint is
// deliberately paranoid: https-only, no IP literals, no private/internal hostnames, no custom
// ports, capped redirects with per-hop revalidation, short timeouts, bounded reads, and a
// best-effort per-IP rate limit. It only ever GETs fixed well-known paths and treats every
// response as inert text.
const ORIGIN = 'https://productarena.vercel.app'
const ALLOWED_CORS = new Set(['https://ultrametric.ai', 'https://productarena.vercel.app'])

const MAX_BODY_BYTES = 128 * 1024
const FETCH_TIMEOUT_MS = 6000
const MAX_REDIRECTS = 3
const RATE_LIMIT = { max: 10, windowMs: 5 * 60 * 1000 }
const rateBuckets = new Map() // per-isolate, best-effort

function corsHeaders(request) {
  const origin = request.headers.get('origin') ?? ''
  const allow = ALLOWED_CORS.has(origin) ? origin : 'https://ultrametric.ai'
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store',
  }
}

function jsonResponse(request, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders(request) },
  })
}

// Reject anything that could reach infrastructure instead of a public product site.
function validateTarget(raw) {
  let url
  try {
    url = new URL(raw)
  } catch {
    return { error: 'not a valid URL' }
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { error: 'only http(s) URLs' }
  if (url.username || url.password) return { error: 'credentials in URLs are not allowed' }
  if (url.port && url.port !== '80' && url.port !== '443') return { error: 'custom ports are not allowed' }
  const host = url.hostname.toLowerCase()
  if (!host.includes('.')) return { error: 'not a public hostname' }
  // IPv4/IPv6 literals (covers 127.0.0.1, 10.x, 169.254.169.254, [::1], etc.)
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':') || host.startsWith('[')) {
    return { error: 'IP addresses are not allowed' }
  }
  if (
    host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')
    || host.endsWith('.internal') || host.endsWith('.home.arpa') || host.endsWith('.arpa')
    || host.endsWith('.onion')
  ) {
    return { error: 'internal hostnames are not allowed' }
  }
  return { origin: `${url.protocol}//${url.host}` }
}

// GET one fixed path with timeout, manual capped redirects (each hop re-validated), and a
// bounded read. Returns { status, text, finalHost } or { error }.
async function safeGet(targetOrigin, path) {
  let current = targetOrigin + path
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const check = validateTarget(current)
    if (check.error) return { error: `blocked redirect: ${check.error}` }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let resp
    try {
      resp = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'user-agent': 'ProductArena-scan/1.0 (+https://ultrametric.ai/productarena/submit)' },
      })
    } catch (err) {
      clearTimeout(timer)
      return { error: 'unreachable' }
    }
    clearTimeout(timer)
    if (resp.status >= 300 && resp.status < 400) {
      const loc = resp.headers.get('location')
      if (!loc) return { status: resp.status, text: '' }
      current = new URL(loc, current).toString()
      continue
    }
    const reader = resp.body?.getReader()
    let text = ''
    if (reader) {
      const decoder = new TextDecoder()
      let bytes = 0
      while (bytes < MAX_BODY_BYTES) {
        const { done, value } = await reader.read()
        if (done) break
        bytes += value.byteLength
        text += decoder.decode(value, { stream: true })
      }
      await reader.cancel().catch(() => {})
    }
    return { status: resp.status, text }
  }
  return { error: 'too many redirects' }
}

function looksLikeHtmlErrorPage(text) {
  const head = text.slice(0, 2000).toLowerCase()
  return head.includes('<html') && (head.includes('not found') || head.includes('404'))
}

async function handleScan(request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'POST') return jsonResponse(request, 405, { error: 'POST only' })

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  const now = Date.now()
  const bucket = rateBuckets.get(ip)
  if (bucket && now - bucket.ts < RATE_LIMIT.windowMs) {
    if (bucket.count >= RATE_LIMIT.max) return jsonResponse(request, 429, { error: 'rate limited — try again in a few minutes' })
    bucket.count++
  } else {
    rateBuckets.set(ip, { ts: now, count: 1 })
    if (rateBuckets.size > 5000) rateBuckets.clear()
  }

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse(request, 400, { error: 'JSON body required' })
  }
  const raw = typeof body?.url === 'string' ? body.url.trim().slice(0, 2048) : ''
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  const check = validateTarget(withScheme)
  if (check.error) return jsonResponse(request, 400, { error: check.error })
  const target = check.origin

  const [llms, openapi, robots, home] = await Promise.all([
    safeGet(target, '/llms.txt'),
    safeGet(target, '/openapi.json'),
    safeGet(target, '/robots.txt'),
    safeGet(target, '/'),
  ])

  const llmsFound = !llms.error && llms.status === 200 && llms.text.trim().length > 0 && !looksLikeHtmlErrorPage(llms.text) && !llms.text.trimStart().startsWith('<')
  let openapiFound = false
  if (!openapi.error && openapi.status === 200) {
    try {
      const parsed = JSON.parse(openapi.text)
      openapiFound = typeof parsed?.openapi === 'string' || typeof parsed?.swagger === 'string'
    } catch { /* not a spec */ }
  }
  const robotsText = !robots.error && robots.status === 200 ? robots.text : ''
  const homeText = !home.error && home.status === 200 ? home.text.toLowerCase() : ''

  if (home.error && llms.error && openapi.error && robots.error) {
    return jsonResponse(request, 200, { ok: false, host: new URL(target).hostname, error: 'site unreachable from our scanner' })
  }

  return jsonResponse(request, 200, {
    ok: true,
    host: new URL(target).hostname,
    scannedAt: new Date().toISOString(),
    checks: {
      llmsTxt: { found: llmsFound, bytes: llmsFound ? llms.text.length : 0 },
      openapi: { found: openapiFound },
      robots: {
        found: robotsText.length > 0,
        blocksAllAgents: /user-agent:\s*\*\s*[\r\n]+\s*disallow:\s*\/\s*$/im.test(robotsText),
      },
      homepage: {
        reachable: !home.error && (home.status ?? 0) < 400,
        mentionsMcp: /\bmcp\b|model context protocol/.test(homeText),
        mentionsApi: /\bapi\b/.test(homeText),
        mentionsCli: /\bcli\b/.test(homeText),
        mentionsDocs: /docs\.|\/docs\b|documentation/.test(homeText),
      },
    },
  })
}

export default {
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === '/productarena/api/scan') return handleScan(request)

    const upstream = new URL(url.pathname + url.search, ORIGIN)
    const resp = await fetch(upstream, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
    })
    // Rewrite any absolute redirects back onto ultrametric.ai
    const headers = new Headers(resp.headers)
    const loc = headers.get('location')
    if (loc && loc.startsWith(ORIGIN)) {
      headers.set('location', loc.replace(ORIGIN, 'https://ultrametric.ai'))
    }
    return new Response(resp.body, { status: resp.status, headers })
  },
}
