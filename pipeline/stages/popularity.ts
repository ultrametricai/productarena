// Keyless popularity/momentum signal ("will this project be alive tomorrow?" — a
// reader-requested addition). Gathers GitHub stars/forks/issues/dates for products with a
// urls.github, and npm/pypi weekly downloads for products curated in
// pipeline/popularity-packages.json, verified against the public registry (no API key for
// either source). NO LLM CALLS — this is a pure display signal, never fed into scoring (see
// lib/scoring.ts, which never imports lib/schemas.ts's PopularitySchema).
import fs from 'node:fs'
import path from 'node:path'
import { daysSincePush, starsPerYear } from '../../lib/popularity'
import { type Popularity, PopularityMapSchema, ProductSchema } from '../../lib/schemas'
import { fetchWithRetry } from '../fetch-page'
import { categoryDir, readJson, resolveCategories, writeJson } from '../paths'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export interface GithubRepoInfo {
  stars: number
  forks: number
  openIssues: number
  createdAt: string
  pushedAt: string
}

// Injectable so tests never touch the network (see pipeline/__tests__/popularity.test.ts) —
// same shape as pipeline/stages/probe.ts's ProbeFetcher.
export type GithubFetcher = (owner: string, repo: string) => Promise<GithubRepoInfo | null>
export type DownloadsFetcher = (pkg: string) => Promise<number | null>

// api.github.com/repos/{owner}/{repo}, unauthenticated (60 req/hr per IP — see runPopularity's
// per-product 7-day cache and inter-request delay). Returns null on any failure: 404 (unknown
// repo), 403 (rate-limited — GitHub returns non-2xx for this, so fetchWithRetry throws), or a
// network error. A rate-limited/failed fetch is NOT the same as "this repo has zero stars" —
// callers must fall back to the last cached value, never treat null as 0.
export const defaultGithubFetcher: GithubFetcher = async (owner, repo) => {
  let body: string
  try {
    body = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}`, 1)
  } catch {
    return null
  }
  let json: Record<string, unknown>
  try {
    json = JSON.parse(body) as Record<string, unknown>
  } catch {
    return null
  }
  if (typeof json.stargazers_count !== 'number' || typeof json.created_at !== 'string' || typeof json.pushed_at !== 'string') {
    return null
  }
  return {
    stars: json.stargazers_count,
    forks: typeof json.forks_count === 'number' ? json.forks_count : 0,
    openIssues: typeof json.open_issues_count === 'number' ? json.open_issues_count : 0,
    createdAt: json.created_at,
    pushedAt: json.pushed_at,
  }
}

// api.npmjs.org/downloads/point/last-week/{pkg} — public, keyless, generous limits. Scoped
// package names (e.g. "@angular/core") are passed through unencoded in the path per the API's
// documented usage; encodeURIComponent would double-encode the "/" and 404.
export const defaultNpmFetcher: DownloadsFetcher = async (pkg) => {
  let body: string
  try {
    body = await fetchWithRetry(`https://api.npmjs.org/downloads/point/last-week/${pkg}`, 1)
  } catch {
    return null
  }
  try {
    const json = JSON.parse(body) as { downloads?: unknown }
    return typeof json.downloads === 'number' ? json.downloads : null
  } catch {
    return null
  }
}

// pypistats.org/api/packages/{pkg}/recent — public, keyless. Verified working (see commit
// history / task notes): requires a real User-Agent (fetchWithRetry always sends one), a bare
// curl with no UA gets blocked. Shape: {"data":{"last_day":n,"last_month":n,"last_week":n},...}.
export const defaultPypiFetcher: DownloadsFetcher = async (pkg) => {
  let body: string
  try {
    body = await fetchWithRetry(`https://pypistats.org/api/packages/${pkg}/recent`, 1)
  } catch {
    return null
  }
  try {
    const json = JSON.parse(body) as { data?: { last_week?: unknown } }
    return typeof json.data?.last_week === 'number' ? json.data.last_week : null
  } catch {
    return null
  }
}

// Parses "https://github.com/{owner}/{repo}[/tree/...]" into {owner, repo}. Null for anything
// that isn't a github.com repo URL (defensive — urls.github is a plain z.string().url() in
// lib/schemas.ts, not validated as github.com specifically).
export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  if (u.hostname !== 'github.com' && u.hostname !== 'www.github.com') return null
  const [owner, repo] = u.pathname.replace(/^\/+/, '').split('/')
  if (!owner || !repo) return null
  return { owner, repo: repo.replace(/\.git$/, '') }
}

// Pure: raw fetched numbers -> the Popularity shape (minus fetchedAt, stamped by the caller).
// Exported for unit testing without any network/fs.
export function derivePopularity(
  raw: { github?: GithubRepoInfo | null; npmWeekly?: number | null; pypiWeekly?: number | null },
  now: Date = new Date(),
): Omit<Popularity, 'fetchedAt'> {
  const out: Omit<Popularity, 'fetchedAt'> = {}
  if (raw.github) {
    out.stars = raw.github.stars
    out.forks = raw.github.forks
    out.openIssues = raw.github.openIssues
    const spy = starsPerYear(raw.github.stars, raw.github.createdAt, now)
    if (spy !== undefined) out.starsPerYear = spy
    const dsp = daysSincePush(raw.github.pushedAt, now)
    if (dsp !== undefined) out.daysSincePush = dsp
  }
  if (typeof raw.npmWeekly === 'number') out.npmWeekly = raw.npmWeekly
  if (typeof raw.pypiWeekly === 'number') out.pypiWeekly = raw.pypiWeekly
  return out
}

interface PackageEntry {
  npm?: string
  pypi?: string
}

function readPackageMap(): Record<string, PackageEntry> {
  const file = path.join(__dirname, '..', 'popularity-packages.json')
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, PackageEntry>
}

export interface PopularityDeps {
  github: GithubFetcher
  npm: DownloadsFetcher
  pypi: DownloadsFetcher
  now: () => Date
  delayMs: number
}

const defaultDeps: PopularityDeps = {
  github: defaultGithubFetcher,
  npm: defaultNpmFetcher,
  pypi: defaultPypiFetcher,
  now: () => new Date(),
  delayMs: 1000,
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// One history line per product per run — the raw run-cadence time series that future velocity
// features (rate of change of stars/downloads) will read. Deliberately includes `runAt`
// (when this pipeline run happened) distinct from the popularity record's own `fetchedAt` (when
// the underlying numbers were actually fetched — may be older, if this run hit the 7-day cache).
interface PopularityHistoryLine extends Popularity {
  productId: string
  runAt: string
}

export async function runPopularity(
  { category, product }: { category?: string; product?: string },
  deps: PopularityDeps = defaultDeps,
): Promise<void> {
  const packageMap = readPackageMap()

  let matched = 0
  for (const cat of resolveCategories(category)) {
    const dataDir = categoryDir(cat.id)
    const products = readJson(ProductSchema.array(), path.join(dataDir, 'products.json')).filter(
      (p) => !product || p.id === product,
    )
    matched += products.length

    const popularityPath = path.join(dataDir, 'popularity.json')
    const existingMap: Record<string, Popularity> = fs.existsSync(popularityPath)
      ? PopularityMapSchema.parse(JSON.parse(fs.readFileSync(popularityPath, 'utf8')))
      : {}
    const nextMap: Record<string, Popularity> = { ...existingMap }
    const historyLines: PopularityHistoryLine[] = []

    for (const p of products) {
      const pkgs = packageMap[p.id] ?? {}
      const hasGithub = !!p.urls.github
      if (!hasGithub && !pkgs.npm && !pkgs.pypi) {
        console.log(`popularity: ${cat.id}/${p.id} → no discoverable signal source; skipped`)
        continue
      }

      const now = deps.now()
      const cached = existingMap[p.id]
      if (cached && now.getTime() - new Date(cached.fetchedAt).getTime() < SEVEN_DAYS_MS) {
        console.log(`popularity: ${cat.id}/${p.id} → cached (fetched ${cached.fetchedAt}, <7d old); skipping refetch`)
        historyLines.push({ productId: p.id, ...cached, runAt: now.toISOString() })
        continue
      }

      let github: GithubRepoInfo | null = null
      if (hasGithub) {
        const parsed = parseGithubUrl(p.urls.github!)
        if (parsed) {
          github = await deps.github(parsed.owner, parsed.repo)
          await sleep(deps.delayMs)
        }
      }
      const npmWeekly = pkgs.npm ? await deps.npm(pkgs.npm) : null
      const pypiWeekly = pkgs.pypi ? await deps.pypi(pkgs.pypi) : null

      if (!github && npmWeekly === null && pypiWeekly === null) {
        console.warn(`popularity: WARN ${cat.id}/${p.id} → all sources failed/empty this run`)
        if (cached) historyLines.push({ productId: p.id, ...cached, runAt: now.toISOString() })
        continue
      }

      const derived = derivePopularity({ github, npmWeekly, pypiWeekly }, now)
      const entry: Popularity = { ...derived, fetchedAt: now.toISOString() }
      nextMap[p.id] = entry
      historyLines.push({ productId: p.id, ...entry, runAt: now.toISOString() })
      console.log(`popularity: ${cat.id}/${p.id} → ${JSON.stringify(derived)}`)
    }

    writeJson(popularityPath, nextMap)
    if (historyLines.length > 0) {
      const historyPath = path.join(dataDir, 'popularity-history.jsonl')
      fs.appendFileSync(historyPath, historyLines.map((l) => JSON.stringify(l)).join('\n') + '\n')
    }
  }
  if (product && matched === 0) throw new Error(`unknown product: ${product}`)
}
