// Pure formatting helpers: plain-text tables, score/glyph rendering, and color handling.
// Everything here takes an explicit `color` flag (resolved once in index.ts from picocolors'
// isColorSupported, which already honors NO_COLOR / FORCE_COLOR / !TTY) so tests are
// deterministic regardless of the terminal they run in.
import pc from 'picocolors'
import type { Verdict } from './types.js'

export type Palette = ReturnType<typeof pc.createColors>

export function palette(color: boolean): Palette {
  return pc.createColors(color)
}

export function fmtScore(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return '—'
  return value.toFixed(digits)
}

export type Align = 'l' | 'r'

export interface TableOptions {
  align?: Align[]
  // Zero-based body-row index to tint emerald/green (the leaderboard's top row).
  highlightRow?: number
  color?: boolean
}

// Renders a padded plain-text table. Widths are computed on the raw strings and color is
// applied per-line afterwards, so ANSI codes never skew the padding.
export function renderTable(headers: string[], rows: string[][], options: TableOptions = {}): string {
  const c = palette(options.color ?? false)
  const align = options.align ?? headers.map(() => 'l' as Align)
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)))
  const pad = (cell: string, i: number) =>
    align[i] === 'r' ? cell.padStart(widths[i]) : cell.padEnd(widths[i])
  const line = (cells: string[]) => cells.map((cell, i) => pad(cell ?? '', i)).join('  ').trimEnd()

  const out: string[] = []
  out.push(c.dim(line(headers)))
  out.push(c.dim(widths.map((w) => '-'.repeat(w)).join('  ')))
  rows.forEach((row, idx) => {
    const rendered = line(row)
    out.push(idx === options.highlightRow ? c.green(rendered) : rendered)
  })
  return out.join('\n')
}

// Same glyph vocabulary as the site's access strips (lib/accessGlyphs.ts / lib/checklist.ts).
export const VERDICT_GLYPHS: Record<Verdict['verdict'], string> = {
  full: '✓',
  partial: '~',
  disputed: '!',
  none: '—',
  na: '—',
}

export function glyphFor(verdict: Verdict['verdict'] | null): string {
  return verdict ? VERDICT_GLYPHS[verdict] : '—'
}

// "MCP ✓  CLI ~  API —" — the per-product access summary used by `product` and `pick`.
export function accessLine(access: Record<'MCP' | 'CLI' | 'API', Verdict['verdict'] | null>, color: boolean): string {
  const c = palette(color)
  return (['MCP', 'CLI', 'API'] as const)
    .map((label) => {
      const glyph = glyphFor(access[label])
      const tinted = glyph === '✓' || glyph === '~' ? c.green(glyph) : glyph === '!' ? c.red(glyph) : c.dim(glyph)
      return `${label} ${tinted}`
    })
    .join('  ')
}
