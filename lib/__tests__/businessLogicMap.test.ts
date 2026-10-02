import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadBusinessLogicMap, moduleReadmeHref, modulesForProcess } from '../businessLogicMap'
import { loadProcesses } from '../processes'

// Totality gate for the business-logic ↔ process map (founder 2026-10-02): every mapped module
// id is a real lib/openstartup file, every mapped process id exists in the corpus, and every
// chip target (label/anchor) resolves to a real heading in business-logic/README.md. The map is
// curation; this test makes sure the curation can never point at nothing.

const ROOT = path.resolve(__dirname, '..', '..')
const README = fs.readFileSync(path.join(ROOT, 'business-logic', 'README.md'), 'utf8')

// GitHub's heading slug (github-slugger behavior for these headings): lowercase, strip
// everything but letters/numbers/spaces/hyphens, spaces → hyphens. The registry anchors are
// validated against the README headings through this, so a reworded heading fails here instead
// of 404ing the chip.
function githubSlug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N} -]/gu, '')
    .replace(/ /g, '-')
}

describe('processes/business-logic-map.json totality', () => {
  const map = loadBusinessLogicMap()
  const processIds = new Set(loadProcesses().map((t) => t.id))

  it('maps at least the founder-named module families', () => {
    for (const id of ['deFranchiseTax', 'election83b', 'deadlines', 'capTable', 'vesting', 'round', 'antiDilution', 'waterfall', 'qsbs', 'payrollTax', 'rdCredit', 'runway']) {
      expect(map[id], `module ${id} missing from the map`).toBeDefined()
    }
  })

  it('every module id is the basename of a real lib/openstartup file', () => {
    for (const [id, m] of Object.entries(map)) {
      expect(m.file, `module ${id}: file/id mismatch`).toBe(`lib/openstartup/${id}.ts`)
      expect(fs.existsSync(path.join(ROOT, m.file)), `module ${id}: ${m.file} does not exist`).toBe(true)
    }
  })

  it('every mapped process id exists in the corpus, with no duplicates per module', () => {
    for (const [id, m] of Object.entries(map)) {
      expect(new Set(m.processes).size, `module ${id} lists a process twice`).toBe(m.processes.length)
      for (const pid of m.processes) {
        expect(processIds.has(pid), `module ${id} maps unknown process ${pid}`).toBe(true)
      }
    }
  })

  it('every label is a real README heading and every anchor is its GitHub slug', () => {
    for (const [id, m] of Object.entries(map)) {
      expect(README.includes(`### ${m.label}`), `module ${id}: no "### ${m.label}" heading in business-logic/README.md`).toBe(true)
      expect(githubSlug(m.label), `module ${id}: anchor drifted from the heading slug`).toBe(m.anchor)
    }
  })

  it('modulesForProcess resolves the franchise-tax wiring (process + delinquency situation)', () => {
    const tax = modulesForProcess('tax_001').map((c) => c.id)
    expect(tax).toContain('deFranchiseTax')
    expect(tax).toContain('deadlines')
    const cure = modulesForProcess('sit_010').map((c) => c.id)
    expect(cure).toContain('deFranchiseTax')
    // Chip hrefs deep-link into the README on GitHub.
    expect(modulesForProcess('tax_001')[0].href).toBe(moduleReadmeHref(loadBusinessLogicMap()[modulesForProcess('tax_001')[0].id].anchor))
    expect(moduleReadmeHref('cap-table')).toMatch(/^https:\/\/github\.com\/.+\/business-logic\/README\.md#cap-table$/)
    // Unmapped tasks render nothing.
    expect(modulesForProcess('ops_001')).toEqual([])
  })
})
