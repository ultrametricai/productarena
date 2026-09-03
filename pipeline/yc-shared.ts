// Shared helpers for the YC ingestion + arena-mapping lane (pipeline/scripts/yc-*.ts). Source of
// truth is the yc-oss/api mirror (https://yc-oss.github.io/api/companies/all.json) of YC's public
// company directory — a keyless, community-maintained static JSON export, chosen over guessing at
// YC's private Algolia app id because it's verifiably reachable without credentials and mirrors
// every batch back to Winter 2006.
export const YC_ALL_COMPANIES_URL = 'https://yc-oss.github.io/api/companies/all.json'

// "Modern" per the lane spec: W23 through the most recent batch, i.e. every 2023–2026 batch.
// Ordered oldest → newest for deterministic report output.
export const MODERN_BATCHES = [
  'Winter 2023', 'Summer 2023',
  'Winter 2024', 'Summer 2024',
  'Winter 2025', 'Summer 2025',
  'Winter 2026', 'Summer 2026',
]

const SEASON_CODE: Record<string, string> = { Winter: 'W', Summer: 'S' }

// "Winter 2023" -> "W23", "Summer 2026" -> "S26". Returns null for anything that doesn't match
// YC's "<Season> <Year>" batch naming (e.g. the raw feed's occasional "Unspecified" value).
export function batchCode(fullBatchName: string): string | null {
  const m = /^(Winter|Summer) (\d{4})$/.exec(fullBatchName)
  if (!m) return null
  const season = SEASON_CODE[m[1]]
  const year = m[2].slice(2)
  return `${season}${year}`
}

// Raw shape of one entry from the yc-oss/api companies/all.json feed — only the fields this lane
// actually reads; the upstream feed has many more (see pipeline/cache/yc/companies-all.json).
export interface YcRawCompany {
  name: string
  slug: string
  website: string
  one_liner: string
  tags: string[]
  industries: string[]
  batch: string
  status: string
  url: string
}

// Normalizes a domain for matching: strips protocol, "www.", trailing slash, and path/query, and
// lowercases. Two products are "the same YC company" iff their normalized site domains match —
// deliberately never matched by name (see the lane spec's "verify each match by website domain,
// not name" requirement, which guards against name collisions like a non-YC "Linear" vendor).
export function normalizeDomain(url: string | undefined | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url.includes('://') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}
