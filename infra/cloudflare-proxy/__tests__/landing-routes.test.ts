// Routing tests for the retired-landing cutover (founder 2026-09-29: the landing pages moved
// into the product app; one top bar sitewide). The worker now serves '/' from the product
// origin's /home, treats /company and /tos as ordinary product routes, and 301s the old
// Astro-only paths (/afk, /process/*). Same injection pattern as the other worker tests:
// no network — the origin fetch is stubbed per test.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../worker.js'

const ORIGIN = 'https://ultrametric.vercel.app'

function stubOriginFetch(body = 'ok') {
  const calls: string[] = []
  vi.stubGlobal('fetch', async (input: URL | RequestInfo) => {
    calls.push(String(input instanceof Request ? input.url : input))
    return new Response(body, { status: 200, headers: { 'content-type': 'text/html' } })
  })
  return calls
}

function get(path: string) {
  return worker.fetch(new Request(`https://ultrametric.ai${path}`), {}, undefined)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('landing cutover routing', () => {
  it("serves '/' from the product origin's /home (pathname rewrite, no redirect)", async () => {
    const calls = stubOriginFetch()
    const resp = await get('/')
    expect(resp.status).toBe(200)
    expect(calls).toEqual([`${ORIGIN}/home`])
  })

  it('proxies /company and /tos to the product origin as ordinary routes', async () => {
    for (const path of ['/company', '/tos']) {
      const calls = stubOriginFetch()
      const resp = await get(path)
      expect(resp.status).toBe(200)
      expect(calls).toEqual([`${ORIGIN}${path}`])
      vi.unstubAllGlobals()
    }
  })

  it('still serves /overall from the product origin root', async () => {
    const calls = stubOriginFetch()
    const resp = await get('/overall')
    expect(resp.status).toBe(200)
    expect(calls).toEqual([`${ORIGIN}/`])
  })

  it('301s /afk and /afk/* to /company', async () => {
    for (const path of ['/afk', '/afk/waitlist']) {
      const resp = await get(path)
      expect(resp.status).toBe(301)
      expect(resp.headers.get('location')).toBe('https://ultrametric.ai/company')
    }
  })

  it('301s the /process index to the /processes corpus index', async () => {
    for (const path of ['/process', '/process/']) {
      const resp = await get(path)
      expect(resp.status).toBe(301)
      expect(resp.headers.get('location')).toBe('https://ultrametric.ai/processes')
    }
  })

  it('301s matching /process/<slug> guides to their /processes/<slug> equivalent', async () => {
    const resp = await get('/process/run-payroll')
    expect(resp.status).toBe(301)
    expect(resp.headers.get('location')).toBe('https://ultrametric.ai/processes/run-payroll')
  })

  it('applies the per-slug renames where the corpus slug differs', async () => {
    for (const [from, to] of [
      ['close-the-books', 'bookkeeping-close'],
      ['get-an-ein', 'get-ein'],
      ['incorporate-a-delaware-c-corp', 'incorporate-c-corp'],
      ['generate-a-company-website', 'generate-a-website'],
    ]) {
      const resp = await get(`/process/${from}`)
      expect(resp.status).toBe(301)
      expect(resp.headers.get('location')).toBe(`https://ultrametric.ai/processes/${to}`)
    }
  })

  it('sends AFK-app-specific guides with no corpus equivalent to the corpus index', async () => {
    for (const slug of ['list-my-tasks', 'summarize-my-company', 'extract-ultrametric-context', 'list-capabilities']) {
      const resp = await get(`/process/${slug}`)
      expect(resp.status).toBe(301)
      expect(resp.headers.get('location')).toBe('https://ultrametric.ai/processes')
    }
  })

  it('301s /v2 and /v2/ to /get-started (founder 2026-09-29 rename)', async () => {
    // A Cloudflare ZONE rule still intercepts /v2 ahead of the worker in production; this
    // redirect takes over the moment the founder removes it.
    for (const path of ['/v2', '/v2/']) {
      const resp = await get(path)
      expect(resp.status).toBe(301)
      expect(resp.headers.get('location')).toBe('https://ultrametric.ai/get-started')
    }
  })

  it('301s deeper /v2/* paths to /get-started with the query intact', async () => {
    const resp = await get('/v2/opengraph-image?x=1')
    expect(resp.status).toBe(301)
    expect(resp.headers.get('location')).toBe('https://ultrametric.ai/get-started?x=1')
  })
})
