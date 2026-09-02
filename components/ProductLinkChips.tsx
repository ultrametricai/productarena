import type { Product } from '@/lib/schemas'

const LINK_KEYS = ['app', 'api', 'cli', 'mcp'] as const
type LinkKey = (typeof LINK_KEYS)[number]

const LETTER: Record<LinkKey, string> = { app: 'A', api: 'API', cli: 'CLI', mcp: 'MCP' }
const LABEL: Record<LinkKey, string> = { app: 'App', api: 'API docs', cli: 'CLI', mcp: 'MCP' }

// Product quick links (schema: Product.links). Curation is a separate pass — most products
// have none yet, so this renders nothing until a links object is present.
export default function ProductLinkChips({ product, variant }: { product: Product; variant: 'letter' | 'label' }) {
  const links = product.links
  if (!links) return null
  const present = LINK_KEYS.filter((k) => links[k])
  if (present.length === 0) return null

  const text = variant === 'letter' ? LETTER : LABEL
  const chipClass =
    variant === 'letter'
      ? 'rounded border border-zinc-800 px-1 py-0.5 text-[10px] font-medium text-zinc-400 hover:border-amber-400 hover:text-amber-300'
      : 'rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400 hover:border-amber-400 hover:text-amber-300'

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {present.map((k) => (
        <a key={k} href={links[k]} target="_blank" rel="noopener noreferrer" className={chipClass}>
          {text[k]}
        </a>
      ))}
    </div>
  )
}
