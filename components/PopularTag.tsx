import popularIds from '@/data/popular-products.json'

const POPULAR = new Set<string>(popularIds as string[])

// Curated fallback for the popularity column: household-name products (closed SaaS, OS
// platforms) publish no registry signal, and a blank cell misreads as "nobody uses this".
// The tag is deliberately editorial-and-labeled, never a number — see the title copy.
export function isNotablyPopular(id: string): boolean {
  return POPULAR.has(id)
}

export default function PopularTag() {
  return (
    <span
      title="Widely adopted — closed product with no public registry signal, so no count to show"
      className="inline-flex w-fit items-center whitespace-nowrap rounded-full bg-zinc-900 px-1.5 py-px text-[9px] font-medium text-zinc-400 ring-1 ring-zinc-700"
    >
      Popular
    </span>
  )
}
