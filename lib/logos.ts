import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_LOGOS_DIR = () => path.join(process.cwd(), 'public', 'logos')

/**
 * Server-side check for a committed static logo asset. Static export friendly:
 * runs at build time (no client fetch/onError needed) so callers can pick between
 * a real <img> and a text-fallback before any HTML is emitted.
 */
export function hasLogo(id: string, dir: string = DEFAULT_LOGOS_DIR()): boolean {
  return fs.existsSync(path.join(dir, `${id}.png`))
}
