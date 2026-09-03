import ProofBlock from '@/components/ProofBlock'
import { proofsForProduct, readProofTranscript } from '@/lib/proofs'
import type { Story } from '@/lib/schemas'
import { stripPersonaPrefix } from '@/lib/data'
import { withBase } from '@/lib/site'

// Server component: the product page's "Probe proofs" section — every replayable recording
// captured by the probe-record stage / browser-proof recorder for this product, each linking
// back to the story rows (#story-<id>) it substantiates. Additive by design: products without
// recordings render nothing, and the story table itself is untouched (its rows are client-side;
// proofs stay a server-read sibling section rather than crossing that boundary).
export default function ProofsSection({
  category,
  productId,
  stories,
}: {
  category: string
  productId: string
  stories: Story[]
}) {
  const proofs = proofsForProduct(category, productId)
  if (proofs.length === 0) return null

  const storyTitles = Object.fromEntries(stories.map((s) => [s.id, stripPersonaPrefix(s.title)]))

  return (
    <div>
      <h2 className="font-display leading-[1.1] mb-1 text-lg font-semibold">Probe proofs</h2>
      <p className="mb-3 text-xs text-zinc-400">
        Replayable recordings from our probe harness — each command ran for real on our machines, keyless, with the
        session captured verbatim (secrets are redacted before publication). See the{' '}
        <a
          href="https://github.com/ultrametricai/productarena/blob/main/docs/PROVE-IT.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-300 underline decoration-emerald-300/40 hover:decoration-emerald-300"
        >
          Prove-It protocol
        </a>{' '}
        to submit one.
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        {proofs.map((entry) => (
          <ProofBlock
            key={`${entry.productId}-${entry.probeId}`}
            entry={entry}
            transcript={readProofTranscript(category, entry)}
            videoSrc={entry.kind === 'video' ? withBase(`/data/${category}/proofs/${entry.file}`) : undefined}
            storyTitles={storyTitles}
          />
        ))}
      </div>
    </div>
  )
}
