import type { Category, Product, Story } from './schemas'

export type SearchEntryType = 'arena' | 'product' | 'story'

export interface SearchEntry {
  type: SearchEntryType
  label: string
  sublabel: string
  href: string
}

// Structural subset of CategoryData — narrowed so this module (and its tests) don't need to
// depend on lib/data's full CategoryData shape (evidence/verdicts/rankings/stacks), which
// would otherwise force every test fixture to fabricate unrelated fields. Any CategoryData[]
// (e.g. loadAll()'s return value) satisfies this shape as-is.
export interface SearchIndexSource {
  category: Pick<Category, 'id' | 'name'>
  products: Pick<Product, 'id' | 'name'>[]
  stories: Pick<Story, 'id' | 'title' | 'theme'>[]
}

// Build-time index for the ⌘K command palette: one flat array covering every arena, product,
// and story across all populated categories. Story entries link to the arena page's matrix,
// anchored at that story's row (see the `id="story-{storyId}"` added to StoryMatrix rows) —
// there's no single-story page, so the matrix is the closest addressable location.
export function buildSearchIndex(sources: SearchIndexSource[]): SearchEntry[] {
  const entries: SearchEntry[] = []

  for (const data of sources) {
    entries.push({
      type: 'arena',
      label: data.category.name,
      sublabel: `${data.products.length} product${data.products.length === 1 ? '' : 's'}`,
      href: `/arena/${data.category.id}`,
    })

    for (const p of data.products) {
      entries.push({
        type: 'product',
        label: p.name,
        sublabel: data.category.name,
        href: `/arena/${data.category.id}/product/${p.id}`,
      })
    }

    for (const s of data.stories) {
      entries.push({
        type: 'story',
        label: s.title,
        sublabel: `${data.category.name} · ${s.theme}`,
        href: `/arena/${data.category.id}#story-${s.id}`,
      })
    }
  }

  return entries
}
