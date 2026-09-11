import Link from 'next/link'
import { loadCategory } from '@/lib/data'
import { familyForProduct, loadFamilies } from '@/lib/families'

// "Product lines" block on a product page — rendered for EVERY product that belongs to a
// family in data/product-families.json (parent or judged sub-product — see lib/families.ts),
// never vendor-special-cased. Links to the /family/[id] breakdown page plus directly to the
// sibling lines already judged in their own arenas. Renders nothing for the ~all products
// with no family entry (absence of a family is not a state worth announcing).
export default function FamilySection({ arenaId, productId }: { arenaId: string; productId: string }) {
  const family = familyForProduct(loadFamilies(), arenaId, productId)
  if (!family) return null

  // Judged sibling lines (not the product being viewed), with their live rank pulled from
  // their own arena — same read the family page does, kept to a chip's worth of data here.
  const siblings = family.subProducts.flatMap((sub) => {
    const ref = sub.arenaRef
    if (!ref || (ref.arenaId === arenaId && ref.productId === productId)) return []
    try {
      const data = loadCategory(ref.arenaId)
      const idx = data.rankings.leaderboard.findIndex((e) => e.productId === ref.productId)
      if (idx === -1) return []
      return [{
        key: `${ref.arenaId}/${ref.productId}`,
        name: sub.name,
        href: `/arena/${ref.arenaId}/product/${ref.productId}`,
        arenaName: data.category.name,
        rank: idx + 1,
      }]
    } catch {
      return []
    }
  })
  const pageOnly = family.subProducts.filter((sub) => sub.arenaRef === null).length

  return (
    <div className="rounded-xl border border-zinc-800 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold leading-tight">Product lines</h2>
        <Link
          href={`/family/${family.id}`}
          className="text-sm text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 transition hover:text-emerald-200"
        >
          {family.name}, product by product →
        </Link>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        {family.name} ships more than one product
        {siblings.length > 0 && ' — these lines are judged in their own arenas'}
        {pageOnly > 0 && `${siblings.length > 0 ? ';' : ' —'} ${pageOnly} more ${pageOnly === 1 ? 'line has' : 'lines have'} no fitting arena yet`}.
      </p>
      {siblings.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {siblings.map((s) => (
            <Link
              key={s.key}
              href={s.href}
              className="rounded-full border border-zinc-800 px-2.5 py-1 text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
            >
              {s.name} · #{s.rank} in {s.arenaName}
            </Link>
          ))}
        </p>
      )}
    </div>
  )
}
