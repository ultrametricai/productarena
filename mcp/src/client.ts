// Thin fetch wrapper over Product Arena's static JSON data API (see the root repo's README
// "For AI agents" section and /openapi.json). Base URL is overridable via PA_BASE_URL so this
// can be pointed at a local `next dev`/`next start` during development or testing.

export const DEFAULT_BASE_URL = 'https://productarena.vercel.app'

export function resolveBaseUrl(): string {
  return process.env.PA_BASE_URL?.replace(/\/$/, '') || DEFAULT_BASE_URL
}

export interface ProductArenaClient {
  readonly baseUrl: string
  fetchJson<T>(path: string): Promise<T>
}

// `path` must start with "/" (e.g. "/data/categories.json"). Uses the global `fetch` so tests
// can mock it directly (see mcp/src/__tests__/tools.test.ts).
export function createClient(baseUrl: string = resolveBaseUrl()): ProductArenaClient {
  return {
    baseUrl,
    async fetchJson<T>(path: string): Promise<T> {
      const url = `${baseUrl}${path}`
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`GET ${url} -> HTTP ${res.status}`)
      }
      return (await res.json()) as T
    },
  }
}
