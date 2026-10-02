import type { Option, SharedRecord } from './schema'

export function isGeographicOption(option: Option) {
  const context = option.metadata.context
  return !!context && typeof context === 'object' && !Array.isArray(context)
    && (context as Record<string, unknown>).kind === 'geo'
}

export function regionalDecision(record: SharedRecord) {
  const decisions = record.parts.filter(part => part.kind === 'decision' && part.options.some(isGeographicOption))
  // No inferred propagation across multiple independent decisions.
  if (decisions.length !== 1 || !decisions[0].options.some(option => option.id === 'default')) return undefined
  const part = decisions[0]
  return { scope: `${record.id}:${part.id}`, title: part.title ?? part.id,
    options: part.options.filter(option => option.id === 'default' || isGeographicOption(option)).map(option => ({ id: option.id, title: option.title })),
  }
}
