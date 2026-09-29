import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { copyAuditCounts, loadCopyAudit } from '@/lib/copyAudit'

// Gates for the curated copy audit behind /admin (data/copy-audit.json): the schema must hold,
// ids must be unique, every cited source file must exist (with the cited line in range), every
// route must be a route the app actually serves, and every 'keep' must carry its honesty/legal
// reason. The audit is a review list the founder fires asks from — a stale file:line or a dead
// route would send those asks to the wrong place.

const ROOT = process.cwd()

// Every route pattern the app serves, derived from the filesystem: app/**/page.tsx → '/…'.
function collectRoutes(dir: string, prefix: string, out: Set<string>): Set<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collectRoutes(full, `${prefix}/${entry.name}`, out)
    else if (entry.name === 'page.tsx') out.add(prefix === '' ? '/' : prefix)
  }
  return out
}

describe('copy audit (data/copy-audit.json)', () => {
  const audit = loadCopyAudit()
  const routes = collectRoutes(path.join(ROOT, 'app'), '', new Set<string>())

  it('parses against the schema with unique ids', () => {
    const ids = audit.candidates.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cites only files that exist, with the line inside the file', () => {
    for (const c of audit.candidates) {
      const file = path.join(ROOT, c.file)
      expect(fs.existsSync(file), `${c.id}: ${c.file} does not exist`).toBe(true)
      const lines = fs.readFileSync(file, 'utf8').split('\n').length
      expect(c.line, `${c.id}: line ${c.line} beyond ${c.file} (${lines} lines)`).toBeLessThanOrEqual(lines)
    }
  })

  it('cites only routes the app actually serves', () => {
    for (const c of audit.candidates) {
      expect(routes.has(c.route), `${c.id}: route ${c.route} is not an app route`).toBe(true)
    }
  })

  it('every keep carries a reason, and counts add up', () => {
    for (const c of audit.candidates) {
      if (c.suggestion === 'keep') {
        expect(c.why.length, `${c.id}: keep needs its honesty/legal reason`).toBeGreaterThanOrEqual(8)
      }
    }
    const counts = copyAuditCounts(audit)
    expect(counts.cut + counts.tighten + counts.keep).toBe(counts.total)
    expect(counts.total).toBe(audit.candidates.length)
    // The whole point of the audit is finding superfluous copy — it must actually flag some.
    expect(counts.cut).toBeGreaterThan(0)
    expect(counts.tighten).toBeGreaterThan(0)
    // …and it must protect the honesty/legal floor.
    expect(counts.keep).toBeGreaterThan(0)
  })
})
