import Link from 'next/link'
import InstallCommands from '@/components/InstallCommands'
import ProductLinkChips from '@/components/ProductLinkChips'
import { battleSlug, type CategoryData } from '@/lib/data-helpers'
import { REPO, withBase } from '@/lib/site'

// "What you can do here" rail for the product page: every actionable thing — open the app/docs,
// install, compare head-to-head, contest a verdict, agent-readable exports — in one quiet strip
// right under the header. Server component; each entry renders only when its target actually
// exists (no dead links for products without curated links/install commands).

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[10px] uppercase tracking-widest text-zinc-500">{children}</p>
}

export default function ProductActions({ data, productId }: { data: CategoryData; productId: string }) {
  const product = data.products.find((p) => p.id === productId)!
  const category = data.category.id
  const rivals = data.products.filter((p) => p.id !== productId)

  // Battle slugs are ordered by each product's position in data.products (see lib/data.ts's
  // battleSlug + how rankings.battles is built) — replicate that ordering so /vs/ links resolve.
  const idx = (pid: string) => data.products.findIndex((p) => p.id === pid)
  const slugFor = (rivalId: string) => {
    const [a, b] = idx(productId) <= idx(rivalId) ? [productId, rivalId] : [rivalId, productId]
    return battleSlug(a, b)
  }

  const hasLinks = product.links !== undefined && Object.values(product.links).some(Boolean)
  const hasInstall = (product.install?.length ?? 0) > 0

  // Same prefilled-issue mechanism as ContestLink, minus a specific story — the per-verdict ⚑
  // links in the table below fill that in.
  const contestParams = new URLSearchParams({
    template: 'contest-verdict.md',
    labels: 'contest',
    title: `[contest] ${category}/${productId}/<story-id>`,
  })
  const contestUrl = `https://github.com/${REPO}/issues/new?${contestParams.toString()}`

  const linkClass = 'text-zinc-400 underline decoration-zinc-800 hover:text-emerald-300'

  return (
    <div className="rounded-xl border border-zinc-800 p-4">
      <p className="text-[10px] uppercase tracking-widest text-emerald-400">What you can do here</p>
      <div className="mt-3 grid gap-x-6 gap-y-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
        {hasLinks && (
          <div>
            <SectionLabel>Open</SectionLabel>
            <ProductLinkChips product={product} variant="label" />
          </div>
        )}

        {hasInstall && (
          <div className="min-w-0">
            <SectionLabel>Install</SectionLabel>
            <InstallCommands product={product} />
          </div>
        )}

        {rivals.length > 0 && (
          <div>
            <SectionLabel>Compare head-to-head</SectionLabel>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {rivals.map((rival) => (
                <Link key={rival.id} href={`/vs/${slugFor(rival.id)}`} className={linkClass}>
                  vs {rival.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>Contest</SectionLabel>
          <a href={contestUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            ⚑ Contest a verdict
          </a>
          <p className="mt-1 text-zinc-500">
            Prefilled GitHub issue — or use the ⚑ next to any verdict below.
          </p>
        </div>

        <div>
          <SectionLabel>Badge</SectionLabel>
          <Link href={`/badges#${productId}`} className={linkClass}>
            Embed this product&apos;s score badge →
          </Link>
          <p className="mt-1 text-zinc-500">
            Hotlinked SVG — always shows the live current score.
          </p>
        </div>

        <div>
          <SectionLabel>For agents</SectionLabel>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href={`/arena/${category}/product/${productId}/llms.md`} className={linkClass}>
              This page as markdown
            </Link>
            <Link href="/llms.txt" className={linkClass}>
              /llms.txt
            </Link>
          </div>
        </div>

        <div>
          <SectionLabel>Data</SectionLabel>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {/* Static /data mirror (see scripts/copy-data.mjs + app/openapi.json) — plain <a>,
                so the basePath prefix is applied by hand per lib/site.ts. */}
            <a href={withBase(`/data/${category}/evidence/${productId}.json`)} className={linkClass}>
              Evidence (JSON)
            </a>
            <a href={withBase(`/data/${category}/verdicts.json`)} className={linkClass}>
              Verdicts (JSON)
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
