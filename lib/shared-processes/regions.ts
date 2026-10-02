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
    options: part.options.filter(option => option.id === 'default' || isGeographicOption(option)).map(option => {
      const context = option.metadata.context as { countries?: unknown } | undefined
      const source = option.id === 'default' ? [record.metadata.geoScope] : context?.countries
      const countries = Array.isArray(source) ? source.filter((country): country is string => typeof country === 'string' && /^[a-z]{2}$/i.test(country)).map(country => country.toUpperCase()) : []
      return { id: option.id, title: option.title, countries }
    }),
  }
}
