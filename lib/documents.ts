import fs from 'node:fs'
import path from 'node:path'

// Loader + validator for the open-documents map (documents/registry.json + documents/README.md).
// Same doctrine as lib/resources.ts: structural/referential invariants as a flat error list for
// the vitest gate (__tests__/documents.test.ts); pure validators take data so failure modes are
// testable; no network I/O — URL liveness is an editorial duty recorded via checked_on.
// Policy enforced socially, stated here for the record: link, never redistribute the documents.

export const DOCUMENT_USE_CASES = ['formation', 'fundraising', 'hiring', 'commercial', 'governance'] as const
export type DocumentUseCase = (typeof DOCUMENT_USE_CASES)[number]

export const DOCUMENT_FORMATS = ['web-page', 'pdf', 'docx', 'xlsx', 'doc-generator', 'mixed'] as const
export type DocumentFormat = (typeof DOCUMENT_FORMATS)[number]

export interface OpenDocument {
  id: string
  name: string
  publisher: string
  url: string
  /** The published license/terms, honestly stated, including what still requires counsel. */
  license_note: string
  use_case: DocumentUseCase
  /** Descriptive, not a jurisdictions/-registry code: many standards are deliberately neutral. */
  jurisdiction: string
  format: DocumentFormat
  checked_on: string
}

export interface DocumentRegistry {
  updated_on: string
  documents: OpenDocument[]
}

const ID_RE = /^[a-z0-9][a-z0-9.-]*$/
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isIsoDate(value: string): boolean {
  return ISO_DATE_RE.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())
}

export function validateDocumentRegistry(doc: DocumentRegistry, asOf: Date): string[] {
  const errors: string[] = []
  if (!isIsoDate(doc.updated_on)) errors.push(`registry.updated_on: invalid ISO date ${JSON.stringify(doc.updated_on)}`)
  if (!Array.isArray(doc.documents) || doc.documents.length === 0) {
    errors.push('registry: no documents')
    return errors
  }
  const ids = new Set<string>()
  for (const d of doc.documents) {
    const where = `document ${d.id ?? '<missing id>'}`
    if (typeof d.id !== 'string' || !ID_RE.test(d.id)) errors.push(`${where}: invalid id`)
    else if (ids.has(d.id)) errors.push(`duplicate document id ${d.id}`)
    else ids.add(d.id)
    for (const key of ['name', 'publisher', 'license_note', 'jurisdiction'] as const) {
      if (typeof d[key] !== 'string' || d[key].trim().length === 0) errors.push(`${where}: missing ${key}`)
    }
    // NB: URLs may legitimately repeat — YC's SAFE variants all live on the one stable
    // /documents page because the per-file asset links are content-hashed and rotate.
    if (typeof d.url !== 'string' || !d.url.startsWith('https://')) errors.push(`${where}: require HTTPS URL`)
    if (!DOCUMENT_USE_CASES.includes(d.use_case)) errors.push(`${where}: unknown use_case ${JSON.stringify(d.use_case)}`)
    if (!DOCUMENT_FORMATS.includes(d.format)) errors.push(`${where}: unknown format ${JSON.stringify(d.format)}`)
    if (typeof d.checked_on !== 'string' || !isIsoDate(d.checked_on)) errors.push(`${where}: invalid checked_on`)
    else if (new Date(`${d.checked_on}T00:00:00Z`) > asOf) errors.push(`${where}: checked_on is in the future`)
  }
  return errors
}

/** The README's grouped tables must stay in sync: every registry id appears in the README,
 * and every backticked slug in a README table row resolves to a registry id. */
export function validateDocumentReadme(readme: string, registry: DocumentRegistry): string[] {
  const errors: string[] = []
  const known = new Set(registry.documents.map((d) => d.id))
  for (const id of known) {
    if (!readme.includes(`\`${id}\``)) errors.push(`README: missing registry id ${id}`)
  }
  for (const line of readme.split('\n')) {
    const m = /^\| `([^`]+)` \|/.exec(line.trim())
    if (m && !known.has(m[1])) errors.push(`README: table row cites unknown id ${m[1]}`)
  }
  return errors
}

const ROOT = process.cwd()

export function loadDocumentRegistry(): DocumentRegistry {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'documents/registry.json'), 'utf8')) as DocumentRegistry
}

/** The full gate: registry invariants + README/registry sync. Empty array = pass. */
export function validateDocuments(asOf?: Date): string[] {
  const registry = loadDocumentRegistry()
  const readme = fs.readFileSync(path.join(ROOT, 'documents/README.md'), 'utf8')
  return [...validateDocumentRegistry(registry, asOf ?? new Date()), ...validateDocumentReadme(readme, registry)]
}
