import Link from 'next/link'
import IconChip from '@/components/IconChip'
import ProductLogo from '@/components/ProductLogo'
import arenaIcons from '@/data/arena-icons.json'
import { loadArenaSections } from '@/lib/arenaSections'
import { loadAll, type CategoryData } from '@/lib/data'

// Visual arena navigation (founder 2026-09-23: "a main Arenas page that is a visual navigation
// of the arenas" + "a page for the grouped arenas") — the same curated sections as the header
// dropdown (data/arena-sections.json, every arena in exactly one section), rendered as scannable
// card grids: icon, name, the top products' logos, and the judged leader. One component serves
// /arenas (all sections), /arenas/[section] (one section), and the homepage's Arenas tab.

function ArenaCard({ data }: { data: CategoryData }) {
  const { leaderboard } = data.rankings
  const leaderEntry = leaderboard[0]
  const leader = data.products.find((p) => p.id === leaderEntry.productId)!
  return (
    <Link
      href={`/arena/${data.category.id}`}
      className="group rounded-xl border border-zinc-800 p-4 transition hover:border-emerald-400/60"
    >
      <div className="flex gap-1.5">
        {data.products.slice(0, 5).map((p) => (
          <div key={p.id} className="rounded-lg ring-2 ring-zinc-950">
            <ProductLogo product={p} size={28} />
          </div>
        ))}
      </div>
      <h3 className="font-display leading-[1.1] mt-3 flex items-center gap-1.5 text-base font-semibold group-hover:text-emerald-300">
        <IconChip
          icon={(arenaIcons as Record<string, string>)[data.category.id] ?? ''}
          title={`${data.category.name} arena`}
        />
        {data.category.name}
      </h3>
      {/* Founder 2026-09-24: no score badge on the cards — leader name only; the number lives
          on the arena leaderboard a click away. */}
      <div className="mt-2 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-zinc-400">
          {data.products.length} products · Overall score leader
        </p>
        <p className="truncate text-sm font-medium">{leader.name}</p>
      </div>
    </Link>
  )
}

export default function ArenasDirectory({
  sectionId,
  headingLevel = 'h2',
}: {
  // Render one section only (the /arenas/[section] page) — omit for the full directory.
  sectionId?: string
  headingLevel?: 'h2' | 'h3'
}) {
  const byId = new Map(loadAll().map((d) => [d.category.id, d]))
  const sections = loadArenaSections().filter((s) => !sectionId || s.id === sectionId)
  const H = headingLevel
  return (
    <div className="space-y-10">
      {sections.map((section) => {
        const arenas = section.arenaIds.map((id) => byId.get(id)).filter((d): d is CategoryData => !!d)
        if (arenas.length === 0) return null
        return (
          <section key={section.id} id={section.id} className="scroll-mt-4">
            <div className="flex items-baseline justify-between gap-3">
              <H className="font-display leading-[1.1] text-xl font-semibold tracking-tight">
                {sectionId ? section.name : (
                  <Link href={`/arenas/${section.id}`} className="transition hover:text-emerald-300">
                    {section.name}
                  </Link>
                )}
              </H>
              <span className="shrink-0 text-xs text-zinc-500">
                {arenas.length} arena{arenas.length === 1 ? '' : 's'}
                {!sectionId && (
                  <Link href={`/arenas/${section.id}`} className="ml-2 text-zinc-400 transition hover:text-emerald-300">
                    section page →
                  </Link>
                )}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {arenas.map((data) => (
                <ArenaCard key={data.category.id} data={data} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
