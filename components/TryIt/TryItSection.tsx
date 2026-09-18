import Link from 'next/link'
import Microterminal from '@/components/TryIt/Microterminal'
import { mcpEndpointFor } from '@/lib/mcpEndpoints'
import type { Story } from '@/lib/schemas'
import { buildRecordedStories, mcpDocsUrlFor, processesFeaturing } from '@/lib/tryit'

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

  const anyLive = recorded.some((s) => s.live)

  return (
    <div id="try-it" className="scroll-mt-4">
      <h2 className="font-display leading-[1.1] mb-1 flex items-center gap-2 text-lg font-semibold">
        Try it agentically
        <span
          title="This section is experimental — recorded replays are stable; live re-runs and the live MCP handshake are new and may change"
          className="rounded border border-amber-400/50 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300"
        >
          Experimental
        </span>
      </h2>
      <p className="mb-3 text-xs text-zinc-400">
        See what an agent can do with {productName} before you ever sign up. Pick a story:
        recorded sessions replay real probe-harness transcripts;
        {anyLive
          ? ' commands tagged live-capable can re-run against the real endpoint from our edge, right now (▶ run live — the exact same request, live and recorded lines always labeled);'
          : ''}
        {endpoint
          ? ' the live MCP handshake runs real requests from our edge, right now — including, where the server allows it, one real read-only tool call (bring your own key for auth-gated servers);'
          : ''}{' '}
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
        arena={category}
        product={productId}
        productName={productName}
        stories={recorded}
        probe={endpoint ? { arena: category, product: productId, endpoint, docsUrl: mcpDocsUrlFor(category, productId) } : null}
      />
    </div>
  )
}
