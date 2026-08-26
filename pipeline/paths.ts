import fs from 'node:fs'
import path from 'node:path'
import type { z } from 'zod'

export const ROOT = path.resolve(__dirname, '..')
export const DATA_DIR = path.join(ROOT, 'data')
export const CACHE_DIR = path.join(ROOT, 'pipeline', 'cache')

export function readJson<T>(schema: z.ZodType<T>, file: string): T {
  return schema.parse(JSON.parse(fs.readFileSync(file, 'utf8')))
}

export function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
}
