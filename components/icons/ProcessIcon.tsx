// The house process-icon set: hand-authored geometric glyphs replacing the emoji picks in
// lib/processIcons.ts (founder ask 2026-09-30: "make our own custom geometric and colorized
// icons — use the current emoji picks as a semantic guide but make our unique icon set").
//
// Design language: a 24×24 grid, 1.7px strokes, round caps/joins, Feather/Lucide-grade
// simplicity but ours — every path written by hand in this file, NO external icon libraries.
// Duotone colorization: each render gets a per-AREA accent hue (lib/processIcons.ts bakes the
// hue into the icon token) with two tones — a bright stroke for the primary form and a deep
// tone for secondary detail — tuned for the zinc-900 background family. Every glyph carries its
// guiding emoji (the old curated pick) as fallback/alias data and a human name for the gallery
// (/experiments/icons) and tooltips.
//
// Pure and client-safe (no hooks, no node builtins): rendered from server pages and client
// components alike. The ONLY consumer-facing entry point is components/IconChip.tsx — it
// detects the `pi:` token scheme from lib/processIcons.ts and renders this component; emoji
// strings keep rendering as text. Coverage is enforced by tests: every live process/phase/chain
// token must name a glyph in GLYPHS (lib/__tests__/processIcons.test.ts) and every glyph must
// render valid SVG (components/__tests__/ProcessIcon.test.tsx).

import type { IconHue } from '@/lib/processIcons'

// Two tones per hue family (house palette, tailwind values): strong = the 400-level accent
// stroke, soft = the 700-level secondary tone. Both read on zinc-900.
export const ICON_HUES: Record<IconHue, { strong: string; soft: string }> = {
  emerald: { strong: '#34d399', soft: '#047857' },
  amber: { strong: '#fbbf24', soft: '#b45309' },
  sky: { strong: '#38bdf8', soft: '#0369a1' },
  violet: { strong: '#a78bfa', soft: '#6d28d9' },
  fuchsia: { strong: '#e879f9', soft: '#a21caf' },
  orange: { strong: '#fb923c', soft: '#c2410c' },
  zinc: { strong: '#a1a1aa', soft: '#52525b' },
}

// One drawable: a path (p), circle (c: [cx, cy, r]), or rect (r: [x, y, w, h, rx]). Strokes by
// default in the strong tone; t: 'soft' drops to the secondary tone; f: true fills instead of
// stroking (solid dots in strong, translucent washes in soft).
type Shape = {
  p?: string
  c?: [number, number, number]
  r?: [number, number, number, number, number?]
  t?: 'soft'
  f?: boolean
}

export type Glyph = { name: string; emoji: string; shapes: Shape[] }

const G = (name: string, emoji: string, shapes: Shape[]): Glyph => ({ name, emoji, shapes })

// ---------- The glyph set ----------
// Grouped roughly by the corpus areas that use them; ids are concept names, never task ids —
// the task→glyph mapping lives in lib/processIcons.ts (same concept = same glyph everywhere).

export const GLYPHS: Record<string, Glyph> = {
  // --- Starting up / idea ---
  egg: G('Hatching egg', '🐣', [
    { p: 'M12 3.2c-3.5 0-6.3 4-6.3 8.8a6.3 6.3 0 0 0 12.6 0c0-4.8-2.8-8.8-6.3-8.8Z' },
    { p: 'M6 13l2.6-1.4 2.3 1.6 2.3-1.6 2.3 1.6 2.5-1.4', t: 'soft' },
  ]),
  flask: G('Test flask', '🧪', [
    { p: 'M9.6 3.2h4.8' },
    { p: 'M10.2 3.2v5L5.9 16.4a2 2 0 0 0 1.8 2.9h8.6a2 2 0 0 0 1.8-2.9L13.8 8.2v-5' },
    { p: 'M7.6 13.4h8.8', t: 'soft' },
    { c: [10.6, 16.2, 0.9], t: 'soft', f: true },
  ]),
  bulb: G('Idea bulb', '💡', [
    { p: 'M12 2.8a6 6 0 0 0-3.4 10.9c.8.6 1.4 1.5 1.4 2.5h4c0-1 .6-1.9 1.4-2.5A6 6 0 0 0 12 2.8Z' },
    { p: 'M10 19.4h4M10.8 21.6h2.4', t: 'soft' },
    { p: 'M10.4 8.4c.3-.7 1-1.2 1.6-1.3', t: 'soft' },
  ]),
  'pen-nib': G('Fountain pen', '🖋️', [
    { p: 'M16.2 3.8a2.3 2.3 0 0 1 3.2 3.2L8 18.4l-4.6 1.4L4.8 15.2Z' },
    { p: 'M14.4 5.6l3.2 3.2', t: 'soft' },
    { p: 'M11.6 20.6h8.8', t: 'soft' },
  ]),
  magnet: G('Magnet', '🧲', [
    { p: 'M8.6 3.6v6.2a3.4 3.4 0 0 0 6.8 0V3.6h4.2v6.2a7.6 7.6 0 0 1-15.2 0V3.6Z' },
    { p: 'M4.4 7h4.2M15.4 7h4.2', t: 'soft' },
    { p: 'M9.6 19.2 8.8 21.4M14.4 19.2l.8 2.2', t: 'soft' },
  ]),

  // --- Formation / brand / domain ---
  columns: G('Civic columns', '🏛️', [
    { p: 'M4 8.6 12 3.4l8 5.2' },
    { p: 'M3.6 20.6h16.8' },
    { p: 'M6.6 11.6v6M12 11.6v6M17.4 11.6v6', t: 'soft' },
    { p: 'M5 8.6h14', t: 'soft' },
  ]),
  bricks: G('Brick wall', '🧱', [
    { r: [3.4, 5.4, 17.2, 13.2, 1] },
    { p: 'M3.4 9.8h17.2M3.4 14.2h17.2', t: 'soft' },
    { p: 'M9 5.4v4.4M15 5.4v4.4M12 9.8v4.4M6.4 14.2v4.4M17.6 14.2v4.4', t: 'soft' },
  ]),
  butterfly: G('Butterfly', '🦋', [
    { p: 'M12 8.4C10.8 5.8 8.4 4.2 6 4.6c-3 .5-3 5.4 0 7.4-3 2-3 6.4 0 7 2.4.5 4.8-1.6 6-4.2' },
    { p: 'M12 8.4c1.2-2.6 3.6-4.2 6-3.8 3 .5 3 5.4 0 7.4 3 2 3 6.4 0 7-2.4.5-4.8-1.6-6-4.2' },
    { p: 'M12 7.2v9.6', t: 'soft' },
    { p: 'M10.6 4.4 12 6.6l1.4-2.2', t: 'soft' },
  ]),
  'id-card': G('ID card', '🆔', [
    { r: [2.8, 5.4, 18.4, 13.2, 2] },
    { c: [7.8, 10.6, 1.7], t: 'soft' },
    { p: 'M5.4 15.6c.5-1.3 1.4-2 2.4-2s1.9.7 2.4 2', t: 'soft' },
    { p: 'M13.4 9.6h5M13.4 12.6h5M13.4 15.6h3.4', t: 'soft' },
  ]),
  map: G('Folded map', '🗺️', [
    { p: 'M3.4 6.2 9 4l6 2.2L20.6 4v13.8L15 20l-6-2.2-5.6 2.2Z' },
    { p: 'M9 4v13.8M15 6.2V20', t: 'soft' },
    { c: [12, 11, 1], t: 'soft', f: true },
  ]),
  mailbox: G('Mailbox', '📬', [
    { p: 'M3.4 16.6v-5a5 5 0 0 1 5-5h10.2a2 2 0 0 1 2 2v8Z' },
    { p: 'M11.4 6.6a5 5 0 0 1 2 4v6', t: 'soft' },
    { p: 'M16.4 6.6V3.4h3', t: 'soft' },
    { p: 'M8.4 20.6v-4', t: 'soft' },
  ]),
  postbox: G('Postbox', '📮', [
    { p: 'M7 20.6V7a5 5 0 0 1 10 0v13.6' },
    { p: 'M9.6 8.2h4.8', t: 'soft' },
    { p: 'M5.4 20.6h13.2' },
    { p: 'M7 12.4h10', t: 'soft' },
  ]),
  palette: G('Paint palette', '🎨', [
    { p: 'M12 3.4a8.6 8.6 0 1 0 0 17.2c1.6 0 2-1 1.4-2-.8-1.4 0-3 1.8-3h2.2a3.2 3.2 0 0 0 3.2-3.4A8.7 8.7 0 0 0 12 3.4Z' },
    { c: [8, 9, 1.1], t: 'soft', f: true },
    { c: [13, 7.6, 1.1], t: 'soft', f: true },
    { c: [7.4, 13.6, 1.1], t: 'soft', f: true },
  ]),
  swatches: G('Color swatches', '🌈', [
    { r: [3.4, 3.8, 17.2, 4.2, 2.1] },
    { r: [3.4, 9.9, 13, 4.2, 2.1], t: 'soft' },
    { r: [3.4, 16, 8.8, 4.2, 2.1] },
    { c: [19.4, 18.1, 1.1], t: 'soft', f: true },
  ]),
  search: G('Magnifier', '🔍', [
    { c: [10.8, 10.8, 6.4] },
    { p: 'M15.5 15.5 21 21' },
    { p: 'M7.8 8.4a3.9 3.9 0 0 1 2.7-1.6', t: 'soft' },
  ]),
  globe: G('Globe grid', '🌐', [
    { c: [12, 12, 8.6] },
    { p: 'M3.4 12h17.2', t: 'soft' },
    { p: 'M12 3.4c-5.6 4.8-5.6 12.4 0 17.2 5.6-4.8 5.6-12.4 0-17.2Z', t: 'soft' },
  ]),
  world: G('World', '🌍', [
    { c: [12, 12, 8.6] },
    { p: 'M4.2 9.4c1.8 1 3 2.8 5.2 2.4 2-.4 2.2 1.6 1.2 2.8-1 1.2.2 3 1.8 2.8', t: 'soft' },
    { p: 'M14.2 3.8c-.6 1.6.4 3.4 2.4 3.4 1.8 0 2.8 1.2 2.6 2.8', t: 'soft' },
  ]),

  // --- Fundraising / equity / VC ---
  'coin-stack': G('Coin stack', '💰', [
    { r: [3.4, 15.4, 9.4, 3.2, 1.6], t: 'soft' },
    { r: [4.6, 11, 9.4, 3.2, 1.6], t: 'soft' },
    { c: [16.2, 14.6, 4.6] },
    { p: 'M16.2 12.4v4.4M14.6 15.8c.5.6 3.2.8 3.2-.8 0-1.4-3-1-3-2.4 0-1.2 2.2-1.3 3-.6', t: 'soft' },
  ]),
  sprout: G('Seedling', '🌱', [
    { p: 'M12 20.6v-7' },
    { p: 'M12 13.6c0-3.8 2.6-6.6 7-6.6.2 4.6-2.6 6.8-7 6.6Z' },
    { p: 'M12 11.2C12 8.4 10.2 6 6.6 6c-.2 3.4 1.8 5.4 5.4 5.2', t: 'soft' },
    { p: 'M8.4 20.6h7.2', t: 'soft' },
  ]),
  briefcase: G('Briefcase', '💼', [
    { r: [3.2, 7.4, 17.6, 12.2, 2] },
    { p: 'M9 7.4V5.6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.8' },
    { p: 'M3.2 12.2c2.8 1.2 5.8 1.8 8.8 1.8s6-.6 8.8-1.8', t: 'soft' },
    { p: 'M12 12.8v2.2', t: 'soft' },
  ]),
  dollar: G('Dollar mark', '💲', [
    { c: [12, 12, 8.6] },
    { p: 'M12 6.8v10.4', t: 'soft' },
    { p: 'M15 9c-.7-1-4.8-1.5-4.8 1 0 2.6 5.4 1.4 5.4 4 0 2.4-4.4 2.2-5.6.8' },
  ]),
  folder: G('Data-room folder', '📁', [
    { p: 'M3.4 7a2 2 0 0 1 2-2h4.2l2 2.4h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2Z' },
    { p: 'M3.4 10.6h17.2', t: 'soft' },
  ]),
  certificate: G('Stock certificate', '🎟️', [
    { r: [3, 6, 18, 12, 1.6] },
    { p: 'M8.2 6v12', t: 'soft' },
    { c: [14.6, 10.6, 2], t: 'soft' },
    { p: 'M12.6 14.8h4', t: 'soft' },
  ]),
  convert: G('Converging arrows', '🔀', [
    { p: 'M3.4 6.4h4l9 11.2h4.2' },
    { p: 'M3.4 17.6h4l2.6-3.2', t: 'soft' },
    { p: 'M13.6 9.6l2.8-3.2h4.2', t: 'soft' },
    { p: 'M18 3.6l2.8 2.8-2.8 2.8M18 14.8l2.8 2.8-2.8 2.8' },
  ]),
  pie: G('Ownership pie', '🥧', [
    { c: [12, 12, 8.6] },
    { p: 'M12 3.4V12l6.4 5.8', t: 'soft' },
    { p: 'M12 12l8.4-1.8', t: 'soft' },
  ]),
  jar: G('Fund jar', '🫙', [
    { p: 'M7 7.4C5.8 8.8 5 10.8 5 13c0 4.2 2 7.6 7 7.6s7-3.4 7-7.6c0-2.2-.8-4.2-2-5.6' },
    { r: [6.6, 3.4, 10.8, 4, 1.4] },
    { p: 'M8.4 14.6c0 2.4 1.4 4 3.6 4', t: 'soft' },
  ]),
  bottle: G('Champagne bottle', '🍾', [
    { p: 'M10.4 3.4h3.2v4.4c2 1 3 3 3 5.4v5.4a2 2 0 0 1-2 2h-5.2a2 2 0 0 1-2-2v-5.4c0-2.4 1-4.4 3-5.4Z' },
    { p: 'M7.4 15.4h9.2', t: 'soft' },
    { p: 'M19.4 4.4l1.4-1.4M20.4 8h1.4M16.8 2.8l.4-1.4', t: 'soft' },
  ]),
  atm: G('Money machine', '🏧', [
    { r: [4, 3.4, 16, 17.2, 2] },
    { r: [7, 6.4, 10, 4, 1], t: 'soft' },
    { p: 'M7 13.6h10', t: 'soft' },
    { c: [12, 17, 1], t: 'soft', f: true },
  ]),
  unicorn: G('Unicorn horn', '🦄', [
    { p: 'M19.6 4.4c-7.4 1-13.2 6.8-14.2 14.2' },
    { p: 'M19.6 4.4c-1 7.4-6.8 13.2-14.2 14.2' },
    { p: 'M14.6 7.2l1.6 1.6M11.2 10.2l1.7 1.7M8.2 13.6l1.6 1.6', t: 'soft' },
    { p: 'M18.4 13.4v3.4M16.7 15.1h3.4' },
  ]),

  // --- Legal ---
  scales: G('Scales of justice', '⚖️', [
    { p: 'M12 4.2v15.4M8.4 19.6h7.2M5.6 6.6h12.8' },
    { p: 'M2.8 13.2a2.9 2.9 0 0 0 5.8 0L5.7 7.2ZM15.4 13.2a2.9 2.9 0 0 0 5.8 0l-2.9-6Z', t: 'soft' },
  ]),
  hush: G('Zipped bubble', '🤐', [
    { p: 'M12 3.8a8.2 8.2 0 0 0-6 13.8l-1.4 3.8 4.2-1.2A8.2 8.2 0 1 0 12 3.8Z' },
    { p: 'M7.6 12h8.8', t: 'soft' },
    { p: 'M9.2 10.6v2.8M11.8 10.6v2.8M14.4 10.6v2.8', t: 'soft' },
  ]),
  registered: G('Registered mark', '®️', [
    { c: [12, 12, 8.6] },
    { p: 'M9.8 16V8h2.6a2.4 2.4 0 0 1 0 4.8H9.8m3 0 2.2 3.2', t: 'soft' },
  ]),
  copyright: G('Copyright mark', '©️', [
    { c: [12, 12, 8.6] },
    { p: 'M15 9.6a4 4 0 1 0 0 4.8', t: 'soft' },
  ]),
  contract: G('Contract pages', '📑', [
    { p: 'M6.4 3.4h8.2l4 4v13.2H6.4Z' },
    { p: 'M14.2 3.4v4.4h4.4', t: 'soft' },
    { p: 'M9.4 12h6.2M9.4 15h6.2', t: 'soft' },
    { p: 'M9.4 18h3.4', t: 'soft' },
  ]),
  suit: G('Registered agent', '🕴️', [
    { c: [12, 5.8, 2.6] },
    { p: 'M6.6 20.6c.4-4.6 2.6-7.4 5.4-7.4s5 2.8 5.4 7.4' },
    { p: 'M12 13.2l-1.6 2.4 1.6 3.4 1.6-3.4Z', t: 'soft' },
  ]),
  telescope: G('Telescope', '🔭', [
    { p: 'M4 11.2 17.6 4l2.4 4.6L6.4 15.8Z' },
    { p: 'M15.2 5.2l2.4 4.6', t: 'soft' },
    { p: 'M11 14.2l-3.4 6.4M12.8 13.2l3.6 7.4', t: 'soft' },
  ]),
  door: G('Door', '🚪', [
    { r: [6, 3.4, 12, 17.2, 1] },
    { p: 'M3.4 20.6h17.2' },
    { c: [14.8, 12.4, 1], t: 'soft', f: true },
  ]),

  // --- Compliance / tax / security ---
  banknote: G('Banknote', '💵', [
    { r: [2.8, 6.4, 18.4, 11.2, 2] },
    { c: [12, 12, 2.6], t: 'soft' },
    { p: 'M6 9.4v.01M18 14.6v.01', t: 'soft' },
  ]),
  receipt: G('Receipt', '🧾', [
    { p: 'M6 3.4h12v17.2l-2.4-1.6-2.4 1.6-1.2-.8-1.2.8-2.4-1.6L6 20.6Z' },
    { p: 'M9 8h6M9 11.4h6M9 14.8h3.4', t: 'soft' },
  ]),
  umbrella: G('Umbrella', '☂️', [
    { p: 'M3.4 12.6a8.6 8.6 0 0 1 17.2 0Z' },
    { p: 'M12 12.6v5.4a2.3 2.3 0 0 1-4.6 0', t: 'soft' },
    { p: 'M12 4v-1.2', t: 'soft' },
  ]),
  'shield-check': G('Shield check', '🛡️', [
    { p: 'M12 2.8 4.6 5.6v6c0 4.6 3 8 7.4 9.6 4.4-1.6 7.4-5 7.4-9.6v-6Z' },
    { p: 'M8.8 11.6l2.3 2.3 4.4-4.4', t: 'soft' },
  ]),
  dividers: G('Index dividers', '🗂️', [
    { p: 'M3.4 9h17.2v9.6a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2Z' },
    { p: 'M5.4 9V6.8a1.4 1.4 0 0 1 1.4-1.4h3.4V9', t: 'soft' },
    { p: 'M13.8 9V4a1.4 1.4 0 0 1 1.4-1.4h2a1.4 1.4 0 0 1 1.4 1.4v5', t: 'soft' },
    { p: 'M8.4 14.4h7.2', t: 'soft' },
  ]),
  calendar: G('Calendar', '📆', [
    { r: [3.8, 5, 16.4, 15.6, 2] },
    { p: 'M3.8 9.8h16.4', t: 'soft' },
    { p: 'M8.2 2.8V7M15.8 2.8V7' },
    { c: [8.6, 13.6, 0.9], t: 'soft', f: true },
    { c: [12.6, 13.6, 0.9], t: 'soft', f: true },
  ]),
  key: G('Key', '🔑', [
    { c: [7.4, 15.8, 4] },
    { p: 'M10.3 12.9 19.8 3.4' },
    { p: 'M15.2 8l2.6 2.6M18.4 4.8l1.8 1.8', t: 'soft' },
  ]),
  detective: G('Detective', '🕵️', [
    { p: 'M4.4 9.4h15.2M7 9.4l1.6-4.6a1.6 1.6 0 0 1 1.5-1h3.8a1.6 1.6 0 0 1 1.5 1L17 9.4' },
    { c: [8.2, 15.4, 2.8], t: 'soft' },
    { c: [15.8, 15.4, 2.8], t: 'soft' },
    { p: 'M11 15.4h2', t: 'soft' },
  ]),
  padlock: G('Padlock', '🔒', [
    { r: [4.8, 10.6, 14.4, 9.6, 2] },
    { p: 'M8 10.6V7.8a4 4 0 0 1 8 0v2.8' },
    { c: [12, 14.8, 1.1], t: 'soft', f: true },
    { p: 'M12 15.9v1.7', t: 'soft' },
  ]),
  scroll: G('Scroll', '📜', [
    { p: 'M7 17.4V5.6a2.2 2.2 0 0 0-4.4 0c0 1.2 1 2.2 2.2 2.2H7' },
    { p: 'M7 3.4h12.4v14a3.2 3.2 0 0 1-3.2 3.2H7a3.2 3.2 0 0 0 3.2-3.2h11' },
    { p: 'M10.6 8h5.2M10.6 11.4h5.2', t: 'soft' },
  ]),
  mask: G('Pentest mask', '🥷', [
    { r: [3.4, 8.6, 17.2, 6.8, 3.4] },
    { c: [8.4, 12, 1.4], t: 'soft', f: true },
    { c: [15.6, 12, 1.4], t: 'soft', f: true },
    { p: 'M3.4 11.4 1.9 10M20.6 11.4 22.1 10', t: 'soft' },
  ]),
  form: G('Form', '📝', [
    { p: 'M5.4 3.4h13.2v17.2H5.4Z' },
    { p: 'M8.4 7.6h2M8.4 11h2M8.4 14.4h2', t: 'soft' },
    { p: 'M12.4 7.6h3.2M12.4 11h3.2', t: 'soft' },
    { p: 'M12.2 15.6l1.4 1.4 2.6-2.6', t: 'soft' },
  ]),
  microscope: G('Microscope', '🔬', [
    { p: 'M9.4 3.4h3.2v6.2a3.6 3.6 0 0 1-3.2 0Z' },
    { p: 'M11 9.8v3' },
    { p: 'M6.6 16.4a5.8 5.8 0 0 0 11.4-1.6c0-1.8-.8-3.2-2.2-4.2', t: 'soft' },
    { p: 'M4.6 20.6h14.8M11 20.6v-2', t: 'soft' },
  ]),
  cart: G('Cart', '🛒', [
    { p: 'M3 3.8h2.6l2.2 11.4h10.4l2.4-8.4H6.4' },
    { c: [9, 19.6, 1.4], t: 'soft' },
    { c: [16.6, 19.6, 1.4], t: 'soft' },
  ]),

  // --- Finance ---
  'cash-flow': G('Money in motion', '💸', [
    { r: [2.8, 5, 15.4, 9.6, 1.6] },
    { c: [10.5, 9.8, 2.2], t: 'soft' },
    { p: 'M21.2 9.6h-2M21.2 13.2h-3.4M21.2 16.8h-4.8', t: 'soft' },
    { p: 'M5.4 18h6.8', t: 'soft' },
  ]),
  card: G('Payment card', '💳', [
    { r: [2.8, 5.4, 18.4, 13.2, 2] },
    { p: 'M2.8 9.6h18.4', t: 'soft' },
    { p: 'M6.2 14.8h4', t: 'soft' },
  ]),
  bank: G('Bank', '🏦', [
    { p: 'M3.6 9 12 4l8.4 5Z' },
    { p: 'M3.4 20.6h17.2' },
    { p: 'M6 12v5.6M12 12v5.6M18 12v5.6', t: 'soft' },
    { c: [12, 7.4, 0.9], t: 'soft', f: true },
  ]),
  'chart-down': G('Chart trending down', '📉', [
    { p: 'M3.4 3.4v15.2a2 2 0 0 0 2 2h15.2' },
    { p: 'M6.6 8l4.2 4.6 3-2.6 5 5.4' },
    { p: 'M18.8 11.2v4.4h-4.4', t: 'soft' },
  ]),
  calculator: G('Calculator', '🧮', [
    { r: [5, 2.8, 14, 18.4, 2] },
    { r: [7.8, 5.4, 8.4, 3.4, 0.8], t: 'soft' },
    { c: [8.8, 12.6, 0.9], t: 'soft', f: true },
    { c: [12, 12.6, 0.9], t: 'soft', f: true },
    { c: [15.2, 12.6, 0.9], t: 'soft', f: true },
    { c: [8.8, 16.6, 0.9], t: 'soft', f: true },
    { c: [12, 16.6, 0.9], t: 'soft', f: true },
    { c: [15.2, 16.6, 0.9], t: 'soft', f: true },
  ]),
  ledger: G('Ledger', '📒', [
    { r: [5, 3.4, 14.6, 17.2, 2] },
    { p: 'M8.2 3.4v17.2', t: 'soft' },
    { p: 'M11.2 8h5M11.2 11.4h5M11.2 14.8h3', t: 'soft' },
  ]),
  'bar-chart': G('Bar chart', '📊', [
    { p: 'M3.4 3.4v15.2a2 2 0 0 0 2 2h15.2' },
    { p: 'M8 17v-5.4' },
    { p: 'M12.6 17V6.6' },
    { p: 'M17.2 17v-7.8', t: 'soft' },
  ]),
  tie: G('Boardroom tie', '👔', [
    { p: 'M9.4 3.4h5.2l-1 3.2h-3.2Z' },
    { p: 'M10.4 6.6 9 15.4l3 3.8 3-3.8-1.4-8.8', t: 'soft' },
    { p: 'M9.4 3.4 5.6 6.2l2.2 3 2.6-2.6M14.6 3.4l3.8 2.8-2.2 3-2.6-2.6' },
  ]),
  'tray-out': G('Outbound tray', '📤', [
    { p: 'M3.4 13.4v4.2a3 3 0 0 0 3 3h11.2a3 3 0 0 0 3-3v-4.2' },
    { p: 'M3.4 14.6h4.4l1.4 2.2h5.6l1.4-2.2h4.4', t: 'soft' },
    { p: 'M12 10.6v-7.2M8.8 6.4 12 3.2l3.2 3.2' },
  ]),
  'return-arrow': G('Return arrow', '↩️', [
    { p: 'M8.8 5.4 4 10.2l4.8 4.8' },
    { p: 'M4 10.2h10.4a5.6 5.6 0 0 1 0 11.2H9' },
    { c: [19.4, 5.4, 1], t: 'soft', f: true },
  ]),
  ruler: G('Set square', '📐', [
    { p: 'M4.4 19.6 19.6 4.4v15.2Z' },
    { p: 'M15.6 19.6v-2.4M11.6 19.6v-2.4M7.6 19.6v-2.4', t: 'soft' },
    { p: 'M16.4 12.4v4h-4Z', t: 'soft' },
  ]),

  // --- HR / people ---
  handshake: G('Handshake', '🤝', [
    { p: 'M2.4 10.4h5.4L12 13.6l4.2-3.2h5.4' },
    { p: 'M12 10.2l3.4 3-3.4 3-3.4-3Z', f: true },
    { p: 'M5.4 6.8v3.6M18.6 6.8v3.6', t: 'soft' },
  ]),
  people: G('People', '👥', [
    { c: [9, 8, 3.4] },
    { p: 'M3.2 20.2c.6-4 2.8-6.4 5.8-6.4s5.2 2.4 5.8 6.4' },
    { p: 'M15.4 5a3.4 3.4 0 0 1 0 6', t: 'soft' },
    { p: 'M17.2 14.2c2 .8 3.2 3 3.6 6', t: 'soft' },
  ]),
  'card-index': G('Card index', '🗃️', [
    { r: [3.4, 10.4, 17.2, 10.2, 2] },
    { p: 'M8 10.4V5.2a1.8 1.8 0 0 1 1.8-1.8h4.4A1.8 1.8 0 0 1 16 5.2v5.2', t: 'soft' },
    { p: 'M10.6 6.8h2.8', t: 'soft' },
    { p: 'M9.6 14.8h4.8' },
  ]),
  'person-out': G('Offboarding', '👋', [
    { c: [9, 7, 3.2] },
    { p: 'M3.4 20.4c.6-3.8 2.7-6 5.6-6 1.4 0 2.6.5 3.6 1.4' },
    { p: 'M15 13.4l3.2 3.2-3.2 3.2M18.2 16.6h-5.8', t: 'soft' },
  ]),
  star: G('Star', '⭐', [
    { p: 'M12 3.6l2.6 5.2 5.8.8-4.2 4 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.2-4 5.8-.8Z' },
    { c: [12, 11.4, 1], t: 'soft', f: true },
  ]),
  stethoscope: G('Stethoscope', '🩺', [
    { p: 'M5 3.4v5.2a4.4 4.4 0 0 0 8.8 0V3.4' },
    { p: 'M9.4 13v3.2a4.4 4.4 0 0 0 8.8 0v-2.4', t: 'soft' },
    { c: [18.2, 11.2, 2.4] },
  ]),
  'book-open': G('Open book', '📖', [
    { p: 'M12 6.2C10.4 4.8 8 4 3.4 4v14c4.6 0 7 .8 8.6 2.2C13.6 18.8 16 18 20.6 18V4c-4.6 0-7 .8-8.6 2.2Z' },
    { p: 'M12 6.2v14', t: 'soft' },
    { p: 'M6.4 8.6c1.6.1 2.9.4 4 .8M17.6 8.6c-1.6.1-2.9.4-4 .8', t: 'soft' },
  ]),
  'tray-in': G('Inbound tray', '📥', [
    { p: 'M3.4 13.4v4.2a3 3 0 0 0 3 3h11.2a3 3 0 0 0 3-3v-4.2' },
    { p: 'M3.4 14.6h4.4l1.4 2.2h5.6l1.4-2.2h4.4', t: 'soft' },
    { p: 'M12 3.2v7.2M8.8 7.2 12 10.4l3.2-3.2' },
  ]),
  'hard-hat': G('Hard hat', '👷', [
    { p: 'M4 15.4a8 8 0 0 1 16 0' },
    { p: 'M2.8 15.4h18.4v1.4a1.6 1.6 0 0 1-1.6 1.6H4.4a1.6 1.6 0 0 1-1.6-1.6Z' },
    { p: 'M10.4 7.6V4.8h3.2v2.8', t: 'soft' },
    { p: 'M12 10.4v2', t: 'soft' },
  ]),
  badge: G('Workspace badge', '🪪', [
    { r: [2.8, 5.4, 18.4, 13.2, 2.4] },
    { p: 'M9.8 5.4h4.4v2.2a2.2 2.2 0 0 1-4.4 0Z', t: 'soft' },
    { c: [8.2, 12.4, 1.5], t: 'soft' },
    { p: 'M13.4 11.6h4.6M13.4 14.8h3', t: 'soft' },
  ]),
  'mail-heart': G('Invitation', '💌', [
    { r: [2.8, 5.4, 18.4, 13.2, 2] },
    { p: 'M2.8 7.4 12 13l9.2-5.6', t: 'soft' },
    { p: 'M12 19.4c2.6-1.8 3.9-3.2 3.9-4.7a1.9 1.9 0 0 0-3.4-1.2 1.9 1.9 0 0 0-3.4 1.2c0 1.5 1.3 2.9 2.9 4.7Z', f: true },
  ]),
  'top-hat': G('Top hat', '🎩', [
    { p: 'M7.4 16.4V5.6A1.6 1.6 0 0 1 9 4h6a1.6 1.6 0 0 1 1.6 1.6v10.8' },
    { p: 'M2.8 16.4h18.4' },
    { p: 'M4.8 16.4c0 1.6 3.2 2.8 7.2 2.8s7.2-1.2 7.2-2.8', t: 'soft' },
    { p: 'M7.4 12.8h9.2', t: 'soft' },
  ]),
  passport: G('Passport', '🛂', [
    { r: [5, 2.8, 14, 18.4, 2] },
    { c: [12, 9.4, 3], t: 'soft' },
    { p: 'M9 9.4h6M12 6.4c-1.6 1.8-1.6 4.2 0 6 1.6-1.8 1.6-4.2 0-6Z', t: 'soft' },
    { p: 'M8.6 17h6.8', t: 'soft' },
  ]),
  'nest-egg': G('Nest egg', '🪺', [
    { p: 'M12 4.6c-1.8 0-3.2 2-3.2 4.2a3.2 3.2 0 0 0 6.4 0c0-2.2-1.4-4.2-3.2-4.2Z' },
    { p: 'M3.8 12.4c.5 4.3 3.8 7.2 8.2 7.2s7.7-2.9 8.2-7.2' },
    { p: 'M3.8 12.4h16.4', t: 'soft' },
    { p: 'M6.8 15.8c3.3 1.3 7.1 1.3 10.4 0', t: 'soft' },
  ]),
  'globe-pin': G('Globe pin', '🌏', [
    { c: [12, 12, 8.6] },
    { p: 'M3.4 12h17.2', t: 'soft' },
    { p: 'M12 3.4c-5.6 4.8-5.6 12.4 0 17.2', t: 'soft' },
    { c: [16.6, 8.2, 1.4], f: true },
  ]),

  // --- Operations ---
  gear: G('Gear', '⚙️', [
    { c: [12, 12, 6.2] },
    { c: [12, 12, 2.4], t: 'soft' },
    { p: 'M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.4 5.4l1.8 1.8M16.8 16.8l1.8 1.8M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8' },
  ]),
  tools: G('Crossed tools', '🛠️', [
    { p: 'M6 3.2 3.2 6l4.4 4.4L4.4 13.6a1.9 1.9 0 0 0 2.7 2.7l3.2-3.2L18 20.8a1.9 1.9 0 0 0 2.7-2.7Z' },
    { p: 'M14.4 8.2l3.6-3.6 2.8 1-1.2 2.8-2.4.6', t: 'soft' },
    { p: 'M14.4 8.2 12.6 10', t: 'soft' },
  ]),
  cabinet: G('File cabinet', '🗄️', [
    { r: [4.4, 2.8, 15.2, 18.4, 2] },
    { p: 'M4.4 12h15.2', t: 'soft' },
    { p: 'M10 7.4h4M10 16.6h4', t: 'soft' },
  ]),
  chat: G('Chat bubble', '💬', [
    { p: 'M12 3.8a8.2 8.2 0 0 0-6 13.8l-1.4 3.8 4.2-1.2A8.2 8.2 0 1 0 12 3.8Z' },
    { c: [8.4, 12, 0.9], t: 'soft', f: true },
    { c: [12, 12, 0.9], t: 'soft', f: true },
    { c: [15.6, 12, 0.9], t: 'soft', f: true },
  ]),
  ticket: G('Ticket', '🎫', [
    { p: 'M3 8.4a2.4 2.4 0 0 0 0 7.2V19h18v-3.4a2.4 2.4 0 0 1 0-7.2V5H3Z' },
    { p: 'M14.6 5v2M14.6 11v2M14.6 17v2', t: 'soft' },
  ]),
  books: G('Book stack', '📚', [
    { r: [3.6, 3, 4.2, 18, 1] },
    { r: [7.8, 3, 4.2, 18, 1] },
    { p: 'M12.6 4.4l4-1 4.4 16.8-4 1Z', t: 'soft' },
    { p: 'M3.6 7h4.2M7.8 7h4.2', t: 'soft' },
  ]),
  building: G('Office building', '🏢', [
    { r: [5.4, 3.4, 13.2, 17.2, 1.6] },
    { p: 'M9 7.4h2M13 7.4h2M9 11h2M13 11h2M9 14.6h2M13 14.6h2', t: 'soft' },
    { p: 'M10.6 20.6v-3h2.8v3', t: 'soft' },
  ]),
  'org-tree': G('Org structure', '🏗️', [
    { r: [8.6, 2.8, 6.8, 5, 1.2] },
    { r: [2.8, 16.2, 6.4, 5, 1.2], t: 'soft' },
    { r: [14.8, 16.2, 6.4, 5, 1.2], t: 'soft' },
    { p: 'M12 7.8v4.2M6 16.2v-2.2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2.2' },
  ]),
  target: G('Target', '🎯', [
    { c: [12, 12, 8.6] },
    { c: [12, 12, 4.8], t: 'soft' },
    { c: [12, 12, 1.4], f: true },
  ]),
  envelope: G('Envelope', '✉️', [
    { r: [2.8, 5.4, 18.4, 13.2, 2] },
    { p: 'M2.8 7.4 12 13.4l9.2-6', t: 'soft' },
  ]),
  'envelope-route': G('Routed mail', '📨', [
    { r: [2.8, 5.4, 15, 13.2, 2] },
    { p: 'M2.8 7.4l7.5 5 7.5-5', t: 'soft' },
    { p: 'M21.4 12h-6.2M18.4 9l3 3-3 3' },
  ]),
  plug: G('Plug', '🔌', [
    { p: 'M9 2.8v4.6M15 2.8v4.6' },
    { p: 'M6.4 7.4h11.2v3a5.6 5.6 0 0 1-11.2 0Z' },
    { p: 'M12 16v2.4a2.6 2.6 0 0 1-5.2 0v-.6', t: 'soft' },
  ]),
  compass: G('Compass', '🧭', [
    { c: [12, 12, 8.6] },
    { p: 'M15.8 8.2 13.6 13.6 8.2 15.8l2.2-5.4Z', t: 'soft' },
    { c: [12, 12, 0.9], f: true },
  ]),
  monitor: G('Monitor', '🖥️', [
    { r: [2.8, 4, 18.4, 12.6, 2] },
    { p: 'M9.4 20h5.2M12 16.6V20', t: 'soft' },
    { p: 'M6 8l3 2.6-3 2.6', t: 'soft' },
  ]),
  skyline: G('Skyline', '🏙️', [
    { p: 'M3 20.6V9h5.4v11.6M8.4 12.8h6V20.6M14.4 5.4H20v15.2M2 20.6h20' },
    { p: 'M5 12h1.4M5 15.4h1.4M11 16h1.4M16.8 9h1.4M16.8 12.4h1.4M16.8 15.8h1.4', t: 'soft' },
  ]),
  vault: G('Vault', '🔐', [
    { r: [3.4, 3.4, 17.2, 17.2, 2] },
    { c: [12, 12, 4], t: 'soft' },
    { p: 'M12 8V5.6M12 18.4V16M8 12H5.6M18.4 12H16', t: 'soft' },
    { c: [12, 12, 1.2], f: true },
  ]),

  // --- Software / product ---
  laptop: G('Laptop', '💻', [
    { r: [4.4, 4.4, 15.2, 10.6, 1.6] },
    { p: 'M2.4 18.4h19.2l-1.6-3.4H4Z', t: 'soft' },
    { p: 'M8.6 8.2 10.4 10l-1.8 1.8M12.4 11.8h3', t: 'soft' },
  ]),
  ship: G('Container ship', '🚢', [
    { p: 'M3 14.6h18l-2.2 4.6H5.2Z' },
    { r: [6.2, 10.8, 4.6, 3.8, 0.6], t: 'soft' },
    { r: [10.8, 10.8, 4.6, 3.8, 0.6], t: 'soft' },
    { p: 'M13 10.8V6.4h3.6v4.4', t: 'soft' },
    { p: 'M2.6 21.4c1.6-1.2 3.2-1.2 4.8 0 1.6 1.2 3.2 1.2 4.8 0' },
  ]),
  tag: G('Release tag', '🏷️', [
    { p: 'M3.4 5.4a2 2 0 0 1 2-2h6.2l9 9-8.2 8.2-9-9Z' },
    { c: [8.2, 8.2, 1.3], t: 'soft' },
  ]),
  robot: G('Robot', '🤖', [
    { r: [4.4, 8, 15.2, 12, 2] },
    { p: 'M12 8V4.6M12 4.6h.01' },
    { c: [9, 13, 1], t: 'soft', f: true },
    { c: [15, 13, 1], t: 'soft', f: true },
    { p: 'M9.4 17h5.2', t: 'soft' },
  ]),
  cycle: G('CI cycle', '🔄', [
    { p: 'M20 12a8 8 0 0 1-13.6 5.7' },
    { p: 'M4 12a8 8 0 0 1 13.6-5.7' },
    { p: 'M17.6 2.8v3.5h-3.5M6.4 21.2v-3.5h3.5', t: 'soft' },
  ]),
  siren: G('Siren', '🚨', [
    { p: 'M7 16.6V12a5 5 0 0 1 10 0v4.6' },
    { r: [4.4, 16.6, 15.2, 4, 1.2], t: 'soft' },
    { p: 'M12 3v2M4.8 5.8l1.4 1.4M19.2 5.8l-1.4 1.4', t: 'soft' },
  ]),
  cloud: G('Cloud', '☁️', [
    { p: 'M7 18.6a4.3 4.3 0 0 1-.6-8.6 5.6 5.6 0 0 1 10.8-1 4.6 4.6 0 0 1-.6 9.6Z' },
    { p: 'M8.2 14.2c.4-1.4 1.6-2.2 3-2.2', t: 'soft' },
  ]),
  link: G('Chain link', '🔗', [
    { p: 'M9.8 7.2 12 5a4.3 4.3 0 0 1 6.1 6.1l-2.2 2.2' },
    { p: 'M14.2 16.8 12 19a4.3 4.3 0 0 1-6.1-6.1l2.2-2.2' },
    { p: 'M9.6 14.4l4.8-4.8', t: 'soft' },
  ]),
  funnel: G('Analytics funnel', '🦔', [
    { p: 'M4.4 4.4h15.2l-5.4 7v6.8l-4.4 2.4v-9.2Z' },
    { p: 'M6.6 7.4h10.8', t: 'soft' },
    { c: [12, 14.4, 0.9], t: 'soft', f: true },
  ]),
  'git-branch': G('Code branch', '🐙', [
    { c: [7, 6, 2.6] },
    { c: [7, 18, 2.6] },
    { c: [17.4, 8.2, 2.6], t: 'soft' },
    { p: 'M7 8.6v6.8' },
    { p: 'M17.4 10.8c0 3.4-3.6 4.2-7.2 4.4', t: 'soft' },
  ]),
  pager: G('Pager', '📟', [
    { r: [2.8, 6.4, 18.4, 11.2, 2] },
    { r: [5.8, 9.2, 8.4, 5.6, 0.8], t: 'soft' },
    { c: [17.4, 10.4, 0.9], t: 'soft', f: true },
    { c: [17.4, 13.6, 0.9], t: 'soft', f: true },
  ]),
  warehouse: G('Warehouse', '🏭', [
    { p: 'M3.4 20.6V9.4L12 5l8.6 4.4v11.2' },
    { p: 'M2.6 20.6h18.8' },
    { r: [7.4, 12.6, 9.2, 8, 0], t: 'soft' },
    { p: 'M7.4 16.6h9.2', t: 'soft' },
  ]),
  extinguisher: G('Extinguisher', '🧯', [
    { r: [8, 8.4, 8, 12.2, 2.6] },
    { p: 'M12 8.4V6M9.6 6h4.8', t: 'soft' },
    { p: 'M9.6 6c-2.4.4-4 1.8-4.6 4', t: 'soft' },
    { p: 'M14.4 4.2l3.2-1.4v3.4l-3.2-1.2', t: 'soft' },
  ]),
  'status-dot': G('Status pulse', '🟢', [
    { c: [12, 12, 3.2], f: true },
    { c: [12, 12, 6.6], t: 'soft' },
    { p: 'M12 2.2a9.8 9.8 0 0 1 9.8 9.8M12 21.8A9.8 9.8 0 0 1 2.2 12', t: 'soft' },
  ]),
  phone: G('Mobile phone', '📱', [
    { r: [7, 2.8, 10, 18.4, 2.4] },
    { p: 'M10.6 5.4h2.8', t: 'soft' },
    { c: [12, 18, 1], t: 'soft', f: true },
  ]),
  clipboard: G('Clipboard', '📋', [
    { r: [4.8, 4.6, 14.4, 16.8, 2] },
    { r: [8.8, 2.8, 6.4, 3.6, 1.2], t: 'soft' },
    { p: 'M8.2 11h7.6M8.2 14.4h7.6M8.2 17.8h4.4', t: 'soft' },
  ]),

  // --- Sales / growth ---
  handset: G('Phone handset', '📞', [
    { p: 'M5.2 3.4c-1 0-1.9.9-1.8 1.9a16.8 16.8 0 0 0 15.3 15.3c1 .1 1.9-.8 1.9-1.8v-2.6a1.8 1.8 0 0 0-1.4-1.8l-2.8-.7a1.8 1.8 0 0 0-1.8.6l-1 1.2a13 13 0 0 1-5.1-5.1l1.2-1a1.8 1.8 0 0 0 .6-1.8l-.7-2.8a1.8 1.8 0 0 0-1.8-1.4Z' },
    { p: 'M14.2 5.6a4.6 4.6 0 0 1 4.2 4.2', t: 'soft' },
  ]),
  'contact-card': G('Contact card', '📇', [
    { r: [2.8, 6.4, 18.4, 12.6, 2] },
    { p: 'M7 6.4V4.2M12 6.4V4.2M17 6.4V4.2', t: 'soft' },
    { c: [8, 11.8, 1.5], t: 'soft' },
    { p: 'M13.2 11h4.4M13.2 14.2h3', t: 'soft' },
  ]),
  'chart-up': G('Chart trending up', '📈', [
    { p: 'M3.4 3.4v15.2a2 2 0 0 0 2 2h15.2' },
    { p: 'M6.6 15.4 10.8 10l3 2.6 5-6' },
    { p: 'M18.8 11v-4.4h-4.4', t: 'soft' },
  ]),
  repeat: G('Repeat loop', '🔁', [
    { p: 'M4 13V9.8a3.4 3.4 0 0 1 3.4-3.4H20' },
    { p: 'M20 11v3.2a3.4 3.4 0 0 1-3.4 3.4H4' },
    { p: 'M17 3.4l3 3-3 3M7 14.6l-3 3 3 3', t: 'soft' },
  ]),
  lifebuoy: G('Lifebuoy', '🛟', [
    { c: [12, 12, 8.6] },
    { c: [12, 12, 3.8], t: 'soft' },
    { p: 'M9.3 9.3 5.9 5.9M14.7 9.3l3.4-3.4M14.7 14.7l3.4 3.4M9.3 14.7l-3.4 3.4', t: 'soft' },
  ]),
  megaphone: G('Megaphone', '📣', [
    { p: 'M3.4 10v4a1.6 1.6 0 0 0 1.6 1.6h2.4L19 20.2a1 1 0 0 0 1.4-.9V4.7a1 1 0 0 0-1.4-.9L7.4 8.4H5a1.6 1.6 0 0 0-1.6 1.6Z' },
    { p: 'M7.4 15.6l1.2 4.2a1.4 1.4 0 0 0 1.4 1h1.4', t: 'soft' },
    { p: 'M7.4 8.4v7.2', t: 'soft' },
  ]),
  headset: G('Support headset', '🗨️', [
    { p: 'M4.4 14v-2a7.6 7.6 0 0 1 15.2 0v2' },
    { r: [2.8, 12.6, 3.6, 5.4, 1.6], t: 'soft' },
    { r: [17.6, 12.6, 3.6, 5.4, 1.6], t: 'soft' },
    { p: 'M19.4 18v.8a2.6 2.6 0 0 1-2.6 2.6h-3.2', t: 'soft' },
  ]),
  'envelope-bolt': G('Transactional mail', '📧', [
    { p: 'M21.2 11V7.4a2 2 0 0 0-2-2H4.8a2 2 0 0 0-2 2v9.2a2 2 0 0 0 2 2h8.2' },
    { p: 'M2.8 7.4 12 13.4l9.2-6', t: 'soft' },
    { p: 'M18.6 12.6 16 17h3l-1.4 3.6 4-5h-2.8Z' },
  ]),
  wand: G('Magic wand', '🪄', [
    { p: 'M4.2 19.8 15.4 8.6l-1.2-1.2L3 18.6Z' },
    { p: 'M17.8 3v3M16.3 4.5h3', t: 'soft' },
    { p: 'M20.2 9.4v2.4M19 10.6h2.4', t: 'soft' },
    { c: [12.2, 3.8, 0.9], t: 'soft', f: true },
  ]),
  rocket: G('Rocket', '🚀', [
    { p: 'M12.2 15.2c4.4-3 6.8-7.2 6.8-12.2-5 0-9.2 2.4-12.2 6.8L9.2 12Z' },
    { p: 'M6.8 9.8 2.8 10.8l3.2 3.2M14.2 17.2l-1 4-3.2-3.2', t: 'soft' },
    { c: [14.2, 7.8, 1.5], t: 'soft' },
    { p: 'M6.4 17.6c-1.5 1.5-2 3.4-2 3.4s1.9-.5 3.4-2', t: 'soft' },
  ]),
  'paper-plane': G('Paper plane', '🛫', [
    { p: 'M21 3.6 3 10.8l6.4 2.4L21 3.6Z' },
    { p: 'M21 3.6l-4.8 15.8-6.8-6.2', t: 'soft' },
    { p: 'M9.4 13.2v5l2.8-2.6', t: 'soft' },
  ]),
  gift: G('Gift', '🎁', [
    { r: [4, 10.6, 16, 9.8, 1.4] },
    { p: 'M3.2 7.2h17.6v3.4H3.2Z', t: 'soft' },
    { p: 'M12 7.2v13.2', t: 'soft' },
    { p: 'M12 7.2c-1.8 0-4.2-.7-4.2-2.4 0-1.9 2.7-2.3 4.2.4 1.5-2.7 4.2-2.3 4.2-.4 0 1.7-2.4 2.4-4.2 2.4Z' },
  ]),
  coin: G('Coin flip', '🪙', [
    { c: [11, 13, 7.6] },
    { p: 'M11 9.4v7.2M13.6 10.8c-.6-.8-5.2-1.2-5.2 1 0 2.4 5.2 1.2 5.2 3.4 0 2-4.4 1.9-5.4.6', t: 'soft' },
    { p: 'M17.4 4.2a9.6 9.6 0 0 1 3 3M20.8 3l-.4 4.6-4.4-1.4', t: 'soft' },
  ]),
  boomerang: G('Boomerang', '🪃', [
    { p: 'M4 4.4c5.4 0 9.8 1.8 12.8 4.8s4.8 7.4 4.8 12.8c-2.8 0-4.6-1.4-5.2-3.6-.8-3-1.4-4.4-2.6-5.6S10.6 11 7.6 10.2C5.4 9.6 4 7.2 4 4.4Z' },
    { c: [8.4, 7.2, 0.9], t: 'soft', f: true },
    { c: [16.8, 15.6, 0.9], t: 'soft', f: true },
  ]),
  cat: G('Launch cat', '😺', [
    { p: 'M5 10.4 4.4 4l4.8 2.6a9.4 9.4 0 0 1 5.6 0L19.6 4l-.6 6.4a8 8 0 0 1 .6 3c0 4.4-3.4 7.2-7.6 7.2S4.4 17.8 4.4 13.4a8 8 0 0 1 .6-3Z' },
    { c: [9, 12.4, 1], t: 'soft', f: true },
    { c: [15, 12.4, 1], t: 'soft', f: true },
    { p: 'M12 15.2l-1 1h2Z', t: 'soft' },
  ]),
  'mech-arm': G('Mech arm', '🦾', [
    { p: 'M4.4 20.6 9 12l5-2.4' },
    { p: 'M14 9.6l4.4-4.2M18.4 5.4l2 2-2.4 2.4-2-2' },
    { c: [9, 12, 1.6], t: 'soft' },
    { p: 'M2.8 20.6h5.4', t: 'soft' },
  ]),
  castle: G('Castle', '🏰', [
    { p: 'M5 20.6V6.4h2.2v2h2.4v-2h4.8v2h2.4v-2H19v14.2' },
    { p: 'M3.4 20.6h17.2' },
    { p: 'M10.4 20.6v-4.2a1.6 1.6 0 0 1 3.2 0v4.2', t: 'soft' },
    { c: [12, 11.6, 1], t: 'soft' },
  ]),

  // ---------- The arena set (founder ask 2026-10-01: "apply the custom icons to the rest of
  // the site") — new glyphs for arena concepts no process glyph covers. Same design language:
  // 24×24, 1.7px strokes, duotone, every path hand-authored here. The arena id → token mapping
  // lives in lib/arenaIcons.ts (same choke-point pattern as lib/processIcons.ts).

  // --- AI & agents ---
  'home-server': G('Self-hosted rack', '🦞', [
    { p: 'M4 11 12 4.2l8 6.8' },
    { p: 'M6 9.6v11h12v-11' },
    { p: 'M9 13.2h6M9 16.4h6', t: 'soft' },
    { c: [15.4, 18.8, 0.7], t: 'soft', f: true },
  ]),
  'code-check': G('Reviewed code', '🕵', [
    { p: 'M7.6 7.4 3.6 12l4 4.6', t: 'soft' },
    { p: 'M16.4 7.4l4 4.6-4 4.6', t: 'soft' },
    { p: 'M9.4 12.6l2.2 2.2 3.8-4.2' },
  ]),
  nodes: G('Agent graph', '🕸', [
    { c: [12, 6, 2.2] },
    { c: [6, 17.4, 2.2], t: 'soft' },
    { c: [18, 17.4, 2.2], t: 'soft' },
    { p: 'M10.9 7.9 7.1 15.5M13.1 7.9l3.8 7.6M8.2 17.4h7.6' },
  ]),
  sandbox: G('Sandboxed cube', '📦', [
    { p: 'M4.4 8V6.4a2 2 0 0 1 2-2H8M16 4.4h1.6a2 2 0 0 1 2 2V8M19.6 16v1.6a2 2 0 0 1-2 2H16M8 19.6H6.4a2 2 0 0 1-2-2V16' },
    { p: 'M12 8.2l3.4 2v3.8l-3.4 2-3.4-2v-3.8Z', t: 'soft' },
    { p: 'M8.6 10.2l3.4 1.9 3.4-1.9M12 12.1v3.9', t: 'soft' },
  ]),
  'grad-cap': G('Graduation cap', '🎓', [
    { p: 'M2.8 9.4 12 5l9.2 4.4L12 13.8Z' },
    { p: 'M6.4 11.6v4.2c0 1.5 2.5 2.7 5.6 2.7s5.6-1.2 5.6-2.7v-4.2', t: 'soft' },
    { p: 'M21.2 9.4v4.8', t: 'soft' },
  ]),
  browser: G('Browser window', '🌐', [
    { r: [2.8, 4.4, 18.4, 15.2, 2] },
    { p: 'M2.8 8.6h18.4', t: 'soft' },
    { c: [5.4, 6.5, 0.7], t: 'soft', f: true },
    { p: 'M8.8 6.5h9.4', t: 'soft' },
    { p: 'M8.8 13.6 11 15.8l4.2-4.4' },
  ]),
  'chip-ram': G('Memory chip', '🗄', [
    { r: [5, 8, 14, 8.4, 1.4] },
    { p: 'M8 8V5.6M12 8V5.6M16 8V5.6M8 18.8v-2.4M12 18.8v-2.4M16 18.8v-2.4' },
    { p: 'M7.6 11h8.8M7.6 13.4h5', t: 'soft' },
  ]),
  mic: G('Microphone', '🎙', [
    { r: [9.4, 3.2, 5.2, 9.6, 2.6] },
    { p: 'M6.4 11a5.6 5.6 0 0 0 11.2 0', t: 'soft' },
    { p: 'M12 16.6v4M9.4 20.6h5.2', t: 'soft' },
  ]),
  puzzle: G('Puzzle piece', '🧩', [
    { p: 'M4.4 9h3.4a2.2 2.2 0 1 1 4.4 0h3.4v3.4a2.2 2.2 0 1 0 0 4.4v3.4H4.4Z' },
    { c: [8.4, 14.6, 0.9], t: 'soft', f: true },
  ]),
  brain: G('Model brain', '🧠', [
    { p: 'M12 3.4c-1.8 0-3.2 1.2-3.4 2.8-1.6.3-2.8 1.7-2.8 3.4 0 .6.2 1.2.5 1.7A3.5 3.5 0 0 0 5 14c0 1.9 1.4 3.4 3.2 3.6.4 1.7 1.9 3 3.8 3V3.4Z' },
    { p: 'M12 3.4c1.8 0 3.2 1.2 3.4 2.8 1.6.3 2.8 1.7 2.8 3.4 0 .6-.2 1.2-.5 1.7A3.5 3.5 0 0 1 19 14c0 1.9-1.4 3.4-3.2 3.6-.4 1.7-1.9 3-3.8 3' },
    { p: 'M9.2 8.6c.9.2 1.5.9 1.6 1.8M14.8 11.8c-.9.2-1.5.9-1.6 1.8', t: 'soft' },
  ]),
  speedo: G('Speed gauge', '🚀', [
    { p: 'M3.6 16.6a8.6 8.6 0 0 1 16.8 0' },
    { p: 'M12 7.4v1.6M6.2 9.8l1.2 1.2M17.8 9.8l-1.2 1.2', t: 'soft' },
    { p: 'M12 16.6l4-5' },
    { c: [12, 16.6, 1.1], f: true },
    { p: 'M4.6 19.6h14.8', t: 'soft' },
  ]),
  gateway: G('Gateway arch', '🚪', [
    { p: 'M4.4 20.6V10.2a7.6 7.6 0 0 1 15.2 0v10.4' },
    { p: 'M2.8 20.6h18.4' },
    { p: 'M8.2 20.6v-8.4a3.8 3.8 0 0 1 7.6 0v8.4', t: 'soft' },
  ]),
  'brain-box': G('Local mind', '🧠', [
    { r: [4.4, 4.4, 15.2, 15.2, 3] },
    { p: 'M14.8 12a2.8 2.8 0 1 0-2.8 2.8', t: 'soft' },
    { p: 'M9.2 12a2.8 2.8 0 0 1 2.8-2.8', t: 'soft' },
    { c: [12, 12, 0.9], t: 'soft', f: true },
  ]),
  'cloud-bolt': G('GPU cloud', '🎛', [
    { p: 'M7 16.4a4.3 4.3 0 0 1-.6-8.6 5.6 5.6 0 0 1 10.8-1 4.6 4.6 0 0 1-.6 9.6' },
    { p: 'M12.8 12.6 10 17h3l-1.6 4 4.4-5.6h-3Z', t: 'soft' },
  ]),
  // --- Hardware ---
  chip: G('Processor die', '🔲', [
    { r: [7, 7, 10, 10, 1.6] },
    { r: [10, 10, 4, 4, 0.8], t: 'soft' },
    { p: 'M9.4 7V4.4M14.6 7V4.4M9.4 19.6V17M14.6 19.6V17M7 9.4H4.4M7 14.6H4.4M19.6 9.4H17M19.6 14.6H17' },
  ]),
  gpu: G('Graphics card', '🎮', [
    { r: [3.4, 6.6, 17.2, 10, 1.6] },
    { c: [8.6, 11.6, 2.4], t: 'soft' },
    { c: [15.4, 11.6, 2.4], t: 'soft' },
    { p: 'M5.8 16.6v2.4M9.4 16.6v2.4M13 16.6v2.4', t: 'soft' },
  ]),
  gamepad: G('Game controller', '🎮', [
    { p: 'M7.6 6.8h8.8c2.8 0 4.8 2.2 5 5l.4 4.2a2.3 2.3 0 0 1-4 1.8l-2.4-2.4H8.6l-2.4 2.4a2.3 2.3 0 0 1-4-1.8l.4-4.2c.2-2.8 2.2-5 5-5Z' },
    { p: 'M8 10.2v3.2M6.4 11.8h3.2', t: 'soft' },
    { c: [15.2, 10.8, 0.9], t: 'soft', f: true },
    { c: [17.4, 12.8, 0.9], t: 'soft', f: true },
  ]),
  // --- Dev tools ---
  terminal: G('Terminal window', '⌨', [
    { r: [2.8, 4.4, 18.4, 15.2, 2] },
    { p: 'M6.6 9.2 9.8 12l-3.2 2.8' },
    { p: 'M12 15.4h5', t: 'soft' },
  ]),
  box: G('Package box', '📦', [
    { p: 'M12 3.6l7.6 4.2v8.4L12 20.4l-7.6-4.2V7.8Z' },
    { p: 'M4.4 7.8 12 12l7.6-4.2M12 12v8.4', t: 'soft' },
    { p: 'M8.2 5.7l7.6 4.2', t: 'soft' },
  ]),
  layout: G('Interface layout', '🎨', [
    { r: [2.8, 4.4, 18.4, 15.2, 2] },
    { p: 'M2.8 8.6h18.4M9.2 8.6v11', t: 'soft' },
    { p: 'M12.2 12h5.8M12.2 15.4h3.4', t: 'soft' },
  ]),
  factory: G('Factory', '🏭', [
    { p: 'M3.4 20.6V10l4.6 3.2V10l4.6 3.2V10l4.6 3.2v7.4' },
    { p: 'M2.6 20.6h18.8' },
    { p: 'M17.2 10V4.4h2.4v7.4', t: 'soft' },
    { p: 'M6.4 17h2M11 17h2', t: 'soft' },
  ]),
  // --- Infra & ops ---
  bolt: G('Lightning bolt', '⚡', [
    { p: 'M13.4 2.8 5.2 13.4h5.2L10.6 21l8.2-10.6h-5.2Z' },
  ]),
  database: G('Database cylinder', '🗄', [
    { p: 'M5 6.4v11.2c0 1.7 3.1 3 7 3s7-1.3 7-3V6.4' },
    { p: 'M5 6.4a7 2.8 0 0 0 14 0 7 2.8 0 0 0-14 0Z' },
    { p: 'M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3', t: 'soft' },
  ]),
  crane: G('Tower crane', '🏗', [
    { p: 'M7.2 20.6V4.8' },
    { p: 'M3.6 7.6h17M7.2 4.8 3.6 7.6M7.2 4.8l4.8 2.8' },
    { p: 'M17.2 7.6v4.6', t: 'soft' },
    { p: 'M15.4 12.2h3.6v2.6h-3.6Z', t: 'soft' },
    { p: 'M4.4 20.6h5.6', t: 'soft' },
  ]),
  infinity: G('Infinity loop', '🔁', [
    { p: 'M12 12c-1.6-2.2-3.2-3.4-5-3.4a3.4 3.4 0 0 0 0 6.8c1.8 0 3.4-1.2 5-3.4Z' },
    { p: 'M12 12c1.6-2.2 3.2-3.4 5-3.4a3.4 3.4 0 0 1 0 6.8c-1.8 0-3.4-1.2-5-3.4Z', t: 'soft' },
  ]),
  flag: G('Feature flag', '🚩', [
    { p: 'M6 21.2V3.4' },
    { p: 'M6 4.6c4.6-2 7.4 2 12 0v8.6c-4.6 2-7.4-2-12 0' },
    { p: 'M6 8.9c4.6-2 7.4 2 12 0', t: 'soft' },
  ]),
  eye: G('Watching eye', '👁', [
    { p: 'M2.8 12C5.4 7.6 8.6 5.4 12 5.4s6.6 2.2 9.2 6.6c-2.6 4.4-5.8 6.6-9.2 6.6S5.4 16.4 2.8 12Z' },
    { c: [12, 12, 2.7], t: 'soft' },
    { c: [12, 12, 0.9], t: 'soft', f: true },
  ]),
  // --- Data & search ---
  pipes: G('Data pipeline', '🔀', [
    { p: 'M3 7.4h6.8a4.4 4.4 0 0 1 4.4 4.4v4.8h6.4' },
    { p: 'M18.2 14l2.8 2.6-2.8 2.6' },
    { p: 'M3 11.8h4.6', t: 'soft' },
    { c: [5.2, 16.6, 0.9], t: 'soft', f: true },
  ]),
  vector: G('Vector space', '🧮', [
    { p: 'M4.4 3.4v16.2h16.2' },
    { p: 'M4.4 19.6 14.8 9.2M14.8 9.2h-4M14.8 9.2v4' },
    { c: [17.8, 6.2, 0.9], t: 'soft', f: true },
    { c: [19.4, 12.4, 0.9], t: 'soft', f: true },
    { c: [13.4, 16.2, 0.9], t: 'soft', f: true },
  ]),
  'search-spark': G('AI search', '🔎', [
    { c: [10.8, 10.8, 6.4] },
    { p: 'M15.5 15.5 21 21' },
    { p: 'M10.8 7.6l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8Z', t: 'soft', f: true },
  ]),
  web: G('Spider web', '🕸', [
    { p: 'M12 3.4v17.2M4.6 7.6l14.8 8.8M19.4 7.6 4.6 16.4' },
    { p: 'M12 7.4l3.9 2.3v4.6L12 16.6l-3.9-2.3V9.7Z', t: 'soft' },
    { p: 'M12 11l1.7 1-1.7 1-1.7-1Z', t: 'soft' },
  ]),
  'doc-scan': G('Scanned document', '📄', [
    { p: 'M4.4 7V5.4A1.6 1.6 0 0 1 6 3.8h2.2M15.8 3.8H18a1.6 1.6 0 0 1 1.6 1.6V7M19.6 17v1.6a1.6 1.6 0 0 1-1.6 1.6h-2.2M8.2 20.2H6a1.6 1.6 0 0 1-1.6-1.6V17' },
    { p: 'M8.6 8.4h6.8M8.6 12h6.8M8.6 15.6h4', t: 'soft' },
  ]),
  // --- Fintech ---
  percent: G('Tax percent', '🧮', [
    { p: 'M7.4 16.6 16.6 7.4' },
    { c: [8.4, 8.4, 1.9], t: 'soft' },
    { c: [15.6, 15.6, 1.9], t: 'soft' },
    { c: [12, 12, 8.6] },
  ]),
  'bank-platform': G('Banking platform', '🏦', [
    { r: [3.4, 3.4, 17.2, 17.2, 2.4] },
    { p: 'M7 10.4 12 7.2l5 3.2Z', t: 'soft' },
    { p: 'M9 12.4v3M12 12.4v3M15 12.4v3', t: 'soft' },
    { p: 'M7.4 17.4h9.2', t: 'soft' },
  ]),
  storefront: G('Storefront', '🏪', [
    { p: 'M4.2 9.2 5.8 4.6h12.4l1.6 4.6' },
    { p: 'M3.4 9.2h17.2v.6a2.9 2.9 0 0 1-5.8 0 2.85 2.85 0 0 1-5.7 0 2.85 2.85 0 0 1-5.7 0Z', t: 'soft' },
    { p: 'M5.4 13.8v6.8h13.2v-6.8' },
    { p: 'M13.6 20.6v-4.2h3v4.2', t: 'soft' },
  ]),
  stablecoin: G('Stablecoin', '🪙', [
    { c: [12, 12, 8.6] },
    { p: 'M8.6 10.2h6.8M8.6 13.8h6.8', t: 'soft' },
  ]),
  pos: G('Payment terminal', '📲', [
    { r: [6.4, 8.4, 11.2, 12.2, 2] },
    { r: [8.6, 10.8, 6.8, 3, 0.6], t: 'soft' },
    { c: [10, 17.4, 0.8], t: 'soft', f: true },
    { c: [13.8, 17.4, 0.8], t: 'soft', f: true },
    { p: 'M15.4 5.2a5.4 5.4 0 0 1 2.8 2.8M17.8 2.8a8.4 8.4 0 0 1 3.4 3.4', t: 'soft' },
  ]),
  'card-stack': G('Issued cards', '🪪', [
    { r: [3.2, 10.2, 15.2, 9.4, 1.6], t: 'soft' },
    { r: [5.8, 5.8, 15.2, 9.4, 1.6] },
    { p: 'M5.8 9.2H21', t: 'soft' },
  ]),
  // --- Commerce & customers ---
  'shopping-bag': G('Agentic bag', '🛍', [
    { p: 'M5.4 8.4h13.2l-1 12.2H6.4Z' },
    { p: 'M9 8.4V6.6a3 3 0 0 1 6 0v1.8', t: 'soft' },
    { p: 'M12 11.4l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7Z', t: 'soft', f: true },
  ]),
  'person-nodes': G('Customer graph', '🧲', [
    { c: [8.4, 8, 2.8] },
    { p: 'M3.4 19.6c.5-3.7 2.5-5.9 5-5.9 1.5 0 2.8.8 3.8 2.2' },
    { c: [17.8, 8.6, 1.5], t: 'soft' },
    { c: [19, 15.8, 1.5], t: 'soft' },
    { p: 'M11.1 8.3l5.2.2M12.8 15l4.7.6', t: 'soft' },
  ]),
  'chat-star': G('Feedback bubble', '💬', [
    { p: 'M12 3.8a8.2 8.2 0 0 0-6 13.8l-1.4 3.8 4.2-1.2A8.2 8.2 0 1 0 12 3.8Z' },
    { p: 'M12 7.8l1 2.5 2.7.2-2 1.8.6 2.6-2.3-1.4-2.3 1.4.6-2.6-2-1.8 2.7-.2Z', t: 'soft', f: true },
  ]),
  // --- Comms & productivity ---
  waveform: G('Speech waveform', '🎙', [
    { p: 'M12 4.8v14.4M8 7.4v9.2M16 7.4v9.2' },
    { p: 'M4 10v4M20 10v4', t: 'soft' },
  ]),
  'note-pen': G('Note and pen', '📝', [
    { r: [4.4, 3.4, 12.2, 17.2, 1.6] },
    { p: 'M7.4 8h6M7.4 11.4h6M7.4 14.8h3.4', t: 'soft' },
    { p: 'M13.6 21l1-3.2 4.6-4.6 2.2 2.2-4.6 4.6Z' },
  ]),
  flow: G('Automation flow', '🔁', [
    { c: [6, 6, 2.4] },
    { p: 'M8.4 6h6a2.8 2.8 0 0 1 2.8 2.8v1.6' },
    { p: 'M6 8.4v7a2.8 2.8 0 0 0 2.8 2.8h1.6', t: 'soft' },
    { r: [14.4, 10.8, 6, 4.4, 1], t: 'soft' },
    { r: [10.8, 16.2, 6, 4.4, 1], t: 'soft' },
  ]),
  // --- Security & legal ---
  'hardware-key': G('Hardware key', '🔑', [
    { r: [3.4, 9, 12.6, 6, 1.6] },
    { p: 'M16 10.2h4.2v3.6H16', t: 'soft' },
    { c: [8, 12, 1.7], t: 'soft' },
  ]),
  'otp-code': G('One-time code', '🔢', [
    { r: [4.4, 6.4, 15.2, 11.2, 2] },
    { c: [8.4, 11, 1.1], f: true },
    { c: [12, 11, 1.1], f: true },
    { c: [15.6, 11, 1.1], f: true },
    { p: 'M7.4 14.8h9.2', t: 'soft' },
  ]),
  // --- Sim & site chrome ---
  person: G('Person', '👤', [
    { c: [12, 7.4, 3.4] },
    { p: 'M5 20.2c.7-4.4 3.3-7 7-7s6.3 2.6 7 7' },
  ]),
  house: G('House', '🏠', [
    { p: 'M4 11.2 12 4.4l8 6.8' },
    { p: 'M6 10.4v9.8h12v-9.8' },
    { p: 'M10.2 20.2v-4.2a1.8 1.8 0 0 1 3.6 0v4.2', t: 'soft' },
  ]),
  stadium: G('Arena stadium', '🏟', [
    { p: 'M3 10.8c0 4.4 4 7.8 9 7.8s9-3.4 9-7.8' },
    { p: 'M3 10.8a9 3.4 0 0 0 18 0 9 3.4 0 0 0-18 0Z', t: 'soft' },
    { c: [12, 10.8, 1.1], t: 'soft', f: true },
  ]),
}

export const GLYPH_IDS = Object.keys(GLYPHS)

// A glyph id no GLYPHS entry covers renders this honest placeholder (a dashed empty frame),
// never a wrong concept — mirrors lib/icons.ts's THEME_FALLBACK_ICON posture. Tests enforce
// that live corpus tokens never reach it.
const FALLBACK: Glyph = G('Unknown concept', '', [
  { r: [4, 4, 16, 16, 3] },
  { p: 'M9 12h6', t: 'soft' },
])

function shapeEl(s: Shape, i: number, strong: string, soft: string) {
  const color = s.t === 'soft' ? soft : strong
  const paint = s.f
    ? { fill: color, fillOpacity: s.t === 'soft' ? 0.5 : 0.95, stroke: 'none' }
    : { fill: 'none', stroke: color }
  if (s.c) return <circle key={i} cx={s.c[0]} cy={s.c[1]} r={s.c[2]} {...paint} />
  if (s.r) return <rect key={i} x={s.r[0]} y={s.r[1]} width={s.r[2]} height={s.r[3]} rx={s.r[4] ?? 0} {...paint} />
  return <path key={i} d={s.p} {...paint} />
}

// Inline SVG sized like the emoji it replaces: 1em square, baseline-aligned, so every existing
// layout (table chips, DAG nodes, search rows) keeps its metrics. aria-hidden — the visible
// tooltip / sr-only naming stays the wrapper's job (components/IconChip.tsx enforces it).
export default function ProcessIcon({
  id,
  hue = 'zinc',
  className,
  size,
}: {
  id: string
  hue?: IconHue
  className?: string
  /** Explicit pixel size for gallery/preview use; defaults to 1em (inherits font size). */
  size?: number
}) {
  const glyph = GLYPHS[id] ?? FALLBACK
  const tones = ICON_HUES[hue] ?? ICON_HUES.zinc
  return (
    <svg
      viewBox="0 0 24 24"
      width={size ?? '1em'}
      height={size ?? '1em'}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      data-glyph={glyph === FALLBACK ? 'unknown' : id}
      className={className}
      style={size ? undefined : { verticalAlign: '-0.125em' }}
    >
      {glyph.shapes.map((s, i) => shapeEl(s, i, tones.strong, tones.soft))}
    </svg>
  )
}
