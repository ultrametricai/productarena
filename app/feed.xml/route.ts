import { buildFeedItems, renderRss } from '@/lib/feed'

// Static-exported RSS feed (see lib/feed.ts) — prerendered at build like llms.txt/openapi.json.
export const dynamic = 'force-static'

export async function GET() {
  return new Response(renderRss(buildFeedItems()), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
