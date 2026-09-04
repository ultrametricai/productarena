import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_TTL_MS, createClient, DEFAULT_BASE_URL, resolveBaseUrl } from '../client'

describe('resolveBaseUrl', () => {
  const original = process.env.PA_BASE_URL

  afterEach(() => {
    process.env.PA_BASE_URL = original
  })

  it('defaults to the production site', () => {
    delete process.env.PA_BASE_URL
    expect(resolveBaseUrl()).toBe(DEFAULT_BASE_URL)
  })

  it('honors PA_BASE_URL, stripping a trailing slash', () => {
    process.env.PA_BASE_URL = 'http://localhost:3000/'
    expect(resolveBaseUrl()).toBe('http://localhost:3000')
  })
})

describe('createClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('fetches baseUrl + path and parses JSON', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ hello: 'world' }) })
    const client = createClient('https://example.test')
    const result = await client.fetchJson('/data/categories.json')
    expect(fetchMock).toHaveBeenCalledWith('https://example.test/data/categories.json')
    expect(result).toEqual({ hello: 'world' })
  })

  it('throws with status code on a non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })
    const client = createClient('https://example.test')
    await expect(client.fetchJson('/data/missing.json')).rejects.toThrow(/HTTP 404/)
  })

  it('wraps network failures in a readable error', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    const client = createClient('https://example.test')
    await expect(client.fetchJson('/data/categories.json')).rejects.toThrow(/GET .* failed: fetch failed/)
  })

  it('caches successful responses for the TTL, then refetches', async () => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ n: 1 }) })
    const client = createClient('https://example.test')

    await client.fetchJson('/data/categories.json')
    await client.fetchJson('/data/categories.json')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(CACHE_TTL_MS + 1)
    await client.fetchJson('/data/categories.json')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not cache failures', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ recovered: true }) })
    const client = createClient('https://example.test')

    await expect(client.fetchJson('/data/x.json')).rejects.toThrow(/HTTP 500/)
    await expect(client.fetchJson('/data/x.json')).resolves.toEqual({ recovered: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
