import { getCommandPaletteAsset } from '@/lib/command-palette-index'

export const dynamic = 'force-static'

export function GET() {
  const { body } = getCommandPaletteAsset()
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // The URL's version changes with the entries. Revalidate the stable path across
      // deployments as well, including tabs that first open search after a deployment.
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
