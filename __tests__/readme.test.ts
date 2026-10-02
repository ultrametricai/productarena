import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// README surface pins (founder batch 2026-10-02): the contribution-guide row, the situations
// surface, the single structural overview, the arena-index rename, and the not-yet-live
// Discord slot. These are source pins (the README is data here), the same pragmatic pattern
// as app/__tests__/layout-footer.test.ts.

const ROOT = path.join(__dirname, '..')
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8')
const contributing = fs.readFileSync(path.join(ROOT, 'CONTRIBUTING.md'), 'utf8')

describe('README.md (founder batch 2026-10-02)', () => {
  it('carries the contribution-guide row near the top, each link resolving to a real CONTRIBUTING anchor', () => {
    const row = readme.indexOf('**Contribution guides:**')
    expect(row).toBeGreaterThan(-1)
    // Near the top: before the Start here section.
    expect(row).toBeLessThan(readme.indexOf('## Start here'))
    // The four guides, links only, each with a matching anchor in CONTRIBUTING.md.
    for (const anchor of ['add-your-vendor', 'add-a-process', 'add-a-jurisdiction', 'add-an-open-module']) {
      expect(readme).toContain(`(CONTRIBUTING.md#${anchor})`)
      expect(contributing, `CONTRIBUTING.md is missing <a id="${anchor}">`).toContain(`<a id="${anchor}"></a>`)
    }
  })

  it('surfaces situations: a Start-here row and a Processes-pillar paragraph, no counts', () => {
    // The reactive layer links both its live index and its repo doctrine.
    expect(readme).toContain('https://ultrametric.ai/situations')
    expect(readme).toContain('processes/SITUATIONS.md')
    // The pillar paragraph names the trigger + urgency model.
    const para = readme.indexOf('**Situations.**')
    expect(para).toBeGreaterThan(-1)
    const paraText = readme.slice(para, readme.indexOf('\n\n', para))
    expect(paraText).toContain('trigger')
    expect(paraText).toContain('`hours` / `days` / `weeks`')
    // No counts: the number of situations is corpus-owned (processes/SITUATIONS.md), never a
    // hand-maintained README claim.
    expect(paraText).not.toMatch(/\b12\b/)
  })

  it('keeps ONE structural overview: the Map owns structure, Start here stays tasks', () => {
    expect(readme).toContain('## Map of the repo')
    expect(readme).toContain('The single structural overview')
    // Start here cross-links the Map instead of duplicating it.
    const startHere = readme.slice(readme.indexOf('## Start here'), readme.indexOf('## Processes'))
    expect(startHere).toContain('[Map of the repo](#map-of-the-repo)')
  })

  it('names the arena table for what it shows (renamed from "The arenas", no counts in the heading)', () => {
    expect(readme).toContain('## Arena index — every market we rank')
    expect(readme).not.toContain('## The arenas')
  })

  it('routes developer setup to CONTRIBUTING instead of carrying its own quickstart block', () => {
    // The README is for people consuming the open repo; the dev commands live in one place.
    expect(readme).not.toContain('## Local development')
    expect(readme).toContain('(./CONTRIBUTING.md#local-setup)')
    expect(contributing).toContain('## Local setup')
    expect(contributing).toContain('pnpm test')
  })

  it('keeps the Discord slot commented out until the founder supplies the invite URL', () => {
    expect(readme).toContain('TODO(founder): drop the Discord invite URL here')
    // No invented invite anywhere in the README.
    expect(readme).not.toContain('discord.gg')
  })
})
