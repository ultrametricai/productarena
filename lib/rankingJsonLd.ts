// Shared schema.org ItemList builder for the /rankings/* global ranking pages — the same
// SoftwareApplication + additionalProperty shape the arena pages emit (see
// app/arena/[category]/page.tsx's arenaJsonLd and its "deliberately no aggregateRating"
// honesty note: our custom metrics are exposed as honestly-labeled PropertyValue entries,
// never faked star ratings). Pure (no fs) so any server page can call it.
import { SITE_URL } from './site'

export interface RankingJsonLdItem {
  name: string
  /** Site-relative product URL, e.g. /arena/ai-coding/product/cursor */
  path: string
  /** The arena the row is scored in (schema.org applicationCategory). */
  applicationCategory: string
  /** Honestly-labeled custom metrics; null values are kept (null = unscored, never zero). */
  properties: Record<string, number | string | null>
}

// Capped so a 350-row ranking doesn't ship a 100KB JSON-LD blob: crawlers get the top of the
// list (the part rankings are cited for), the full table is in the HTML right below.
export const RANKING_JSONLD_MAX_ITEMS = 50

export function rankingJsonLd(name: string, description: string, items: RankingJsonLdItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    itemListElement: items.slice(0, RANKING_JSONLD_MAX_ITEMS).map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: item.name,
        url: `${SITE_URL}${item.path}`,
        applicationCategory: item.applicationCategory,
        additionalProperty: Object.entries(item.properties).map(([key, value]) => ({
          '@type': 'PropertyValue',
          name: key,
          value,
        })),
      },
    })),
  }
}
