import type { SearchEntry, SearchEntryType } from './search-index'

const types = new Set<SearchEntryType>(['arena', 'stack', 'process', 'page', 'product', 'story'])
const requests = new Map<string, Promise<SearchEntry[]>>()

function isSearchEntry(value: unknown): value is SearchEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return types.has(entry.type as SearchEntryType)
    && typeof entry.label === 'string'
    && typeof entry.sublabel === 'string'
    && typeof entry.href === 'string'
    && (entry.productId === undefined || typeof entry.productId === 'string')
    && (entry.hasLogo === undefined || typeof entry.hasLogo === 'boolean')
    && (entry.icon === undefined || typeof entry.icon === 'string')
    && (entry.keywords === undefined || (Array.isArray(entry.keywords) && entry.keywords.every((word) => typeof word === 'string')))
}

// Coalesce concurrent opens and retain successful results across client navigation.
// The server supplies a content-versioned URL; a new index never reuses old entries.
export function loadCommandPaletteIndex(url: string): Promise<SearchEntry[]> {
  const existing = requests.get(url)
  if (existing) return existing

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) throw new Error('Search index request failed')
      const entries: unknown = await response.json()
      if (!Array.isArray(entries) || !entries.every(isSearchEntry)) throw new Error('Invalid search index')
      return entries
    })
    .catch((error: unknown) => {
      // A failed request must not poison later opens or the explicit retry action.
      requests.delete(url)
      throw error
    })
  requests.set(url, request)
  return request
}
