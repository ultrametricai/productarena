// Unit tests for the worker's /api/try/:arena/:product/:probeId (the "Try it" microterminal's
// live probe re-runs): the executor with an injectable fetch (same pattern as mcp-probe.test.ts
// — no network, no Workers runtime), the handler's allowlist/rate-limit behavior, and two
// drift/attack-surface invariants over the generated manifest itself.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { LIVE_PROBES } from '../live-probes.generated.js'
import { executeLiveProbe, handleTryProbe } from '../worker.js'

type FetchImpl = typeof fetch

interface TrySummary {
  ok?: boolean
  error?: string
  arena?: string
  product?: string
  probeId?: string
  url?: string
  method?: string
  reachable?: boolean
  status?: number
  contentType?: string
  elapsedMs?: number
  bodyExcerpt?: string
  truncated?: boolean
  pass?: boolean | null
  expected?: { status: number | null; pattern: string | null }
}

const PROBE = {
  kind: 'http-fetch',
  method: 'GET',
  url: 'https://acme.dev/llms.txt',
  headers: {} as Record<string, string>,
  body: null as string | null,
  followRedirects: false,
  includeHeaders: false,
  expectStatus: 200,
  expectPattern: null,
  expectFlags: '',
  displayCommand: 'curl -s https://acme.dev/llms.txt | head -4',
}

function fetchOnce(response: Response | Error): { impl: FetchImpl; calls: Array<{ url: string; init: RequestInit }> } {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const impl: FetchImpl = async (url, init) => {
    calls.push({ url: String(url), init: init ?? {} })
    if (response instanceof Error) throw response
    return response
  }
  return { impl, calls }
}

const tryRequest = (pathSuffix: string, ip = 'test-ip', method = 'POST') =>
  new Request(`https://ultrametric.ai/productarena/api/try/${pathSuffix}`, {
    method,
    headers: { 'cf-connecting-ip': ip, origin: 'https://ultrametric.ai' },
  })

// A real manifest key to exercise the handler's happy path against committed data.
const [aKey, aProbe] = Object.entries(LIVE_PROBES)[0] as [string, typeof PROBE]

describe('executeLiveProbe', () => {
  it('runs the exact manifest argv as a fetch and passes when the recorded status matches', async () => {
    const { impl, calls } = fetchOnce(new Response('# acme\ndocs body', { status: 200, headers: { 'content-type': 'text/plain' } }))
    const result = (await executeLiveProbe(PROBE, impl)) as TrySummary
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://acme.dev/llms.txt')
    expect(calls[0].init.method).toBe('GET')
    expect(calls[0].init.redirect).toBe('manual')
    expect(result).toMatchObject({ reachable: true, status: 200, pass: true, bodyExcerpt: '# acme\ndocs body' })
    expect(typeof result.elapsedMs).toBe('number')
  })

  it('reports pass:false when the live status differs from the recording', async () => {
    const { impl } = fetchOnce(new Response('gone', { status: 404 }))
    const result = (await executeLiveProbe(PROBE, impl)) as TrySummary
    expect(result.pass).toBe(false)
    expect(result.status).toBe(404)
    expect(result.expected).toEqual({ status: 200, pattern: null })
  })

  it('tests the recorded grep pattern against the live body', async () => {
    const probe = { ...PROBE, expectStatus: null, expectPattern: 'MCP|state machine', expectFlags: 'i' }
    const { impl } = fetchOnce(new Response('all about mcp servers', { status: 200 }))
    expect(((await executeLiveProbe(probe, impl)) as TrySummary).pass).toBe(true)
    const { impl: impl2 } = fetchOnce(new Response('nothing relevant', { status: 200 }))
    expect(((await executeLiveProbe(probe, impl2)) as TrySummary).pass).toBe(false)
  })

  it('claims no verdict (pass:null) when the recording pinned neither status nor pattern', async () => {
    const probe = { ...PROBE, expectStatus: null, expectPattern: null }
    const { impl } = fetchOnce(new Response('{"message":"Unauthorized"}', { status: 401 }))
    const result = (await executeLiveProbe(probe, impl)) as TrySummary
    expect(result.pass).toBeNull()
    expect(result.status).toBe(401)
  })

  it('caps the excerpt at 2 KB and flags the truncation', async () => {
    const { impl } = fetchOnce(new Response('x'.repeat(5000), { status: 200 }))
    const result = (await executeLiveProbe(PROBE, impl)) as TrySummary
    expect(result.bodyExcerpt).toHaveLength(2048)
    expect(result.truncated).toBe(true)
  })

  it('never forwards upstream headers — a set-cookie dies here', async () => {
    const { impl } = fetchOnce(new Response('ok', {
      status: 200,
      headers: { 'set-cookie': 'session=supersecret; HttpOnly', 'x-internal': 'topology' },
    }))
    const result = (await executeLiveProbe(PROBE, impl)) as TrySummary
    expect(JSON.stringify(result)).not.toContain('supersecret')
    expect(JSON.stringify(result)).not.toContain('topology')
  })

  it('reports an unreachable endpoint honestly', async () => {
    const { impl } = fetchOnce(new Error('boom'))
    const result = (await executeLiveProbe(PROBE, impl)) as TrySummary
    expect(result).toMatchObject({ reachable: false, pass: false })
    expect(result.error).toContain('unreachable')
  })

  it('follows redirects only when the recorded command did (-L)', async () => {
    const { impl, calls } = fetchOnce(new Response('ok', { status: 200 }))
    await executeLiveProbe({ ...PROBE, followRedirects: true }, impl)
    expect(calls[0].init.redirect).toBe('follow')
  })
})

describe('handleTryProbe', () => {
  it('404s any key outside the committed manifest — the only reachable URLs are our fixed ones', async () => {
    const { impl, calls } = fetchOnce(new Response('never'))
    const resp = await handleTryProbe(tryRequest('payments/stripe/../../evil', 'ip-404'), undefined, impl)
    expect(resp.status).toBe(400) // four segments -> bad shape
    const resp2 = await handleTryProbe(tryRequest('payments/stripe/not-a-real-probe', 'ip-404'), undefined, impl)
    expect(resp2.status).toBe(404)
    const resp3 = await handleTryProbe(tryRequest(`${encodeURIComponent('https://evil.example')}/x/y`, 'ip-404'), undefined, impl)
    expect(resp3.status).toBe(404)
    expect(calls).toHaveLength(0) // nothing was ever fetched
  })

  it('POST only', async () => {
    const { impl } = fetchOnce(new Response('never'))
    const resp = await handleTryProbe(tryRequest(aKey, 'ip-405', 'GET'), undefined, impl)
    expect(resp.status).toBe(405)
  })

  it('runs a real manifest entry and answers a sanitized summary', async () => {
    const { impl, calls } = fetchOnce(new Response('live body', { status: aProbe.expectStatus ?? 200, headers: { 'content-type': 'text/plain' } }))
    const resp = await handleTryProbe(tryRequest(aKey, 'ip-ok'), undefined, impl)
    expect(resp.status).toBe(200)
    const body = (await resp.json()) as TrySummary
    expect(calls[0].url).toBe(aProbe.url) // the fetch target came from the manifest, not the request
    expect(body).toMatchObject({ ok: true, url: aProbe.url, method: aProbe.method })
    expect(body.probeId).toBe(aKey.split('/')[2])
  })

  it('rate limits at 20/min/IP (per-isolate window)', async () => {
    const { impl } = fetchOnce(new Response('ok', { status: aProbe.expectStatus ?? 200 }))
    let last: Response | null = null
    for (let i = 0; i < 21; i++) {
      const { impl: fresh } = fetchOnce(new Response('ok', { status: aProbe.expectStatus ?? 200 }))
      last = await handleTryProbe(tryRequest(aKey, 'ip-burst'), undefined, i < 20 ? fresh : impl)
    }
    expect(last?.status).toBe(429)
  })

  it('enforces the KV window too, with hashed-IP keys (no raw IPs at rest)', async () => {
    const puts: Array<{ key: string; value: string; opts: unknown }> = []
    const kv = {
      get: async () => '20', // window already full
      put: async (key: string, value: string, opts: unknown) => { puts.push({ key, value, opts }) },
    }
    const { impl, calls } = fetchOnce(new Response('never'))
    const resp = await handleTryProbe(tryRequest(aKey, '203.0.113.99'), { PA_COMPARE_STATS: kv }, impl)
    expect(resp.status).toBe(429)
    expect(calls).toHaveLength(0)

    const kvCounts: string[] = []
    const kv2 = {
      get: async (key: string) => { kvCounts.push(key); return '3' },
      put: async (key: string, value: string, opts: unknown) => { puts.push({ key, value, opts }) },
    }
    const { impl: impl2 } = fetchOnce(new Response('ok', { status: aProbe.expectStatus ?? 200 }))
    const resp2 = await handleTryProbe(tryRequest(aKey, '203.0.113.100'), { PA_COMPARE_STATS: kv2 }, impl2)
    expect(resp2.status).toBe(200)
    expect(puts).toHaveLength(1)
    expect(puts[0].key.startsWith('tryrl:')).toBe(true)
    expect(puts[0].key).not.toContain('203.0.113.100') // SHA-256 bucket, not the IP
    expect(puts[0].value).toBe('4')
    expect(puts[0].opts).toEqual({ expirationTtl: 120 })
  })
})

describe('the committed manifest itself (drift + attack surface)', () => {
  const manifestPath = path.resolve(__dirname, '../../../data/live-probes.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
    probes: Array<{ arena: string; productId: string; probeId: string } & typeof PROBE>
  }

  it('data/live-probes.json and the worker bundle never drift (regenerate both with pipeline/scripts/generate-live-probe-manifest.ts)', () => {
    const fromJson = Object.fromEntries(
      manifest.probes.map(({ arena, productId, probeId, ...spec }) => [`${arena}/${productId}/${probeId}`, spec]),
    )
    expect(LIVE_PROBES).toEqual(fromJson)
  })

  it('every entry is a fixed public https URL with credential-free headers and a sane method', () => {
    for (const [key, probe] of Object.entries(LIVE_PROBES) as Array<[string, typeof PROBE]>) {
      const url = new URL(probe.url)
      expect(url.protocol, key).toBe('https:')
      expect(url.port, key).toBe('')
      expect(url.username, key).toBe('')
      expect(url.hostname.includes('.'), key).toBe(true)
      expect(/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname), key).toBe(false)
      expect(['localhost'].includes(url.hostname), key).toBe(false)
      expect(['GET', 'POST', 'HEAD'].includes(probe.method), key).toBe(true)
      for (const name of Object.keys(probe.headers)) {
        expect(/^(authorization|proxy-authorization|cookie|x-api-key|api-key|apikey)$/i.test(name), `${key} header ${name}`).toBe(false)
      }
      if (probe.body !== null) {
        expect(probe.body.includes('<'), key).toBe(false)
        expect(probe.body.length, key).toBeLessThanOrEqual(4096)
      }
    }
  })
})
