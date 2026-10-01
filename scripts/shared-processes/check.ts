import { readFileSync, writeFileSync } from 'node:fs'
import { z } from 'zod'
import { loadSharedProcesses } from '../../lib/shared-processes/load'
import { sharedRecordSchema } from '../../lib/shared-processes/schema'

const schema = JSON.stringify(z.toJSONSchema(sharedRecordSchema), null, 2) + '\n'
const file = 'schemas/shared-process.schema.json'
if (process.argv.includes('--write-schema')) writeFileSync(file, schema)
else if (readFileSync(file, 'utf8') !== schema) throw new Error('Regenerate schemas/shared-process.schema.json')
console.log(`Validated ${loadSharedProcesses().length} shared records and their graph references.`)
