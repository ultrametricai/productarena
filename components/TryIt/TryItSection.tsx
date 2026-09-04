import Link from 'next/link'
import Microterminal from '@/components/TryIt/Microterminal'
import { mcpEndpointFor } from '@/lib/mcpEndpoints'
import type { Story } from '@/lib/schemas'
import { buildRecordedStories, processesFeaturing } from '@/lib/tryit'

// Server component: the product page's "Try it" section — the destination of the header's
// primary "Try it →" CTA (id="try-it"). Assembles the microterminal's story menu from this
// product's recorded proofs (lib/tryit.ts) and, when the product has an allowlisted remote MCP
// endpoint (lib/mcpEndpoints.ts), the live handshake probe. Renders nothing for products with
// neither — no fake try. Also cross-links the founder processes this product appears in
// (lib/processes.ts VENDOR_ARENA reverse lookup) as future prefixed stories.
export default function TryItSection({
  category,
  productId,
  productName,
  stories,
}: {
  category: string
  productId: string
  productName: string
  stories: Story[]
}) {
  const recorded = buildRecordedStories(category, productId, stories)
  const endpoint = mcpEndpointFor(category, productId)
  if (recorded.length === 0 && !endpoint) return null

  const processes = processesFeaturing(category, productId)

  return (
    <div id="try-it" className="scroll-mt-4">
      <h2 className="font-display leading-[1.1] mb-1 text-lg font-semibold">Try it</h2>
      <p className="mb-3 text-xs text-zinc-400">
        See what an agent can do with {productName} before you ever sign up. Pick a story:
        recorded sessions replay real probe-harness transcripts;
        {endpoint ? ' the live MCP handshake runs one real request from our edge, right now;' : ''}{' '}
        sandboxed self-drive sessions are designed and gated (
        <a
          href="https://github.com/ultrametricai/productarena/blob/main/docs/TRY-IT.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-300 underline decoration-emerald-300/40 hover:decoration-emerald-300"
        >
          docs/TRY-IT.md
        </a>
        ).
      </p>
      <Microterminal
        productName={productName}
        stories={recorded}
        probe={endpoint ? { arena: category, product: productId, endpoint } : null}
      />
      {processes.length > 0 && (
        <p className="mt-2 text-xs text-zinc-500">
          Future stories — this product appears in:{' '}
          {processes.map((p, i) => (
            <span key={p.slug}>
              {i > 0 && ' · '}
              <Link href={`/processes/${p.slug}`} className="text-zinc-400 underline decoration-zinc-800 hover:text-emerald-300">
                {p.title} →
              </Link>
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
