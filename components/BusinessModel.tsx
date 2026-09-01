import type { Product } from '@/lib/schemas'

// Renders the curated `Product.businessModel` field (schema: lib/schemas.ts). Optional —
// most call sites render nothing until a product has been curated with pricing data.

const CHIP_CLASS = 'inline-flex w-fit items-center rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-zinc-800'
const CHIP_CLASS_SM = 'inline-flex w-fit items-center rounded-full bg-zinc-900 px-1.5 py-0 text-[10px] font-medium text-zinc-500 ring-1 ring-zinc-800'

// Full "Business model" section for the product detail page: model chips + summary + pricing link.
export function BusinessModelSection({ product }: { product: Product }) {
  const bm = product.businessModel
  if (!bm) return null
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Business model</h2>
      <div className="rounded-xl border border-zinc-800 p-4">
        <div className="flex flex-wrap gap-1.5">
          {bm.models.map((m) => (
            <span key={m} className={CHIP_CLASS}>
              {m}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-zinc-400">{bm.summary}</p>
        <a
          href={bm.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-zinc-600 hover:text-amber-300"
        >
          pricing ↗
        </a>
      </div>
    </div>
  )
}

// Compact single chip for leaderboard rows: shows only the first model slug, full summary in the title tooltip.
export function BusinessModelChip({ product }: { product: Product }) {
  const bm = product.businessModel
  if (!bm) return null
  return (
    <span title={bm.summary} className={CHIP_CLASS_SM}>
      {bm.models[0]}
    </span>
  )
}

// One-line model-slug summary under a product name in BattleView, for at-a-glance comparison.
export function BusinessModelLine({ product }: { product: Product }) {
  const bm = product.businessModel
  if (!bm) return null
  return (
    <p title={bm.summary} className="truncate text-xs text-zinc-600">
      {bm.models.join(' · ')}
    </p>
  )
}
