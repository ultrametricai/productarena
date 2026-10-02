// @vitest-environment jsdom
import fs from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LawFirmsRankingPage from '@/app/rankings/law-firms/page'
import { loadCategory } from '@/lib/data'
import { VENDOR_GEO_COUNTRIES, VENDOR_GEO_STATUS_META, vendorGeoFor } from '@/lib/vendorGeo'
import { ordinal } from '@/lib/ordinal'

const ARENA_ID = 'startup-law-firms'

// The page is a VIEW of the judged arena: every assertion below compares the render against the
// COMMITTED data (rankings.json leaderboard order and values, jurisdictions/vendor-geo.json
// rows) — nothing recomputed, nothing invented.
describe('startup law firms ranking page', () => {
  const data = loadCategory(ARENA_ID)
  const leaderboard = data.rankings.leaderboard
  const nameOf = (productId: string) => data.products.find((p) => p.id === productId)!.name

  it('renders every firm in the committed leaderboard order, rank = committed position', () => {
    const { container } = render(<LawFirmsRankingPage />)
    expect(screen.getByRole('heading', { level: 1, name: /Startup law firms — ranked/ })).toBeDefined()

    const bodyRows = [...container.querySelectorAll('tbody tr')]
    expect(bodyRows.length).toBe(leaderboard.length)

    bodyRows.forEach((tr, i) => {
      const cells = tr.querySelectorAll('td')
      // Rank is the committed position, 1-based, read as an ordinal (founder 2026-10-02) —
      // never re-sorted.
      expect(cells[0].textContent).toBe(ordinal(i + 1))
      // The firm cell carries the committed product's name, linking to its product page.
      const link = cells[1].querySelector('a')
      expect(link?.textContent).toContain(nameOf(leaderboard[i].productId))
      expect(link?.getAttribute('href')).toBe(`/arena/${ARENA_ID}/product/${leaderboard[i].productId}`)
    })
  })

  it('every firm link resolves to a real product id in the committed arena', () => {
    const { container } = render(<LawFirmsRankingPage />)
    const productIds = new Set(data.products.map((p) => p.id))
    const links = [...container.querySelectorAll(`a[href^="/arena/${ARENA_ID}/product/"]`)]
    expect(links.length).toBeGreaterThan(0)
    for (const a of links) {
      const id = a.getAttribute('href')!.split('/').pop()!
      expect(productIds.has(id), id).toBe(true)
    }
    // The arena link and the IP-lens link resolve to real pages.
    expect(container.querySelector(`a[href="/arena/${ARENA_ID}"]`)).not.toBeNull()
    expect(container.querySelector('a[href="/icp/ip-focused"]')).not.toBeNull()
    expect(fs.existsSync(path.join(process.cwd(), 'app', 'icp', '[type]', 'page.tsx'))).toBe(true)
  })

  it('renders only committed numbers: every Overall cell equals the committed aiEra', () => {
    const { container } = render(<LawFirmsRankingPage />)
    const bodyRows = [...container.querySelectorAll('tbody tr')]
    bodyRows.forEach((tr, i) => {
      const committed = leaderboard[i].aiEra
      const cell = tr.querySelectorAll('td')[2]
      if (committed === null) {
        expect(cell.textContent).toBe('n/a')
      } else {
        expect(cell.textContent).toBe(`${committed.toFixed(0)}/100`)
      }
    })
  })

  it('spot-pins Cooley: committed rank and committed scores, verbatim', () => {
    const idx = leaderboard.findIndex((e) => e.productId === 'cooley')
    expect(idx).toBeGreaterThanOrEqual(0)
    const cooley = leaderboard[idx]

    const { container } = render(<LawFirmsRankingPage />)
    const tr = [...container.querySelectorAll('tbody tr')][idx]
    const cells = tr.querySelectorAll('td')
    expect(cells[0].textContent).toBe(ordinal(idx + 1))
    expect(cells[1].textContent).toContain('Cooley')
    expect(cells[2].textContent).toBe(`${cooley.aiEra!.toFixed(0)}/100`)
    // The IP-protection dimension column (rank, firm, overall, venture-financing, formation,
    // ip-protection, …) shows Cooley's committed theme score.
    expect(cells[5].textContent).toBe(`${cooley.themeScores['ip-protection']!.toFixed(0)}/100`)
  })

  it('country marks match the committed vendor-geo rows — canonical order, honest statuses', () => {
    const { container } = render(<LawFirmsRankingPage />)
    const bodyRows = [...container.querySelectorAll('tbody tr')]
    bodyRows.forEach((tr, i) => {
      const committed = vendorGeoFor(leaderboard[i].productId)
      const cells = tr.querySelectorAll('td')
      const marks = [...cells[cells.length - 1].querySelectorAll('span[title]')]
      expect(marks.length, leaderboard[i].productId).toBe(committed.length)
      marks.forEach((mark, j) => {
        const row = committed[j]
        // Canonical US→UK→IN→DE→FR order, the committed status's glyph, and the committed
        // note surfaced in the tooltip — never an invented availability.
        expect((VENDOR_GEO_COUNTRIES as readonly string[]).includes(row.country)).toBe(true)
        expect(mark.textContent).toContain(row.country)
        expect(mark.textContent).toContain(VENDOR_GEO_STATUS_META[row.status].glyph)
        expect(mark.getAttribute('title')).toContain(VENDOR_GEO_STATUS_META[row.status].label)
        expect(mark.getAttribute('title')).toContain(row.note)
      })
    })
  })

  it('the IP lens section reorders by the committed ip-protection score, ties on committed rank', () => {
    const { container } = render(<LawFirmsRankingPage />)
    const items = [...container.querySelectorAll('section[aria-label="IP lens ordering"] ol li')]
    expect(items.length).toBe(leaderboard.length)

    const expected = leaderboard
      .map((e, i) => ({ id: e.productId, ip: e.themeScores['ip-protection'] ?? null, rank: i }))
      .sort((a, b) => {
        if (a.ip === null && b.ip === null) return a.rank - b.rank
        if (a.ip === null) return 1
        if (b.ip === null) return -1
        return b.ip - a.ip || a.rank - b.rank
      })
    items.forEach((li, i) => {
      expect(li.textContent, `ip position ${i + 1}`).toContain(nameOf(expected[i].id))
      if (expected[i].ip !== null) expect(li.textContent).toContain(expected[i].ip!.toFixed(0))
    })
  })
})
