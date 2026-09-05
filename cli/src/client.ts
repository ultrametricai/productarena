// Thin fetch wrapper over ProductArena's static JSON data API — the same access pattern as
// mcp/src/client.ts (see the root README's "For AI agents" section and /openapi.json): a small
// in-process TTL cache so commands that fan out across every arena (arenas, compare, top, pick)
// don't refetch the same static files within one invocation. Base URL is overridable via
// PA_BASE_URL so the CLI can be pointed at a local `next dev`/`next start`.

export const DEFAULT_BASE_URL = 'https://ultrametric.ai/productarena'
export const CACHE_TTL_MS = 5 * 60 * 1000

export function resolveBaseUrl(): string {
  return process.env.PA_BASE_URL?.replace(/\/$/, '') || DEFAULT_BASE_URL
}

// Distinguishes "the network/site is unhappy" (exit code 2) from caller mistakes like an
// unknown arena id (UsageError in errors.ts, exit code 1).
export class NetworkError extends Error {
  readonly status: number | null
  constructor(message: string, status: number | null = null) {
    super(message)
    this.status = status
  }
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
// can mock it directly. Successful responses are cached for CACHE_TTL_MS; failures are never
// cached, so a transient upstream error doesn't stick.
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
        throw new NetworkError(`GET ${url} failed: ${err instanceof Error ? err.message : String(err)}`)
      }
      if (!res.ok) {
        throw new NetworkError(`GET ${url} -> HTTP ${res.status}`, res.status)
      }
      const value = (await res.json()) as T
      cache.set(path, { expiresAt: Date.now() + CACHE_TTL_MS, value })
      return value
    },
  }
}
