// prebuild step: mirrors data/ -> public/data/ verbatim so Next's static export serves it at
// stable URLs (/data/categories.json, /data/{cat}/rankings.json, etc — see README's "For AI
// agents" section and app/openapi.json/route.ts for the documented shape). public/data/ is a
// build artifact (gitignored) — this script is what (re)creates it, always run before `next
// build` or `next dev` needs it.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'data')
const DEST = path.join(ROOT, 'public', 'data')

fs.rmSync(DEST, { recursive: true, force: true })
fs.cpSync(SRC, DEST, { recursive: true })

console.log(`copy-data: mirrored ${SRC} -> ${DEST}`)
