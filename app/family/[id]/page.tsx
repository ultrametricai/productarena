import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { battleSlug, loadCategory } from '@/lib/data'
import { loadFamilies, type Family, type FamilyProductRef } from '@/lib/families'

// One vendor, product by product (data/product-families.json — see lib/families.ts for the
// data contract). Each product line is a card: lines judged as their own product in an arena
// (arenaRef) deep-link to that product page with the LIVE rank and PA Score pulled from the
// arena's rankings.json, plus head-to-head battle links against their arena rivals; lines with
// no fitting arena render an honest "not yet judged" state — never a fabricated score. Fully
// static — params come from the families file, unknown ids 404 (dynamicParams = false), same
// contract as app/icp/[type]/page.tsx.

export function generateStaticParams() {
  return loadFamilies().map((f) => ({ id: f.id }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const family = loadFamilies().find((f) => f.id === id)
  return {
    title: `${family ? family.name : id}, product by product — ProductArena`,
    description: family
      ? `${family.name}'s product lines broken out one by one: which are judged in a ProductArena arena (with live rank and PA Score) and which have no arena yet.`
      : undefined,
  }
}

// Everything a judged line's card needs, resolved once from the arena's rankings — kept in a
// helper so the "judged" branch below stays readable. Null when the ref's arena isn't loadable
// or the product is missing from its leaderboard (the families test forbids both, but a page
// must degrade to the not-yet-judged state rather than crash).
function judgedCard(ref: FamilyProductRef | null) {
  if (!ref) return null
  try {
    const data = loadCategory(ref.arenaId)
    const idx = data.rankings.leaderboard.findIndex((e) => e.productId === ref.productId)
    if (idx === -1) return null
    const entry = data.rankings.leaderboard[idx]
    const product = data.products.find((p) => p.id === entry.productId)
    if (!product) return null
    // Head-to-head links against this line's arena rivals, leaderboard order — the canonical
    // /vs mirror of the arena battle pages (see app/sitemap.ts's comment).
    const battles = data.rankings.leaderboard
      .filter((e) => e.productId !== entry.productId)
      .map((rival) => ({
        rivalName: data.products.find((p) => p.id === rival.productId)?.name ?? rival.productId,
        href: `/vs/${battleSlug(entry.productId, rival.productId)}`,
      }))
    return {
      arenaId: data.category.id,
      arenaName: data.category.name,
      productId: entry.productId,
      productName: product.name,
      rank: idx + 1,
      of: data.rankings.leaderboard.length,
      paScore: entry.aiEra,
      battles,
    }
  } catch {
    return null
  }
}

export default async function FamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const family: Family | undefined = loadFamilies().find((f) => f.id === id)
  if (!family) notFound()

  const parent = judgedCard(family.parent)
  const judgedCount = family.subProducts.filter((s) => s.arenaRef !== null).length

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">Product family</p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">
          {family.name}, product by product
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-400">{family.tagline}</p>
        <p className="mt-3 text-sm text-zinc-500">
          {judgedCount} of {family.subProducts.length} lines judged in an arena
          {parent && (
            <>
              {' · flagship: '}
              <Link
                href={`/arena/${parent.arenaId}/product/${parent.productId}`}
                className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 transition hover:text-emerald-200"
              >
                {parent.productName} in {parent.arenaName}
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {family.subProducts.map((sub) => {
          const judged = judgedCard(sub.arenaRef)
          return (
            <div key={sub.id} className="flex flex-col rounded-xl border border-zinc-800 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display flex items-baseline gap-2 text-lg font-semibold leading-tight">
                  {sub.name}
                  {sub.acquired && (
                    <span title={sub.acquired} className="rounded-full border border-amber-800 bg-amber-950/60 px-1.5 py-px text-[9px] font-medium uppercase tracking-wide text-amber-300">
                      acquired
                    </span>
                  )}
                </h2>
                {judged ? (
                  <span className="shrink-0 rounded-full border border-emerald-400/40 bg-emerald-400/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    Judged
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Not yet judged
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-400">{sub.blurb}</p>
              <p className="mt-1">
                <a
                  href={sub.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-zinc-500 underline decoration-zinc-800 underline-offset-2 transition hover:text-emerald-300"
                >
                  {new URL(sub.docsUrl).hostname.replace(/^www\./, '')}{new URL(sub.docsUrl).pathname !== '/' ? new URL(sub.docsUrl).pathname : ''} ↗
                </a>
              </p>
              {judged ? (
                <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
                  <p className="text-sm">
                    <Link
                      href={`/arena/${judged.arenaId}/product/${judged.productId}`}
                      className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 transition hover:text-emerald-200"
                    >
                      {judged.productName} in the {judged.arenaName} arena →
                    </Link>
                  </p>
                  <p className="text-sm text-zinc-400">
                    Rank <span className="font-mono tabular-nums text-zinc-200">#{judged.rank}</span> of{' '}
                    <span className="font-mono tabular-nums">{judged.of}</span>
                    {judged.paScore !== null && (
                      <>
                        {' · PA Score '}
                        <span className="font-mono tabular-nums text-zinc-200">{judged.paScore.toFixed(1)}</span>
                      </>
                    )}
                  </p>
                  {judged.battles.length > 0 && (
                    <p className="flex flex-wrap gap-1.5 text-xs">
                      {judged.battles.map((b) => (
                        <Link
                          key={b.href}
                          href={b.href}
                          className="rounded-full border border-zinc-800 px-2 py-0.5 text-zinc-400 transition hover:border-emerald-400/60 hover:text-emerald-300"
                        >
                          vs {b.rivalName}
                        </Link>
                      ))}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 border-t border-zinc-800 pt-3">
                  {/* Honest empty state: no arena where this line competes yet, so no score at
                      all — never a placeholder number. `note` explains why (no fitting arena,
                      or already scored inside the parent's own entry). */}
                  <p className="text-sm italic text-zinc-500">
                    {sub.note ?? 'Not yet judged — no arena where it competes.'}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-zinc-500">
        A judged line competes in its arena on the same stories as every rival — family
        membership never affects scoring. Lines without a fitting arena stay unscored until one
        exists. See the <Link href="/methodology" className="underline decoration-zinc-800 underline-offset-2 transition hover:text-emerald-300">methodology</Link>.
      </p>
    </div>
  )
}
