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
//
// Also hosts POST /productarena/api/mcp-probe — the product pages' "Try it" live MCP
// handshake, which only ever contacts a static allowlist of vendor MCP endpoints (see the
// "Live MCP handshake probe" section below).
//
// Also hosts POST /productarena/mcp — a keyless, rate-limited remote MCP endpoint (see the
// "Remote MCP endpoint" section below and this directory's README.md).
const ORIGIN = 'https://productarena.vercel.app'
const ALLOWED_CORS = new Set(['https://ultrametric.ai', 'https://productarena.vercel.app'])

const MAX_BODY_BYTES = 128 * 1024
const FETCH_TIMEOUT_MS = 6000
const MAX_REDIRECTS = 3
const RATE_LIMIT = { max: 10, windowMs: 5 * 60 * 1000 }
const rateBuckets = new Map() // per-isolate, best-effort

// Fixed-window, per-isolate, best-effort rate limiter shared by /api/scan and /mcp (each with
// its own bucket map and limits). Returns true when the caller should get a 429.
function isRateLimited(buckets, ip, { max, windowMs }) {
  const now = Date.now()
  const bucket = buckets.get(ip)
  if (bucket && now - bucket.ts < windowMs) {
    if (bucket.count >= max) return true
    bucket.count++
  } else {
    buckets.set(ip, { ts: now, count: 1 })
    if (buckets.size > 5000) buckets.clear()
  }
  return false
}

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
  if (isRateLimited(rateBuckets, ip, RATE_LIMIT)) {
    return jsonResponse(request, 429, { error: 'rate limited — try again in a few minutes' })
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

// ---------------------------------------------------------------------------------------------
// Live MCP handshake probe: POST /productarena/api/mcp-probe {arena, product}
//
// Powers the product pages' "Try it → live MCP handshake": sends one JSON-RPC initialize (and,
// when the server answers keyless, a tools/list) to the product's OWN documented remote MCP
// endpoint and returns a sanitized summary. An auth failure is itself the result — a 401 with
// OAuth metadata proves the server is live and tells the visitor what it takes to use it.
//
// The client NEVER supplies a URL: {arena, product} is looked up in MCP_ENDPOINTS, a static
// allowlist generated at build time by scripts/generate-mcp-allowlist.mjs from committed data
// (products.json links.mcp + evidence + proof transcripts, with a vendor-domain guard). The
// same map is generated into lib/mcpEndpoints.ts for the site; a unit test
// (__tests__/mcp-probe.test.ts) asserts the two never drift. Same timeout / bounded-read /
// per-IP rate-limit patterns as /api/scan above.

// GENERATED map — regenerate with `node scripts/generate-mcp-allowlist.mjs` and paste; do not
// hand-edit. Exported for the allowlist-sync unit test.
export const MCP_ENDPOINTS = {
  'accounting/xero': 'https://mcp.xero.com/mcp',
  'api-platforms/postman': 'https://mcp.postman.com/mcp',
  'backend-as-a-service/supabase': 'https://mcp.supabase.com/mcp',
  'mobile-payments/sumup': 'https://mcp.sumup.com/mcp',
  'payments/paypal': 'https://mcp.paypal.com/mcp',
  'payments/stripe': 'https://mcp.stripe.com/',
  'startup-banking/mercury': 'https://mcp.mercury.com/mcp',
  'web-scraping/scrapingbee': 'https://mcp.scrapingbee.com/',
}

const PROBE_RATE_LIMIT = { max: 10, windowMs: 5 * 60 * 1000 }
const probeRateBuckets = new Map() // separate from /api/scan's and /mcp's buckets
const PROBE_PROTOCOL_VERSION = '2025-06-18'

// Read a response body as text with the same MAX_BODY_BYTES cap as safeGet.
async function readBoundedBody(resp) {
  const reader = resp.body?.getReader()
  if (!reader) return ''
  const decoder = new TextDecoder()
  let text = ''
  let bytes = 0
  while (bytes < MAX_BODY_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.byteLength
    text += decoder.decode(value, { stream: true })
  }
  await reader.cancel().catch(() => {})
  return text
}

// Streamable-HTTP servers may answer a POST as plain JSON or as an SSE stream containing the
// JSON-RPC response in a `data:` line — accept both, treat anything unparseable as null.
function parseJsonRpcBody(contentType, text) {
  if ((contentType ?? '').includes('text/event-stream')) {
    for (const line of text.split('\n')) {
      if (!line.startsWith('data:')) continue
      try {
        const parsed = JSON.parse(line.slice(5).trim())
        if (parsed && typeof parsed === 'object' && 'jsonrpc' in parsed) return parsed
      } catch { /* keep scanning */ }
    }
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// POST one JSON-RPC message to an allowlisted endpoint. Returns
// { status, headers, message|null } or { error } (timeout / network failure).
async function postJsonRpc(endpoint, message, fetchImpl, sessionId) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let resp
  try {
    resp = await fetchImpl(endpoint, {
      method: 'POST',
      redirect: 'manual', // allowlisted URLs only — never follow a server elsewhere
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'mcp-protocol-version': PROBE_PROTOCOL_VERSION,
        'user-agent': 'ProductArena-tryit/1.0 (+https://ultrametric.ai/productarena)',
        ...(sessionId ? { 'mcp-session-id': sessionId } : {}),
      },
      body: JSON.stringify(message),
    })
  } catch {
    clearTimeout(timer)
    return { error: 'unreachable' }
  }
  clearTimeout(timer)
  const text = await readBoundedBody(resp)
  return {
    status: resp.status,
    headers: resp.headers,
    message: parseJsonRpcBody(resp.headers.get('content-type'), text),
  }
}

const clip = (value, max = 120) => String(value).slice(0, max)

// The probe itself: initialize, then (only if the server answered keyless) tools/list.
// Everything returned is reshaped into plain sanitized fields — no upstream body is ever
// echoed through verbatim. `fetchImpl` is injectable for tests (like handleJsonRpc's
// fetchJson).
export async function probeMcpEndpoint(endpoint, fetchImpl = fetch) {
  const init = await postJsonRpc(endpoint, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: PROBE_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'productarena-try-it', version: '1.0' },
    },
  }, fetchImpl)

  if (init.error) return { reachable: false, authRequired: false }

  if (init.status === 401 || init.status === 403) {
    const authHeader = init.headers.get('www-authenticate') ?? ''
    return {
      reachable: true,
      authRequired: true,
      httpStatus: init.status,
      oauth: /bearer|resource_metadata|oauth/i.test(authHeader),
    }
  }

  const serverInfo = init.message?.result?.serverInfo
  if (init.status < 200 || init.status >= 300 || !serverInfo) {
    // Live but not a handshake we understand (proxy page, redirect, protocol error) — still
    // an honest finding, reported without pretending we spoke MCP.
    return { reachable: true, authRequired: false, httpStatus: init.status, handshake: false }
  }

  const summary = {
    reachable: true,
    authRequired: false,
    httpStatus: init.status,
    handshake: true,
    serverInfo: { name: clip(serverInfo.name ?? ''), version: clip(serverInfo.version ?? '') },
    protocolVersion: clip(init.message.result.protocolVersion ?? ''),
  }

  const sessionId = init.headers.get('mcp-session-id') ?? undefined
  const tools = await postJsonRpc(endpoint, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, fetchImpl, sessionId)
  const toolList = tools.error ? null : tools.message?.result?.tools
  if (Array.isArray(toolList)) {
    summary.toolCount = toolList.length
    summary.toolNames = toolList.slice(0, 10).map((t) => clip(t?.name ?? '', 80))
  }
  return summary
}

export async function handleMcpProbe(request, fetchImpl = fetch) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'POST') return jsonResponse(request, 405, { error: 'POST only' })

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  if (isRateLimited(probeRateBuckets, ip, PROBE_RATE_LIMIT)) {
    return jsonResponse(request, 429, { error: 'rate limited — try again in a few minutes' })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse(request, 400, { error: 'JSON body required' })
  }
  const arena = typeof body?.arena === 'string' ? body.arena.trim().slice(0, 100) : ''
  const product = typeof body?.product === 'string' ? body.product.trim().slice(0, 100) : ''
  if (!arena || !product) return jsonResponse(request, 400, { error: '"arena" and "product" are required' })

  const endpoint = MCP_ENDPOINTS[`${arena}/${product}`]
  if (!endpoint) {
    return jsonResponse(request, 404, { error: 'no allowlisted MCP endpoint for this product' })
  }

  const result = await probeMcpEndpoint(endpoint, fetchImpl)
  return jsonResponse(request, 200, {
    ok: true,
    arena,
    product,
    endpoint,
    probedAt: new Date().toISOString(),
    ...result,
  })
}

// ---------------------------------------------------------------------------------------------
// Remote MCP endpoint: POST /productarena/mcp
//
// A keyless, rate-limited MCP server over the streamable-HTTP transport's plain-JSON response
// mode (client POSTs one JSON-RPC message, server answers with one application/json body; no
// SSE streams, no sessions — the server is fully stateless, which the MCP spec permits). It
// exposes the same eight tools as the stdio `productarena-mcp` npm package (mcp/ in the repo —
// keep the two in sync), fetching the Vercel origin's public /productarena/data/*.json files
// with a short in-isolate cache.
//
// No auth by design: this is the same public site data anyone can GET from /data/*. If we ever
// tier access ("API keys" for higher rate limits / bulk endpoints), gate it here — check an
// Authorization header before handleMcp's rate limiter and branch to a bigger limit.
// JSON-RPC handling is hand-rolled to keep the worker dependency-free.
const MCP_SERVER_VERSION = '0.2.0'
const MCP_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']
const MCP_RATE_LIMIT = { max: 60, windowMs: 5 * 60 * 1000 }
const mcpRateBuckets = new Map() // separate from /api/scan's buckets

const DATA_CACHE_TTL_MS = 5 * 60 * 1000
const dataCache = new Map() // path -> { expiresAt, value } — per-isolate, best-effort

// Thrown for caller mistakes (unknown ids, bad params) — reported as a tool-error result.
class ArenaError extends Error {}

// GET one of the origin's static /productarena/data/*.json files, cached for 5 minutes.
async function fetchArenaJson(path) {
  const hit = dataCache.get(path)
  if (hit && hit.expiresAt > Date.now()) return hit.value
  const url = `${ORIGIN}/productarena${path}`
  const res = await fetch(url, { cf: { cacheTtl: 300, cacheEverything: true } })
  if (!res.ok) throw new Error(`upstream GET ${path} -> HTTP ${res.status}`)
  const value = await res.json()
  if (dataCache.size > 500) dataCache.clear()
  dataCache.set(path, { expiresAt: Date.now() + DATA_CACHE_TTL_MS, value })
  return value
}

async function assertKnownArena(fetchJson, arena) {
  const categories = await fetchJson('/data/categories.json')
  if (!categories.some((c) => c.id === arena)) {
    throw new ArenaError(`unknown arena "${arena}" — see list_arenas for valid ids`)
  }
}

function requireString(args, key) {
  const value = args?.[key]
  if (typeof value !== 'string' || !value.trim()) throw new ArenaError(`"${key}" must be a non-empty string`)
  return value.trim()
}

// Flat (arena, product) index across every category (product ids are globally unique).
async function productIndex(fetchJson) {
  const categories = await fetchJson('/data/categories.json')
  const perArena = await Promise.all(
    categories.map(async (category) => {
      const products = await fetchJson(`/data/${category.id}/products.json`)
      return products.map((product) => ({ arena: category.id, product }))
    }),
  )
  return perArena.flat()
}

const TOP_METRICS = ['score', 'arenaScore', 'agentReady', 'agenticApp', 'apiQuality']

// Tool catalog — mirrors mcp/src/tools.ts + mcp/src/server.ts (the stdio npm package).
const MCP_TOOLS = [
  {
    name: 'list_arenas',
    title: 'List arenas',
    description: 'List every ProductArena arena/category (id, name, description, personas, themes).',
    inputSchema: { type: 'object', properties: {} },
    handler: async (fetchJson) => fetchJson('/data/categories.json'),
  },
  {
    name: 'get_rankings',
    title: 'Get rankings',
    description:
      'Get one arena\'s full leaderboard (coverage score, Arena Score as "aiEra", agent-readiness, per-theme scores) plus its head-to-head battle log.',
    inputSchema: {
      type: 'object',
      required: ['arena'],
      properties: { arena: { type: 'string', description: 'Arena id, e.g. "desktop-os" — see list_arenas.' } },
    },
    handler: async (fetchJson, args) => {
      const arena = requireString(args, 'arena')
      await assertKnownArena(fetchJson, arena)
      return fetchJson(`/data/${arena}/rankings.json`)
    },
  },
  {
    name: 'get_product',
    title: 'Get product',
    description:
      "Get one product: metadata, leaderboard entry with rank, verdict counts, and a per-story verdict summary. For any single verdict's rationale and cited evidence URLs, follow up with get_verdict.",
    inputSchema: {
      type: 'object',
      required: ['arena', 'product'],
      properties: {
        arena: { type: 'string', description: 'Arena id — see list_arenas.' },
        product: { type: 'string', description: 'Product id within that arena — see get_rankings or search_products.' },
      },
    },
    handler: async (fetchJson, args) => {
      const arena = requireString(args, 'arena')
      const productId = requireString(args, 'product')
      await assertKnownArena(fetchJson, arena)
      const [products, stories, verdicts, rankings] = await Promise.all([
        fetchJson(`/data/${arena}/products.json`),
        fetchJson(`/data/${arena}/stories.json`),
        fetchJson(`/data/${arena}/verdicts.json`),
        fetchJson(`/data/${arena}/rankings.json`),
      ])
      const product = products.find((p) => p.id === productId)
      if (!product) throw new ArenaError(`unknown product "${productId}" in arena "${arena}" — see get_rankings or search_products`)
      const storyTitleById = new Map(stories.map((s) => [s.id, s.title]))
      const verdictCounts = { full: 0, partial: 0, none: 0, disputed: 0, na: 0 }
      const summaries = verdicts
        .filter((v) => v.productId === productId)
        .map((v) => {
          verdictCounts[v.verdict] += 1
          return {
            storyId: v.storyId,
            storyTitle: storyTitleById.get(v.storyId) ?? null,
            verdict: v.verdict,
            quality: v.quality,
            confidence: v.confidence,
          }
        })
      const index = rankings.leaderboard.findIndex((e) => e.productId === productId)
      const ranking = index === -1 ? null : { ...rankings.leaderboard[index], rank: index + 1 }
      return { arena, product, ranking, verdictCounts, verdicts: summaries }
    },
  },
  {
    name: 'get_verdict',
    title: 'Get verdict',
    description:
      'Get the full judged verdict for one (product, story) cell: verdict tier, quality, confidence, rationale, and the cited evidence URLs.',
    inputSchema: {
      type: 'object',
      required: ['arena', 'product', 'story'],
      properties: {
        arena: { type: 'string', description: 'Arena id — see list_arenas.' },
        product: { type: 'string', description: 'Product id within that arena.' },
        story: { type: 'string', description: "Story id — see get_product's verdicts list for valid ids." },
      },
    },
    handler: async (fetchJson, args) => {
      const arena = requireString(args, 'arena')
      const productId = requireString(args, 'product')
      const storyId = requireString(args, 'story')
      await assertKnownArena(fetchJson, arena)
      const [products, stories, verdicts, evidence] = await Promise.all([
        fetchJson(`/data/${arena}/products.json`),
        fetchJson(`/data/${arena}/stories.json`),
        fetchJson(`/data/${arena}/verdicts.json`),
        fetchJson(`/data/${arena}/evidence/${productId}.json`).catch(() => []),
      ])
      const product = products.find((p) => p.id === productId)
      if (!product) throw new ArenaError(`unknown product "${productId}" in arena "${arena}" — see get_rankings or search_products`)
      const story = stories.find((s) => s.id === storyId)
      if (!story) throw new ArenaError(`unknown story "${storyId}" in arena "${arena}" — see get_product's verdicts for valid story ids`)
      const verdict = verdicts.find((v) => v.productId === productId && v.storyId === storyId)
      if (!verdict) throw new ArenaError(`no verdict for product "${productId}" on story "${storyId}" in arena "${arena}"`)
      const evidenceById = new Map(evidence.map((e) => [e.id, e]))
      return {
        arena,
        productId,
        productName: product.name,
        storyId,
        storyTitle: story.title,
        storyWeight: story.weight ?? null,
        verdict: verdict.verdict,
        quality: verdict.quality,
        confidence: verdict.confidence,
        rationale: verdict.rationale,
        evidence: verdict.evidenceIds
          .map((id) => evidenceById.get(id))
          .filter(Boolean)
          .map((e) => ({ id: e.id, tier: e.tier, url: e.url })),
      }
    },
  },
  {
    name: 'search_products',
    title: 'Search products',
    description:
      'Search for products by id/name/vendor substring across every arena. Returns (arena, product) pairs to feed into get_product or compare.',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: { query: { type: 'string', description: 'Case-insensitive substring to match against product id, name, or vendor.' } },
    },
    handler: async (fetchJson, args) => {
      const q = requireString(args, 'query').toLowerCase()
      const index = await productIndex(fetchJson)
      return index.filter(
        ({ product }) =>
          product.id.toLowerCase().includes(q) ||
          product.name.toLowerCase().includes(q) ||
          product.vendor.toLowerCase().includes(q),
      )
    },
  },
  {
    name: 'compare',
    title: 'Compare products',
    description:
      "Compare products across arenas by score: coverage score, Arena Score, agent-readiness, AI-native score, API quality, and each product's rank within its own arena. Product ids are globally unique — no arena argument needed.",
    inputSchema: {
      type: 'object',
      required: ['products'],
      properties: {
        products: { type: 'array', items: { type: 'string' }, minItems: 1, description: 'Product ids to compare — see search_products.' },
      },
    },
    handler: async (fetchJson, args) => {
      const raw = Array.isArray(args?.products) ? args.products : null
      const ids = raw ? [...new Set(raw.filter((p) => typeof p === 'string').map((p) => p.trim().toLowerCase()).filter(Boolean))] : []
      if (ids.length === 0) throw new ArenaError('compare requires at least one product id — see search_products to find ids')
      const index = await productIndex(fetchJson)
      const byId = new Map(index.map((entry) => [entry.product.id, entry]))
      const found = ids.filter((id) => byId.has(id))
      const notFound = ids.filter((id) => !byId.has(id))
      const arenas = [...new Set(found.map((id) => byId.get(id).arena))]
      const rankingsByArena = new Map(
        await Promise.all(arenas.map(async (arena) => [arena, await fetchJson(`/data/${arena}/rankings.json`)])),
      )
      const products = found.map((id) => {
        const { arena, product } = byId.get(id)
        const leaderboard = rankingsByArena.get(arena)?.leaderboard ?? []
        const rankIndex = leaderboard.findIndex((e) => e.productId === id)
        const entry = rankIndex === -1 ? null : leaderboard[rankIndex]
        return {
          productId: id,
          name: product.name,
          vendor: product.vendor,
          arena,
          rank: rankIndex === -1 ? null : rankIndex + 1,
          fieldSize: leaderboard.length,
          score: entry?.score ?? null,
          arenaScore: entry?.aiEra ?? null,
          agentReady: entry?.agentReady ?? null,
          agenticApp: entry?.agenticApp ?? null,
          apiQuality: entry?.apiQuality ?? null,
        }
      })
      return {
        products,
        notFound,
        note:
          'Scores use the same formula everywhere, but each arena judges its own story set — cross-arena numbers are indicative, not a strict total ordering. Products in the same arena are directly comparable (see get_rankings for their head-to-head battles).',
      }
    },
  },
  {
    name: 'get_stacks',
    title: 'Get AI stacks',
    description:
      'Get ProductArena\'s curated cross-arena AI stacks (e.g. "local sovereign stack") with every scored slot resolved LIVE from current arena leaderboards; editorial slots are labeled as such.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (fetchJson) => {
      const stacks = await fetchJson('/data/ai-stacks.json')
      const arenaIds = new Set()
      for (const stack of stacks) {
        for (const slot of stack.slots) if (slot.pick.kind !== 'editorial') arenaIds.add(slot.pick.arenaId)
      }
      const arenaData = new Map(
        await Promise.all(
          [...arenaIds].map(async (arena) => {
            const [products, rankings] = await Promise.all([
              fetchJson(`/data/${arena}/products.json`).catch(() => null),
              fetchJson(`/data/${arena}/rankings.json`).catch(() => null),
            ])
            return [arena, products && rankings ? { products, rankings } : null]
          }),
        ),
      )
      return stacks.map((stack) => ({
        id: stack.id,
        name: stack.name,
        tagline: stack.tagline,
        audience: stack.audience,
        slots: stack.slots
          .map((slot) => {
            if (slot.pick.kind === 'editorial') {
              return {
                role: slot.role, why: slot.why, kind: 'editorial', arena: null, productId: null, productName: null,
                metric: null, metricValue: null, rank: null, note: slot.pick.note, editorialUrl: slot.pick.url,
              }
            }
            const data = arenaData.get(slot.pick.arenaId)
            if (!data) return null
            const metric = slot.pick.kind === 'product' ? (slot.pick.metric ?? 'agentReady') : slot.pick.metric
            const ossIds = new Set(data.products.filter((p) => p.type === 'oss').map((p) => p.id))
            const field = slot.pick.kind === 'arena-top' && slot.pick.ossOnly
              ? data.rankings.leaderboard.filter((e) => ossIds.has(e.productId))
              : data.rankings.leaderboard
            const ranked = [...field].filter((e) => e[metric] !== null).sort((a, b) => b[metric] - a[metric])
            const entry = slot.pick.kind === 'product' ? ranked.find((e) => e.productId === slot.pick.productId) : ranked[0]
            if (!entry) return null
            return {
              role: slot.role,
              why: slot.why,
              kind: slot.pick.kind,
              arena: slot.pick.arenaId,
              productId: entry.productId,
              productName: data.products.find((p) => p.id === entry.productId)?.name ?? entry.productId,
              metric,
              metricValue: entry[metric],
              rank: ranked.indexOf(entry) + 1,
              note: slot.pick.kind === 'product' ? slot.pick.note : null,
              editorialUrl: null,
            }
          })
          .filter(Boolean),
      }))
    },
  },
  {
    name: 'top_products',
    title: 'Top products',
    description:
      "Cross-arena top-N: flattens every arena's leaderboard and ranks all products by one metric. Metrics: score (story coverage), arenaScore (Arena Score / aiEra), agentReady, agenticApp, apiQuality.",
    inputSchema: {
      type: 'object',
      required: ['metric'],
      properties: {
        metric: { type: 'string', enum: TOP_METRICS, description: 'Metric to rank by.' },
        limit: { type: 'integer', minimum: 1, maximum: 50, description: 'How many products to return (default 10, max 50).' },
      },
    },
    handler: async (fetchJson, args) => {
      const metric = requireString(args, 'metric')
      const normalized = metric === 'aiEra' ? 'arenaScore' : metric
      if (!TOP_METRICS.includes(normalized)) throw new ArenaError(`unknown metric "${metric}" — use one of: ${TOP_METRICS.join(', ')}`)
      const field = normalized === 'arenaScore' ? 'aiEra' : normalized
      const rawLimit = typeof args?.limit === 'number' && Number.isFinite(args.limit) ? Math.floor(args.limit) : 10
      const capped = Math.max(1, Math.min(rawLimit, 50))
      const categories = await fetchJson('/data/categories.json')
      const perArena = await Promise.all(
        categories.map(async (category) => {
          const [products, rankings] = await Promise.all([
            fetchJson(`/data/${category.id}/products.json`).catch(() => null),
            fetchJson(`/data/${category.id}/rankings.json`).catch(() => null),
          ])
          if (!products || !rankings) return []
          const byId = new Map(products.map((p) => [p.id, p]))
          return rankings.leaderboard
            .filter((e) => e[field] !== null)
            .map((e) => ({
              productId: e.productId,
              name: byId.get(e.productId)?.name ?? e.productId,
              vendor: byId.get(e.productId)?.vendor ?? '',
              arena: category.id,
              metric: normalized,
              value: e[field],
              score: e.score,
              arenaScore: e.aiEra,
            }))
        }),
      )
      return perArena.flat().sort((a, b) => b.value - a.value).slice(0, capped)
    },
  },
]

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } }
}

function rpcResult(id, result) {
  return { jsonrpc: '2.0', id, result }
}

// Handle one parsed JSON-RPC message. Returns { status, body } where body === null means
// "202 Accepted, empty response" (notifications/responses per streamable HTTP). `fetchJson`
// is injected so tests can run this without a network (see __tests__/mcp.test.ts).
export async function handleJsonRpc(message, fetchJson = fetchArenaJson) {
  if (Array.isArray(message)) {
    // JSON-RPC batching was removed in MCP protocol 2025-06-18 — reject cleanly.
    return { status: 400, body: rpcError(null, -32600, 'batch requests are not supported') }
  }
  if (!message || typeof message !== 'object' || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return { status: 400, body: rpcError(message?.id, -32600, 'invalid JSON-RPC 2.0 request') }
  }
  const { id, method, params } = message

  // Notifications (no id) and client responses: acknowledge with 202/empty.
  if (id === undefined || id === null) return { status: 202, body: null }

  switch (method) {
    case 'initialize': {
      const requested = typeof params?.protocolVersion === 'string' ? params.protocolVersion : ''
      const protocolVersion = MCP_PROTOCOL_VERSIONS.includes(requested) ? requested : MCP_PROTOCOL_VERSIONS[0]
      return {
        status: 200,
        body: rpcResult(id, {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'productarena-mcp', version: MCP_SERVER_VERSION },
          instructions:
            'Evidence-graded product rankings from ProductArena (ultrametric.ai/productarena). Start with list_arenas, then get_rankings/get_product; every score traces to cited evidence via get_verdict. Data is © Ultrametric Inc — brief quotes with attribution are welcome (see the repo DATA-LICENSE).',
        }),
      }
    }
    case 'ping':
      return { status: 200, body: rpcResult(id, {}) }
    case 'tools/list':
      return {
        status: 200,
        body: rpcResult(id, {
          tools: MCP_TOOLS.map(({ name, title, description, inputSchema }) => ({ name, title, description, inputSchema })),
        }),
      }
    case 'tools/call': {
      const name = typeof params?.name === 'string' ? params.name : ''
      const tool = MCP_TOOLS.find((t) => t.name === name)
      if (!tool) return { status: 200, body: rpcError(id, -32602, `unknown tool "${name}"`) }
      try {
        const result = await tool.handler(fetchJson, params?.arguments ?? {})
        return {
          status: 200,
          body: rpcResult(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }),
        }
      } catch (err) {
        // Tool-level failures (bad ids, upstream hiccups) are tool results with isError, not
        // protocol errors — the agent should see the message and self-correct.
        const messageText = err instanceof Error ? err.message : String(err)
        return {
          status: 200,
          body: rpcResult(id, { content: [{ type: 'text', text: `Error: ${messageText}` }], isError: true }),
        }
      }
    }
    default:
      return { status: 200, body: rpcError(id, -32601, `method "${method}" not supported (this server implements initialize, ping, tools/list, tools/call)`) }
  }
}

function mcpCorsHeaders() {
  // Public, read-only data — permissive CORS is deliberate (unlike /api/scan). We don't rely
  // on Origin for auth (there is none) and serve no user-specific state, so DNS-rebinding
  // concerns from the MCP spec don't apply here.
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, accept, authorization, mcp-protocol-version, mcp-session-id',
    'access-control-max-age': '86400',
    'cache-control': 'no-store',
  }
}

// Returns a Response, or null to fall through to the transparent proxy — a plain browser GET
// of /productarena/mcp serves the Next app's human-readable "Use ProductArena from your agent"
// page at the same URL the JSON-RPC endpoint lives on.
async function handleMcp(request) {
  const headers = mcpCorsHeaders()
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (request.method === 'GET' && !(request.headers.get('accept') ?? '').includes('text/event-stream')) {
    return null
  }
  if (request.method !== 'POST') {
    // No SSE/GET stream and no sessions to DELETE — stateless plain-JSON mode only.
    return new Response(JSON.stringify(rpcError(null, -32600, 'POST a single JSON-RPC message (streamable HTTP, JSON response mode)')), {
      status: 405,
      headers: { ...headers, allow: 'POST, OPTIONS', 'content-type': 'application/json' },
    })
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  if (isRateLimited(mcpRateBuckets, ip, MCP_RATE_LIMIT)) {
    return new Response(JSON.stringify(rpcError(null, -32000, 'rate limited (60 requests / 5 min per IP) — try again in a few minutes')), {
      status: 429,
      headers: { ...headers, 'retry-after': '300', 'content-type': 'application/json' },
    })
  }

  let parsed
  try {
    parsed = await request.json()
  } catch {
    return new Response(JSON.stringify(rpcError(null, -32700, 'parse error: body must be JSON')), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' },
    })
  }

  const { status, body } = await handleJsonRpc(parsed)
  if (body === null) return new Response(null, { status, headers })
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'content-type': 'application/json' } })
}

export default {
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === '/productarena/api/scan') return handleScan(request)
    if (url.pathname === '/productarena/api/mcp-probe') return handleMcpProbe(request)
    if (url.pathname === '/productarena/mcp') {
      const mcpResponse = await handleMcp(request)
      if (mcpResponse) return mcpResponse
      // plain GET falls through: the proxy below serves the site's /mcp page at this URL
    }

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
