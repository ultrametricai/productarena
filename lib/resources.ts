import fs from 'node:fs'
import path from 'node:path'

// Loader + validator for the startup-resources corpus (resources/registry.json and the
// distilled resources/LAWS.md). Follows the lib/founderOps.ts pattern: structural and
// referential invariants only, returned as a flat error list so the vitest gate
// (__tests__/resources.test.ts) can assert an empty array. The pure validators take data,
// not paths, so tests can exercise failure modes without touching the committed corpus.
//
// Deliberately deterministic: URL liveness is an editorial duty recorded via checked_on
// (see resources/README.md); nothing here performs network I/O.

export const RESOURCE_KINDS = [
  'essay',
  'guide',
  'handbook',
  'library',
  'primary-source',
  'document-repository',
] as const

export type ResourceKind = (typeof RESOURCE_KINDS)[number]

export interface StartupResource {
  id: string
  title: string
  author: string
  url: string
  kind: ResourceKind
  topics: string[]
  note: string
  published_on: string | null
  checked_on: string
}

export interface ResourceRegistry {
  updated_on: string
  resources: StartupResource[]
}

export interface StartupLaw {
  /** Global 1-based number, continuous across stages. */
  number: number
  /** The `## ` stage heading the law appears under. */
  stage: string
  title: string
  /** Registry ids cited on the law's `Sources:` line. */
  sourceIds: string[]
}

export const LAWS_MIN = 25
export const LAWS_MAX = 40

const ID_RE = /^[a-z0-9][a-z0-9.-]*$/
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isIsoDate(value: string): boolean {
  return ISO_DATE_RE.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export function validateResourceRegistry(doc: ResourceRegistry, asOf: Date): string[] {
  const errors: string[] = []
  if (!isIsoDate(doc.updated_on)) errors.push(`registry.updated_on: invalid ISO date ${JSON.stringify(doc.updated_on)}`)
  if (!Array.isArray(doc.resources) || doc.resources.length === 0) {
    errors.push('registry: no resources')
    return errors
  }
  const ids = new Set<string>()
  const urls = new Set<string>()
  for (const r of doc.resources) {
    const where = `resource ${r.id ?? '<missing id>'}`
    if (typeof r.id !== 'string' || !ID_RE.test(r.id)) errors.push(`${where}: invalid id`)
    else if (ids.has(r.id)) errors.push(`duplicate resource id ${r.id}`)
    else ids.add(r.id)
    for (const key of ['title', 'author', 'note'] as const) {
      if (typeof r[key] !== 'string' || r[key].trim().length === 0) errors.push(`${where}: missing ${key}`)
    }
    if (typeof r.url !== 'string' || !r.url.startsWith('https://')) errors.push(`${where}: require HTTPS URL`)
    else if (urls.has(r.url)) errors.push(`${where}: duplicate URL ${r.url}`)
    else urls.add(r.url)
    if (!RESOURCE_KINDS.includes(r.kind)) errors.push(`${where}: unknown kind ${JSON.stringify(r.kind)}`)
    if (!Array.isArray(r.topics) || r.topics.length === 0) errors.push(`${where}: topics must be non-empty`)
    else if (r.topics.some((t) => typeof t !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(t))) {
      errors.push(`${where}: topics must be lowercase slugs`)
    }
    if (r.published_on !== null && (typeof r.published_on !== 'string' || !isIsoDate(r.published_on))) {
      errors.push(`${where}: published_on must be null or an ISO date`)
    }
    if (typeof r.checked_on !== 'string' || !isIsoDate(r.checked_on)) errors.push(`${where}: invalid checked_on`)
    else if (new Date(`${r.checked_on}T00:00:00Z`) > asOf) errors.push(`${where}: checked_on is in the future`)
  }
  return errors
}

// ---------------------------------------------------------------------------
// LAWS.md
// ---------------------------------------------------------------------------

/**
 * Parse resources/LAWS.md. Grammar (kept deliberately rigid so drift is caught):
 *   `## <stage>` opens a lifecycle stage;
 *   `### <n>. <title>` opens law n (global, continuous numbering);
 *   a law body must contain exactly one `Sources:` line citing backticked registry ids.
 */
export function parseStartupLaws(markdown: string): { laws: StartupLaw[]; errors: string[] } {
  const laws: StartupLaw[] = []
  const errors: string[] = []
  let stage: string | null = null
  let current: StartupLaw | null = null
  let currentHasSources = false

  const finish = () => {
    if (current && !currentHasSources) errors.push(`law ${current.number} (${current.title}): missing Sources line`)
    current = null
    currentHasSources = false
  }

  for (const line of markdown.split('\n')) {
    const stageMatch = /^## (?!#)(.+)$/.exec(line)
    if (stageMatch) {
      finish()
      stage = stageMatch[1].trim()
      continue
    }
    const lawMatch = /^### (\d+)\. (.+)$/.exec(line)
    if (lawMatch) {
      finish()
      if (!stage) errors.push(`law "${lawMatch[2]}": appears before any stage heading`)
      current = { number: Number(lawMatch[1]), stage: stage ?? '', title: lawMatch[2].trim(), sourceIds: [] }
      laws.push(current)
      continue
    }
    const sourcesMatch = /^Sources:\s*(.+)$/.exec(line.trim())
    if (sourcesMatch) {
      if (!current) {
        errors.push('Sources line outside any law')
        continue
      }
      if (currentHasSources) errors.push(`law ${current.number}: multiple Sources lines`)
      currentHasSources = true
      const cited = [...sourcesMatch[1].matchAll(/`([^`]+)`/g)].map((m) => m[1])
      if (cited.length === 0) errors.push(`law ${current.number}: Sources line cites nothing`)
      current.sourceIds = cited
    }
  }
  finish()
  return { laws, errors }
}

export function validateStartupLaws(markdown: string, registry: ResourceRegistry): string[] {
  const { laws, errors } = parseStartupLaws(markdown)
  const known = new Set(registry.resources.map((r) => r.id))
  if (laws.length < LAWS_MIN || laws.length > LAWS_MAX) {
    errors.push(`laws: expected ${LAWS_MIN}-${LAWS_MAX}, found ${laws.length}`)
  }
  laws.forEach((law, i) => {
    if (law.number !== i + 1) errors.push(`law ${law.number} (${law.title}): expected number ${i + 1}`)
    for (const id of law.sourceIds) {
      if (!known.has(id)) errors.push(`law ${law.number} (${law.title}): unknown source id ${id}`)
    }
    const dupes = law.sourceIds.filter((id, j) => law.sourceIds.indexOf(id) !== j)
    if (dupes.length > 0) errors.push(`law ${law.number}: duplicate citation ${dupes[0]}`)
  })
  const titles = new Set<string>()
  for (const law of laws) {
    if (titles.has(law.title)) errors.push(`duplicate law title "${law.title}"`)
    titles.add(law.title)
  }
  return errors
}

// ---------------------------------------------------------------------------
// Filesystem entry points (the committed corpus)
// ---------------------------------------------------------------------------

const ROOT = process.cwd()

export function loadResourceRegistry(): ResourceRegistry {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'resources/registry.json'), 'utf8')) as ResourceRegistry
}

export function loadStartupLawsMarkdown(): string {
  return fs.readFileSync(path.join(ROOT, 'resources/LAWS.md'), 'utf8')
}

/** The full gate: registry invariants + LAWS.md citation resolution. Empty array = pass. */
export function validateResources(asOf?: Date): string[] {
  const registry = loadResourceRegistry()
  const markdown = loadStartupLawsMarkdown()
  return [...validateResourceRegistry(registry, asOf ?? new Date()), ...validateStartupLaws(markdown, registry)]
}
