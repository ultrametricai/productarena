import { describe, expect, it } from 'vitest'
import sitemap from '@/app/sitemap'
import { SITE_URL } from '@/lib/site'

describe('sitemap registration', () => {
  const urls = new Set(sitemap().map((e) => e.url))

  it('lists the ported company pages, including the /get-started CLI/MCP product page', () => {
    for (const path of ['/company', '/tos', '/get-started']) {
      expect(urls.has(`${SITE_URL}${path}`)).toBe(true)
    }
  })

  it('lists the /situations index and keeps the situation detail pages at /processes/<slug> (founder 2026-10-02)', () => {
    expect(urls.has(`${SITE_URL}/situations`)).toBe(true)
    // Detail URLs stay stable — the index moved, the pages did not.
    expect(urls.has(`${SITE_URL}/processes/respond-to-a-lawsuit`)).toBe(true)
  })

  it('keeps the root entry for the landing homepage (served at / by the worker)', () => {
    expect(urls.has(SITE_URL)).toBe(true)
    // /home is deliberately unlisted — its canonical is the root.
    expect(urls.has(`${SITE_URL}/home`)).toBe(false)
  })
})
