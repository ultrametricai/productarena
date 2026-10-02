import Microterminal from '@/components/TryIt/Microterminal'
import { mcpEndpointFor } from '@/lib/mcpEndpoints'
import type { Story } from '@/lib/schemas'
import { buildRecordedStories, mcpDocsUrlFor } from '@/lib/tryit'

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

  return (
    <div id="try-it" className="scroll-mt-4">
      {/* Founder 2026-10-02 declutter: the Experimental chip and the long explainer paragraph
          are gone. The honesty contract lives in the microterminal itself and survives intact —
          the per-run "recorded session — replayed, not live" / "live — run just now" badges, the
          LIVE divider, the ▶ run-live affordance, and the per-story footer provenance line
          (recorded date · exit code · "captured verbatim by our probe harness"). Every
          disclosure the paragraph carried is covered by those per-line labels. */}
      <h2 className="font-display leading-[1.1] mb-3 text-lg font-semibold">
        Try it agentically
      </h2>
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
