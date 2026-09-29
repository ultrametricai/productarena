import { describe, expect, it } from 'vitest'
import {
  DOCUMENT_USE_CASES,
  loadDocumentRegistry,
  validateDocumentReadme,
  validateDocumentRegistry,
  validateDocuments,
  type DocumentRegistry,
} from '@/lib/documents'

// The open-documents map gates: every committed record is well-formed, dated, HTTPS, and the
// README's grouped tables stay in sync with the registry. Link-don't-redistribute is policy
// (documents/README.md); nothing here fetches the documents.

const AS_OF = new Date('2026-09-29T00:00:00Z')

describe('documents corpus', () => {
  it('the committed registry + README pass every invariant', () => {
    expect(validateDocuments(AS_OF)).toEqual([])
  })

  it('covers every use case with the anchor documents', () => {
    const registry = loadDocumentRegistry()
    const byUseCase = new Map<string, number>()
    for (const d of registry.documents) byUseCase.set(d.use_case, (byUseCase.get(d.use_case) ?? 0) + 1)
    for (const uc of DOCUMENT_USE_CASES) {
      expect(byUseCase.get(uc) ?? 0, `use case ${uc} must not be empty`).toBeGreaterThan(0)
    }
    const ids = new Set(registry.documents.map((d) => d.id))
    for (const id of [
      'yc-postmoney-safe-cap',
      'yc-safe-user-guide',
      'yc-series-a-term-sheet',
      'nvca-model-legal-documents',
      'cooley-series-seed-package',
      'cooley-ciiaa',
      'commonpaper-mutual-nda',
      'saft-form',
      'irs-form-15620',
    ]) {
      expect(ids.has(id), `registry must keep ${id}`).toBe(true)
    }
  })

  it('every record carries an honest license/terms note (no bare links)', () => {
    for (const d of loadDocumentRegistry().documents) {
      expect(d.license_note.length, `${d.id} license_note`).toBeGreaterThan(30)
    }
  })
})

describe('documents validators (failure modes)', () => {
  const record = (over: Partial<DocumentRegistry['documents'][number]> = {}) => ({
    id: 'ok-doc',
    name: 'A document',
    publisher: 'A publisher',
    url: 'https://example.com/doc',
    license_note: 'Freely published under the publisher’s terms; counsel still required.',
    use_case: 'formation' as const,
    jurisdiction: 'US',
    format: 'pdf' as const,
    checked_on: '2026-09-29',
    ...over,
  })
  const reg = (...documents: DocumentRegistry['documents']): DocumentRegistry => ({ updated_on: '2026-09-29', documents })

  it('rejects duplicate ids, non-HTTPS URLs, unknown enums, and future checks', () => {
    expect(validateDocumentRegistry(reg(record(), record()), AS_OF).join(';')).toContain('duplicate document id')
    expect(validateDocumentRegistry(reg(record({ url: 'http://example.com' })), AS_OF).join(';')).toContain('HTTPS')
    expect(
      validateDocumentRegistry(reg(record({ use_case: 'marketing' as unknown as 'formation' })), AS_OF).join(';'),
    ).toContain('unknown use_case')
    expect(
      validateDocumentRegistry(reg(record({ format: 'zip' as unknown as 'pdf' })), AS_OF).join(';'),
    ).toContain('unknown format')
    expect(validateDocumentRegistry(reg(record({ checked_on: '2027-01-01' })), AS_OF).join(';')).toContain('future')
  })

  it('catches README drift in both directions', () => {
    const registry = reg(record({ id: 'present-doc' }))
    expect(validateDocumentReadme('no table at all', registry).join(';')).toContain('missing registry id present-doc')
    const rogue = '| `present-doc` | x |\n| `ghost-doc` | y |'
    expect(validateDocumentReadme(rogue, registry).join(';')).toContain('unknown id ghost-doc')
  })
})
