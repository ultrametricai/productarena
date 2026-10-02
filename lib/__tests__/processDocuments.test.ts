import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadDocumentRegistry } from '@/lib/documents'

// Step documents (founder spike 2026-10-02, form_001 reference depth): corpus nodes may carry
// `documents: string[]` — ids into documents/registry.json (processes/README.md "Step
// documents"). This is the referential-integrity gate the house standard demands for every
// cross-registry link (producesArtifact → artifacts.json, rule source_ids → sources/): a
// typo'd document id must fail loudly, not silently dangle. Reads the RAW corpus so
// jurisdiction-conditional nodes are covered too.

const RAW = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../processes/corpus.json'), 'utf8'),
) as Array<{ id: string; dag: { nodes: Array<{ id: string; documents?: string[] }> } }>

const tagged = RAW.flatMap((t) =>
  t.dag.nodes.filter((n) => n.documents).map((n) => ({ task: t.id, node: n.id, documents: n.documents! })),
)

describe('step documents cross-reference', () => {
  it('every node documents id resolves in documents/registry.json', () => {
    const known = new Set(loadDocumentRegistry().documents.map((d) => d.id))
    for (const t of tagged) {
      expect(t.documents.length, `${t.task}/${t.node}`).toBeGreaterThan(0)
      for (const id of t.documents) {
        expect(known.has(id), `${t.task}/${t.node}: unknown document id ${id}`).toBe(true)
      }
      // No duplicate ids on one step.
      expect(new Set(t.documents).size, `${t.task}/${t.node}`).toBe(t.documents.length)
    }
  })

  it('the spike landed: form_001 cites the Cooley DE package and IRS Form 15620', () => {
    const byNode = new Map(tagged.filter((t) => t.task === 'form_001').map((t) => [t.node, t.documents]))
    expect(byNode.get('n6')).toEqual(['cooley-incorporation-package-de'])
    expect(byNode.get('n7')).toEqual(['cooley-incorporation-package-de'])
    expect(byNode.get('n8a')).toEqual(['irs-form-15620'])
    expect(byNode.get('n4')).toEqual(['de-formation-instructions'])
  })
})
