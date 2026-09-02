// Pure, `node:fs`-free helpers split out of lib/data.ts so CLIENT components (ArenaTable,
// StoryMatrix) can import them directly without dragging lib/data.ts's `node:fs`/`node:path`
// imports into the browser bundle — Turbopack hard-errors on a client-reachable module
// statically importing a Node builtin, even if the code path is never actually called client-
// side. lib/data.ts re-exports everything here for backward compatibility, so existing server
// call sites (`import { verdictFor } from '@/lib/data'`) are unaffected.
import type { Category, Claim, Evidence, Popularity, Product, Rankings, Stack, Story, Verdict } from './schemas'

// "canonical", "normalized · v2", etc — see lib/schemas.ts's StoryOriginSchema. Falls back to
// "unknown" for stories migrated/authored before origin existed. Shared by both the (client)
// StoryMatrix and the (server) product detail page, so it lives here rather than in either.
export function originLabel(story: Story): string {
  const origin = story.origin
  if (!origin) return 'unknown'
  return origin.promptVersion ? `${origin.kind} · ${origin.promptVersion}` : origin.kind
}

export interface CategoryData {
  category: Category
  products: Product[]
  stories: Story[]
  evidence: Record<string, Evidence[]>
  verdicts: Verdict[]
  rankings: Rankings
  stacks: Stack[]
  // Keyless popularity/momentum signal, keyed by productId — see lib/schemas.ts's
  // PopularityMapSchema and pipeline/stages/popularity.ts. `data/{cat}/popularity.json` is
  // optional (not every category has been through the popularity stage yet, and even when it
  // has, most products have no discoverable GitHub/npm/pypi signal), so this is `{}` rather
  // than undefined when absent — display code should look up by productId and treat a miss as
  // "no public signals", not as an error.
  popularity: Record<string, Popularity>
  // Keyed by productId — see lib/schemas.ts's ClaimSchema and pipeline/stages/claims.ts.
  // `data/{cat}/claims/` is optional (not every category has been through the claims stage yet)
  // and, even when present, an individual product's file may be missing — both cases resolve to
  // `[]` for that productId rather than an error, same "absence is not an error" contract as
  // popularity above.
  claims: Record<string, Claim[]>
}

export function battleSlug(a: string, b: string): string {
  return `${a}-vs-${b}`
}

export function parseBattleSlug(slug: string, products: Product[]): { a: string; b: string } | null {
  for (const a of products) {
    const prefix = `${a.id}-vs-`
    if (!slug.startsWith(prefix)) continue
    const b = slug.slice(prefix.length)
    if (b !== a.id && products.some((p) => p.id === b)) return { a: a.id, b }
  }
  return null
}

export function verdictFor(data: CategoryData, productId: string, storyId: string): Verdict {
  const v = data.verdicts.find((x) => x.productId === productId && x.storyId === storyId)
  if (!v) throw new Error(`missing verdict for cell ${productId}:${storyId}`)
  return v
}

export function evidenceById(data: CategoryData): Map<string, Evidence> {
  return new Map(Object.values(data.evidence).flat().map((e) => [e.id, e]))
}

// Every story title is authored as "As a(n) {persona description}, I can {capability}" (see
// pipeline/agentic-stories.ts + normalize.ts). The persona clause is redundant once a story has
// its own persona tag/column (StoryMatrix), so this strips it for *display only* — the
// underlying Story.title is never mutated, and if a title doesn't match the expected shape
// (defensive: hand-edited/legacy titles), it's returned unchanged rather than mangled.
const PERSONA_PREFIX = /^As an? .+?,\s*I can\s+/i

export function stripPersonaPrefix(title: string): string {
  const stripped = title.replace(PERSONA_PREFIX, '')
  if (stripped === title || stripped.length === 0) return title
  return stripped.charAt(0).toUpperCase() + stripped.slice(1)
}

// Buckets items by a key, preserving the order each key was first seen. Used to group
// stories/rounds by theme→group without imposing an alphabetical or schema-declared order.
export function groupInOrder<T>(items: T[], keyOf: (item: T) => string): Array<[string, T[]]> {
  const order: string[] = []
  const buckets = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    if (!buckets.has(key)) {
      buckets.set(key, [])
      order.push(key)
    }
    buckets.get(key)!.push(item)
  }
  return order.map((key) => [key, buckets.get(key)!])
}
