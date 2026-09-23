// @vitest-environment jsdom
// The per-vendor evidence lines inside ProcessDag's "how these are ranked" expandable (founder
// ask 2026-09-23: SEE the evidence per chip — whether we actually checked the vendor for that
// step). Each mapped story renders a verdict icon (✓ full / ◐ partial / ~ disputed / ✕ none)
// plus the story title LINKED to the product page's judged verdict row — the same
// #story-<storyId> anchor StoryVerdictsTable's rows carry.
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { VendorCiteLine } from '@/components/ProcessDag'
import type { StepVendorScore } from '@/lib/processRankings'

const VENDOR: StepVendorScore = {
  productId: 'best-bank',
  name: 'Best Bank',
  arenaId: 'startup-banking',
  score: 78,
  cites: [
    { storyId: 's-none', storyTitle: 'Export the ledger', weight: 2, verdict: 'none', quality: 0 },
    { storyId: 's-full', storyTitle: 'Open the account via API', weight: 5, verdict: 'full', quality: 0.9 },
    { storyId: 's-na', storyTitle: 'Crypto rails', weight: 1, verdict: 'na', quality: 0 },
    { storyId: 's-partial', storyTitle: 'Issue a virtual card', weight: 3, verdict: 'partial', quality: 0.6 },
    { storyId: 's-disputed', storyTitle: 'Same-day wires', weight: 4, verdict: 'disputed', quality: 0.3 },
  ],
}

const mount = () => {
  const div = document.createElement('div')
  div.innerHTML = renderToString(<VendorCiteLine vendor={VENDOR} />)
  return div
}

describe('VendorCiteLine', () => {
  it('every cite links to the vendor product page at the judged story anchor', () => {
    const el = mount()
    const hrefs = [...el.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/arena/startup-banking/product/best-bank#story-s-full')
    expect(hrefs).toContain('/arena/startup-banking/product/best-bank#story-s-partial')
    expect(hrefs).toContain('/arena/startup-banking/product/best-bank#story-s-disputed')
    expect(hrefs).toContain('/arena/startup-banking/product/best-bank#story-s-none')
    expect(hrefs).toContain('/arena/startup-banking/product/best-bank#story-s-na')
    expect(hrefs).toHaveLength(VENDOR.cites.length)
  })

  it('each link carries its story title and a verdict icon, strongest verdicts first', () => {
    const el = mount()
    const links = [...el.querySelectorAll('a')]
    expect(links.map((a) => a.textContent)).toEqual([
      'Open the account via API', // full
      'Issue a virtual card', // partial
      'Same-day wires', // disputed
      'Export the ledger', // none
      'Crypto rails', // na
    ])
    const text = el.textContent ?? ''
    expect(text).toContain('✓')
    expect(text).toContain('◐')
    expect(text).toContain('~')
    expect(text).toContain('✕')
    // Tooltips name the verdict and the destination — the founder's "did we actually check
    // this vendor here" question answered per story.
    expect(links[0].getAttribute('title')).toContain('full')
    expect(links[0].getAttribute('title')).toContain('Best Bank')
    expect(links[3].getAttribute('title')).toContain('not delivered')
    expect(links[4].getAttribute('title')).toContain('n/a')
  })
})
