import { readFileSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { sharedRecordSchema } from './schema'

export function sharedSchemaJson() {
  return JSON.stringify(z.toJSONSchema(sharedRecordSchema), null, 2) + '\n'
}

export function loadSharedSchema(root = process.cwd()) {
  const expected = sharedSchemaJson()
  if (readFileSync(path.join(root, 'schemas/shared-process.schema.json'), 'utf8') !== expected) {
    throw new Error('Regenerate schemas/shared-process.schema.json')
  }
  return JSON.parse(expected)
}
