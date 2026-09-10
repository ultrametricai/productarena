// RSS 2.0 feed over the site's honest change record: derived changelog events (overtakes,
// score moves, launches — see lib/changelog.ts) plus published Arena Notes. Everything here is
// re-derived from committed history files on each build, so the feed can never claim a change
// the changelog page wouldn't also show. Pure functions take plain inputs for tests;
// buildFeedItems() at the bottom is the thin fs-backed assembler the route uses.
import { buildChangelog, type ChangeEvent } from './changelog'
import { loadPublishedNotes } from './notes'
import { SITE_URL } from './site'

export const FEED_MAX_ITEMS = 50

export interface FeedItem {
  title: string
  link: string
  /** ISO timestamp (any offset) — rendered as RFC 822 in the XML. */
  date: string
  description: string
  /** Stable id so readers dedupe across rebuilds. */
  guid: string
}

export function escapeXml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function eventToItem(e: ChangeEvent): FeedItem {
  const arenaLink = `${SITE_URL}/arena/${e.categoryId}`
  switch (e.kind) {
    case 'arena-launched':
      return {
        title: `New arena: ${e.categoryName} (${e.productCount} products)`,
        link: arenaLink,
        date: e.date,
        description: `${e.categoryName} joined the arenas with ${e.productCount} evidence-judged products.`,
        guid: `arena-launched:${e.categoryId}:${e.date}`,
      }
    case 'product-added':
      return {
        title: `${e.productName} added to ${e.categoryName}`,
        link: `${arenaLink}/product/${e.productId}`,
        date: e.date,
        description: `${e.productName} entered the ${e.categoryName} arena and was judged against its user stories.`,
        guid: `product-added:${e.categoryId}:${e.productId}:${e.date}`,
      }
    case 'overtake':
      return {
        title: `${e.productName} overtook ${e.overtookName} in ${e.categoryName}`,
        link: arenaLink,
        date: e.date,
        description: `${e.productName} (${e.productAiEra}) moved ahead of ${e.overtookName} (${e.overtookAiEra}) on Arena Score — driven by re-derived evidence, never editorial.`,
        guid: `overtake:${e.categoryId}:${e.productId}:${e.overtookId}:${e.date}`,
      }
    case 'score-move': {
      const dir = e.delta > 0 ? '+' : ''
      return {
        title: `${e.productName} ${dir}${e.delta} to ${e.to} in ${e.categoryName}`,
        link: `${arenaLink}/product/${e.productId}`,
        date: e.date,
        description: `${e.productName}'s Arena Score moved ${dir}${e.delta} to ${e.to} after evidence re-derivation in ${e.categoryName}.`,
        guid: `score-move:${e.categoryId}:${e.productId}:${e.date}`,
      }
    }
  }
}

export function renderRss(items: FeedItem[]): string {
  const entries = items
    .map((i) => {
      return [
        '    <item>',
        `      <title>${escapeXml(i.title)}</title>`,
        `      <link>${escapeXml(i.link)}</link>`,
        `      <guid isPermaLink="false">${escapeXml(i.guid)}</guid>`,
        `      <pubDate>${new Date(i.date).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(i.description)}</description>`,
        '    </item>',
      ].join('\n')
    })
    .join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>ProductArena — evidence-based rankings changelog</title>',
    `    <link>${escapeXml(SITE_URL)}</link>`,
    `    <atom:link href="${escapeXml(`${SITE_URL}/feed.xml`)}" rel="self" type="application/rss+xml" />`,
    '    <description>Rank overtakes, score moves, new arenas and products — every change re-derived from cited evidence. Scores only move when evidence moves.</description>',
    '    <language>en</language>',
    entries,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}

/** Newest-first merge of changelog events and published Arena Notes, capped. */
export function buildFeedItems(max: number = FEED_MAX_ITEMS): FeedItem[] {
  const events = buildChangelog().events.map(eventToItem)
  const notes: FeedItem[] = loadPublishedNotes().map((n) => ({
    title: `Arena Notes: ${n.title}`,
    link: `${SITE_URL}/notes`,
    date: n.date,
    description: 'A short, citation-backed essay on what moved in the arenas and why.',
    guid: `note:${n.date}`,
  }))
  return [...events, ...notes]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, max)
}
