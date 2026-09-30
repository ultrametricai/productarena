import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { REPO } from '@/lib/site'

// The sitewide footer lives inline in RootLayout — an async server component that fetches the
// GitHub star count and builds the full search index, and whose root element is <html> (invalid
// to nest inside a jsdom render container) — so these pins read the source, the same pragmatic
// pattern as the other source-asserting tests in this repo.
const layoutSrc = readFileSync(path.join(__dirname, '..', 'layout.tsx'), 'utf8')

describe('sitewide footer (app/layout.tsx)', () => {
  it('carries the GitHub repo link with the mark + "GitHub ↗" label (founder 2026-09-30)', () => {
    // The footer link row is everything after the <footer element.
    const footer = layoutSrc.slice(layoutSrc.indexOf('<footer'))
    expect(footer).toContain('GitHub ↗')
    // Same destination as the header's star chip: the open startup repo, via the single
    // REPO constant (lib/site.ts) — never a hardcoded duplicate.
    expect(footer).toContain('https://github.com/${REPO}')
    expect(REPO).toBe('ultrametricai/ultrametric')
    // The GitHub mark (the 16×16 octocat path) renders next to the label.
    expect(footer).toContain('M8 0C3.58 0 0 3.58 0 8c0 3.54')
    // External link hygiene on the GitHub anchor itself.
    const anchorStart = footer.lastIndexOf('<a', footer.indexOf('GitHub ↗'))
    const anchor = footer.slice(anchorStart, footer.indexOf('GitHub ↗'))
    expect(anchor).toContain('target="_blank"')
    expect(anchor).toContain('rel="noopener noreferrer"')
  })
})
