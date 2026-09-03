import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_SCREENSHOTS_DIR = () => path.join(process.cwd(), 'public', 'screenshots')

export type ScreenshotKind = 'home' | 'docs'

export interface Screenshot {
  kind: ScreenshotKind
  /** App-relative public path (no basePath) — wrap with lib/site.ts's withBase() in <img> src. */
  path: string
  /** File mtime, i.e. when the pipeline captured the shot. */
  capturedAt: Date
}

// Home first: the showcase gallery renders these in order.
const KINDS: ScreenshotKind[] = ['home', 'docs']
// The screenshots stage writes webp; png kept as an accepted fallback per convention.
const EXTENSIONS = ['webp', 'png'] as const

/**
 * Server-side check for committed showcase screenshots, mirroring lib/logos.ts's hasLogo():
 * a plain fs check at build time (static export friendly, no client fetch/onError). Returns
 * the available shots for a product in display order — empty array when none exist.
 */
export function hasScreenshots(productId: string, dir: string = DEFAULT_SCREENSHOTS_DIR()): Screenshot[] {
  const found: Screenshot[] = []
  for (const kind of KINDS) {
    for (const ext of EXTENSIONS) {
      const file = `${productId}-${kind}.${ext}`
      const full = path.join(dir, file)
      let stat: fs.Stats
      try {
        stat = fs.statSync(full)
      } catch {
        continue
      }
      found.push({ kind, path: `/screenshots/${file}`, capturedAt: stat.mtime })
      break // webp wins over png for the same kind
    }
  }
  return found
}
