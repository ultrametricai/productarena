// Thin fetch wrapper over ProductArena's static JSON data API (see the root repo's README
// "For AI agents" section and /openapi.json), with a small in-process TTL cache so tools that
// fan out across every arena (search_products, compare, top_products) don't refetch the same
// static files on every call. Base URL is overridable via PA_BASE_URL so this can be pointed
// at a local `next dev`/`next start` during development or testing.

export const DEFAULT_BASE_URL = 'https://ultrametric.ai/productarena'
export const CACHE_TTL_MS = 5 * 60 * 1000

export function resolveBaseUrl(): string {
  return process.env.PA_BASE_URL?.replace(/\/$/, '') || DEFAULT_BASE_URL
}

export interface ArenaClient {
  readonly baseUrl: string
  fetchJson<T>(path: string): Promise<T>
}

interface CacheEntry {
  expiresAt: number
  value: unknown
}

// `path` must start with "/" (e.g. "/data/categories.json"). Uses the global `fetch` so tests
// can mock it directly (see mcp/src/__tests__/*.test.ts). Successful responses are cached for
// CACHE_TTL_MS; failures are never cached, so a transient upstream error doesn't stick.
export function createClient(baseUrl: string = resolveBaseUrl()): ArenaClient {
  const cache = new Map<string, CacheEntry>()
  return {
    baseUrl,
    async fetchJson<T>(path: string): Promise<T> {
      const hit = cache.get(path)
      if (hit && hit.expiresAt > Date.now()) return hit.value as T
      const url = `${baseUrl}${path}`
      let res: Response
      try {
        res = await fetch(url)
      } catch (err) {
        throw new Error(`GET ${url} failed: ${err instanceof Error ? err.message : String(err)}`)
      }
      if (!res.ok) {
        throw new Error(`GET ${url} -> HTTP ${res.status}`)
      }
      const value = (await res.json()) as T
      cache.set(path, { expiresAt: Date.now() + CACHE_TTL_MS, value })
      return value
    },
  }
}
