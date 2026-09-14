import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadGiftDraft, loadGifts, parseGiftList, parsePrDraft, parseProductCell } from '@/lib/gifts'

// The gift program parser behind the unlinked /gifts founder review page: it must read the
// REAL drafts/outreach/ tree (the page renders at build time from these exact files) and
// degrade to nothing — never throw — when files are missing or malformed.

const OUTREACH = path.join(process.cwd(), 'drafts', 'outreach')

describe('parseProductCell', () => {
  it('splits "product (arena, standing)"', () => {
    expect(parseProductCell('crawl4ai (web-scraping, 4/6 @ 30.7)')).toEqual({
      product: 'crawl4ai',
      arena: 'web-scraping',
      standing: '4/6 @ 30.7',
    })
  })

  it('keeps a multi-word product name intact', () => {
    expect(parseProductCell('nix docs (package-managers, 6/6 @ 22.8)').product).toBe('nix docs')
  })

  it('degrades to the raw cell when the shape is unexpected', () => {
    expect(parseProductCell('just-a-name')).toEqual({ product: 'just-a-name', arena: '', standing: '' })
  })
})

describe('parsePrDraft', () => {
  it('reads both heading dialects and strips backticks off the title', () => {
    const suggested = parsePrDraft('# Suggested PR title\n\n`docs: add llms.txt`\n\n# Suggested PR body\n\nHello.\n')
    expect(suggested).toEqual({ title: 'docs: add llms.txt', body: 'Hello.' })
    const plain = parsePrDraft('# PR title\n\nAdd llms.txt\n\n# PR body (verbatim)\n\nBody text.\n\n# The file\n\nnot the body\n')
    expect(plain).toEqual({ title: 'Add llms.txt', body: 'Body text.' })
  })

  it('returns nulls when the sections are absent', () => {
    expect(parsePrDraft('just some notes')).toEqual({ title: null, body: null })
  })
})

describe('loadGifts against the real drafts/outreach tree', () => {
  const gifts = loadGifts()
  const byProduct = new Map(gifts.map((g) => [g.product, g]))

  it('parses the full ranked list in rank order', () => {
    expect(gifts.length).toBeGreaterThanOrEqual(18)
    expect(gifts.map((g) => g.rank)).toEqual(gifts.map((_, i) => i + 1))
    for (const g of gifts) {
      expect(g.product, `rank ${g.rank} has no product`).not.toBe('')
      expect(g.arena, `rank ${g.rank} (${g.product}) has no arena`).not.toBe('')
      expect(g.targetRepo).not.toBe('')
      expect(g.gift).not.toBe('')
    }
  })

  it('crawl4ai is SENT with the live PR URL (status.json)', () => {
    const crawl4ai = byProduct.get('crawl4ai')!
    expect(crawl4ai.status.state).toBe('sent')
    expect(crawl4ai.status.url).toBe('https://github.com/unclecode/crawl4ai/pull/2267')
    expect(crawl4ai.draft?.title).toBe('docs: add llms.txt for docs.crawl4ai.com')
    expect(crawl4ai.draft?.artifact?.file).toBe('llms.txt')
  })

  it('fully drafted vendors are "drafted" with a verbatim body + artifact', () => {
    for (const product of ['vllm', 'homebrew', 'docusaurus', 'gitea']) {
      const g = byProduct.get(product)!
      expect(g.status.state, product).toBe('drafted')
      expect(g.draft?.body, `${product} has no verbatim body`).toBeTruthy()
      expect(g.draft?.artifact, `${product} has no artifact`).toBeTruthy()
      expect(g.draft?.notes, `${product} has no NOTES.md`).toBeTruthy()
    }
    // linear is an issue-shaped gift (docs source closed): body from issue-body.md, title
    // from its review-comment "Suggested title", artifact = the passing cert report.
    const linear = byProduct.get('linear')!
    expect(linear.status.state).toBe('drafted')
    expect(linear.draft?.bodyFile).toBe('issue-body.md')
    expect(linear.draft?.title).toContain('Agent-Ready')
    expect(linear.draft?.artifact?.file).toBe('cert-report.json')
  })

  it('ranked candidates without a vendor dir are listed-only', () => {
    for (const product of ['langfuse', 'trivy', 'pnpm', 'nix docs']) {
      const g = byProduct.get(product)!
      expect(g.status.state, product).toBe('listed')
      expect(g.draft, product).toBeNull()
    }
  })
})

describe('tolerance', () => {
  it('missing outreach dir yields an empty program, never a throw', () => {
    expect(loadGifts(path.join(OUTREACH, 'does-not-exist'))).toEqual([])
  })

  it('missing vendor dir yields a null draft', () => {
    expect(loadGiftDraft(OUTREACH, 'does-not-exist')).toBeNull()
  })

  it('parseGiftList ignores non-ranked rows and junk', () => {
    expect(parseGiftList('# nothing here\n| Draft | Arena |\n| --- | --- |\n')).toEqual([])
  })
})
