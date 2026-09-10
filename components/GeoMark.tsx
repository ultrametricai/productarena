// The geometric concept-mark system: a deterministic, seed-derived SVG glyph for CONCEPTS and
// SECTIONS (rankings, proofs, claims, stacks, pipeline stages…). It complements — never
// replaces — the emoji family that identifies arenas and themes (lib/icons.ts +
// data/arena-icons.json): emoji says "which arena/theme", a GeoMark says "which kind of view".
//
// Same seed → same mark, everywhere, forever: the seed is FNV-1a-hashed and the hash drives
// every parameter through a xorshift32 stream (no Math.random anywhere). Three families, all
// mathematically derived and on-brand for Ultrametric:
//
//   star    — star polygon {n/k}: n vertices (5–9) on a circle, every k-th connected. When
//             gcd(n,k) > 1 the figure degrades into its compound form — e.g. {6/2} is the
//             hexagram's two interlocking triangles, the same two-triangle construction as
//             the ProductArena logo mark.
//   phyllo  — phyllotaxis dot spiral: dot i sits at angle i·137.5077…° (the golden angle,
//             360°/φ²) and radius ∝ √i — the sunflower-seed packing.
//   dendro  — an ultrametric dendrogram: leaves on a common baseline merging at hash-chosen
//             heights. Ultrametric = every leaf equidistant from the root, which is literally
//             the company name.
//
// Monochrome currentColor strokes (1.5px, crisp at 14–20px) with exactly one emerald accent
// element. Pure and hook-free: safe in server pages and client components alike.

export type GeoVariant = 'star' | 'phyllo' | 'dendro'

const FAMILIES: GeoVariant[] = ['star', 'phyllo', 'dendro']
const GOLDEN_ANGLE = 137.50776405003785 // 360° − 360°/φ

// FNV-1a 32-bit — tiny, dependency-free, and stable across platforms.
function fnv1a(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

// xorshift32 over the seed hash: each call yields the next deterministic draw in [0, n).
function makeDraw(seed: string): (n: number) => number {
  let s = fnv1a(seed) || 0x9e3779b9 // xorshift can't leave 0
  return (n: number) => {
    s ^= (s << 13) >>> 0
    s >>>= 0
    s ^= s >>> 17
    s ^= (s << 5) >>> 0
    s >>>= 0
    return s % n
  }
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

interface StarSpec {
  family: 'star'
  n: number
  k: number
  rotation: number // degrees, 0.1° quantum — enough entropy that 60 seeds stay distinct
  accent: number // accented vertex index
}
interface PhylloSpec {
  family: 'phyllo'
  count: number
  rotation: number
  accent: number // accented dot index
}
interface DendroSpec {
  family: 'dendro'
  topology: 0 | 1 | 2 // balanced / left caterpillar / right caterpillar
  h1: number // lowest merge height (largest y)
  h2: number // second merge height
  rootY: number // root merge height (smallest y)
  accent: number // accented leaf index
}
export type GeoSpec = StarSpec | PhylloSpec | DendroSpec

export function geoSpec(seed: string, variant?: GeoVariant): GeoSpec {
  const draw = makeDraw(seed)
  const family = variant ?? FAMILIES[draw(FAMILIES.length)]
  if (family === 'star') {
    const n = 5 + draw(5) // 5..9
    // Largest k that isn't 1 (convex polygon) or n/2 (degenerate digons through the center).
    const kMax = n % 2 === 0 ? n / 2 - 1 : (n - 1) / 2
    const k = kMax <= 2 ? 2 : 2 + draw(kMax - 1)
    return { family, n, k, rotation: draw(3600) / 10, accent: draw(n) }
  }
  if (family === 'phyllo') {
    const count = 11 + draw(7) // 11..17 dots
    return { family, count, rotation: draw(3600) / 10, accent: draw(count) }
  }
  return {
    family,
    topology: draw(3) as 0 | 1 | 2,
    h1: 14 + draw(11) * 0.25, // 14..16.5 (y grows downward; ranges are disjoint so merges nest)
    h2: 9 + draw(11) * 0.25, // 9..11.5
    rootY: 4.5 + draw(7) * 0.25, // 4.5..6
    accent: draw(4),
  }
}

// Canonical string form of a mark — what the determinism/distinctness unit tests compare.
export function geoSignature(seed: string, variant?: GeoVariant): string {
  return JSON.stringify(geoSpec(seed, variant))
}

const r2 = (v: number) => Math.round(v * 100) / 100

const ACCENT = 'text-emerald-400'

function starShapes(spec: StarSpec) {
  const C = 12
  const R = 8.6
  const verts = Array.from({ length: spec.n }, (_, i) => {
    const a = ((spec.rotation + (i * 360) / spec.n - 90) * Math.PI) / 180
    return [r2(C + R * Math.cos(a)), r2(C + R * Math.sin(a))] as const
  })
  // gcd(n,k) > 1 → the compound figure: g separate {n/g}-gons, each started one vertex over.
  const g = gcd(spec.n, spec.k)
  const paths = Array.from({ length: g }, (_, p) => {
    const steps = spec.n / g
    const d = Array.from({ length: steps }, (_, j) => {
      const [x, y] = verts[(p + j * spec.k) % spec.n]
      return `${j === 0 ? 'M' : 'L'}${x} ${y}`
    }).join('')
    return `${d}Z`
  })
  const [ax, ay] = verts[spec.accent]
  return (
    <>
      <path d={paths.join('')} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={ax} cy={ay} r={1.5} fill="currentColor" className={ACCENT} />
    </>
  )
}

function phylloShapes(spec: PhylloSpec) {
  const C = 12
  const Rmax = 8.8
  return (
    <>
      {Array.from({ length: spec.count }, (_, i) => {
        const t = (i + 0.7) / spec.count
        const rad = Rmax * Math.sqrt(t)
        const a = ((spec.rotation + i * GOLDEN_ANGLE) * Math.PI) / 180
        return (
          <circle
            key={i}
            cx={r2(C + rad * Math.cos(a))}
            cy={r2(C + rad * Math.sin(a))}
            r={r2(1.5 - 0.7 * t)}
            fill="currentColor"
            className={i === spec.accent ? ACCENT : undefined}
          />
        )
      })}
    </>
  )
}

function dendroShapes(spec: DendroSpec) {
  const LEAF_XS = [5, 9.67, 14.33, 19] // 4 leaves, evenly spread
  const BASE = 19.5 // the ultrametric baseline every leaf sits on
  type Node = { x: number; y: number }
  const segs: string[] = []
  // A dendrogram merge: both children rise vertically to the merge height, joined by a
  // horizontal rung; the cluster continues from the rung's midpoint.
  const merge = (a: Node, b: Node, y: number): Node => {
    segs.push(`M${r2(a.x)} ${r2(a.y)}V${r2(y)}H${r2(b.x)}V${r2(b.y)}`)
    return { x: (a.x + b.x) / 2, y }
  }
  const leaf = (i: number): Node => ({ x: LEAF_XS[i], y: BASE })
  let root: Node
  if (spec.topology === 0) {
    root = merge(merge(leaf(0), leaf(1), spec.h1), merge(leaf(2), leaf(3), spec.h2), spec.rootY)
  } else if (spec.topology === 1) {
    root = merge(merge(merge(leaf(0), leaf(1), spec.h1), leaf(2), spec.h2), leaf(3), spec.rootY)
  } else {
    root = merge(leaf(0), merge(leaf(1), merge(leaf(2), leaf(3), spec.h1), spec.h2), spec.rootY)
  }
  segs.push(`M${r2(root.x)} ${r2(root.y)}V${r2(root.y - 2)}`) // root stem
  return (
    <>
      <path d={segs.join('')} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      {LEAF_XS.map((x, i) => (
        <circle key={i} cx={x} cy={21} r={1.1} fill="currentColor" className={i === spec.accent ? ACCENT : undefined} />
      ))}
    </>
  )
}

export interface GeoMarkProps {
  /** Concept identity — same seed renders the same mark everywhere on the site. */
  seed: string
  /** REQUIRED tooltip naming the concept (house rule — an unexplained icon is noise). */
  title: string
  size?: number
  className?: string
  /** Pin a family instead of letting the hash choose (e.g. dendro for hierarchy concepts). */
  variant?: GeoVariant
}

export default function GeoMark({ seed, title, size = 16, className = '', variant }: GeoMarkProps) {
  const spec = geoSpec(seed, variant)
  return (
    <span title={title} className={`inline-flex shrink-0 items-center ${className}`}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
        {spec.family === 'star' ? starShapes(spec) : spec.family === 'phyllo' ? phylloShapes(spec) : dendroShapes(spec)}
      </svg>
      <span className="sr-only">{title}</span>
    </span>
  )
}

// The hero-grade cousin: a faint, seed-unique phyllotaxis field for page headers (arena pages
// seed it with the arena id, so every arena header is subtly its own). Pure inline SVG in
// zinc-900 tones with a sparse emerald shimmer — no canvas, no client JS, and quiet enough
// (fill-only dots on the zinc-950 ground) that text on top keeps full contrast. Parent must
// be `relative isolate`.
export function GeoBackdrop({ seed, className = '' }: { seed: string; className?: string }) {
  const draw = makeDraw(`backdrop:${seed}`)
  const count = 90 + draw(40)
  const rotation = draw(3600) / 10
  const emeraldPhase = draw(11)
  const C = 100
  const Rmax = 92
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="absolute -right-10 -top-14 h-64 w-64 opacity-70 sm:-top-10 sm:right-6"
      >
        {Array.from({ length: count }, (_, i) => {
          const t = (i + 0.5) / count
          const rad = Rmax * Math.sqrt(t)
          const a = ((rotation + i * GOLDEN_ANGLE) * Math.PI) / 180
          const emerald = i % 11 === emeraldPhase
          return (
            <circle
              key={i}
              cx={r2(C + rad * Math.cos(a))}
              cy={r2(C + rad * Math.sin(a))}
              r={r2(2.2 - 1.1 * t)}
              fill="currentColor"
              className={emerald ? 'text-emerald-500/25' : 'text-zinc-800'}
            />
          )
        })}
      </svg>
    </div>
  )
}
