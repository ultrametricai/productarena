import Link from 'next/link'

// One chip = one verified integration neighbor: links to the neighbor's product page, and the
// title carries the verbatim evidence excerpt the edge rests on (plus which side's evidence said
// it). Server component, pure over serializable props — callers assemble ChipData from
// lib/integrations.ts's graph + productRefIndex.
export interface IntegrationChipData {
  productId: string
  name: string
  arenaId: string
  arenaName: string
  // Tooltip: the verbatim excerpt(s) + provenance ("from <product>'s evidence").
  title: string
}

// Tooltip text for one neighbor relation: every evidence-backed mention behind the edge, quoted
// verbatim with its provenance side.
export function chipTitle(
  sources: Array<{ fromProductId: string; excerpt: string }>,
  nameOf: (id: string) => string,
): string {
  return sources
    .map((s) => `“${s.excerpt}” — from ${nameOf(s.fromProductId)}'s evidence`)
    .join('\n')
}

// One chip on its own — /integrations' adjacency list composes these directly.
export function IntegrationChip({ chip }: { chip: IntegrationChipData }) {
  return (
    <Link
      href={`/arena/${chip.arenaId}/product/${chip.productId}`}
      title={chip.title}
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
    >
      <span className="font-medium">{chip.name}</span>
      <span className="text-[10px] uppercase tracking-wide text-zinc-500">{chip.arenaName}</span>
    </Link>
  )
}

export default function IntegrationChips({ chips }: { chips: IntegrationChipData[] }) {
  if (chips.length === 0) return null
  return (
    <div>
      <h2 className="font-display leading-[1.1] mb-1 text-lg font-semibold">Verified integrations</h2>
      <p className="mb-3 text-xs text-zinc-500">
        Connections to other tracked products, each backed by a verbatim quote from collected
        evidence (hover a chip to read it). A product missing here means no evidence of an
        integration was found in our corpus — never that it doesn&rsquo;t integrate.
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <IntegrationChip key={chip.productId} chip={chip} />
        ))}
      </div>
    </div>
  )
}
