import type { Part, SharedRecord } from './schema'
import { buildStepComparisons, type StepComparisons } from './step-comparisons'

// Resolve explicit subprocess references and remap their exact comparison scopes.
// No score, route or edge is inherited from a containing process.
export function buildComposedComparisons(record: SharedRecord, records: SharedRecord[]): StepComparisons {
  const result: StepComparisons = {}
  function visit(current: SharedRecord, prefix: string, ancestors: Set<string>) {
    if (ancestors.has(current.id)) return
    const next = new Set(ancestors).add(current.id)
    for (const [scope, comparison] of Object.entries(buildStepComparisons(current))) result[prefix + scope.slice(current.id.length)] = comparison
    function parts(items: Part[], scope: string) {
      for (const part of items) {
        const target = records.find(record => record.id === part.ref)
        if (target) visit(target, `${scope}:${part.id}:ref`, next)
        for (const option of part.options) parts(option.parts, `${scope}:${part.id}:${option.id}`)
      }
    }
    parts(current.parts, prefix)
  }
  visit(record, record.id, new Set())
  return result
}

export function referencedCatalog(record: SharedRecord, records: SharedRecord[]): SharedRecord[] {
  const found = new Map<string, SharedRecord>()
  function visit(current: SharedRecord) {
    if (found.has(current.id)) return
    found.set(current.id, current)
    function parts(items: Part[]) { for (const part of items) {
      const target = records.find(record => record.id === part.ref)
      if (target) visit(target)
      for (const option of part.options) parts(option.parts)
    } }
    parts(current.parts)
  }
  visit(record)
  return [...found.values()]
}
