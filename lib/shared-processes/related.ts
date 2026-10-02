import type { Part, SharedRecord } from './schema'

function references(parts: Part[]): string[] {
  return parts.flatMap(part => [
    ...(part.kind === 'reference' && part.ref ? [part.ref] : []),
    ...part.options.flatMap(option => references(option.parts)),
  ])
}

// Only explicit outgoing/incoming process references, never intra-process edges
// or guessed topic similarity. Executable reference parts remain in the flow.
export function relatedProcesses(record: SharedRecord, records: SharedRecord[]) {
  const ids = new Set(references(record.parts))
  for (const other of records) if (references(other.parts).includes(record.id)) ids.add(other.id)
  ids.delete(record.id)
  return records.filter(other => ids.has(other.id)).sort((a, b) => a.title.localeCompare(b.title))
}
