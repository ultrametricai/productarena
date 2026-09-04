import type { Metadata } from 'next'
import SubmitScan from '@/components/SubmitScan'

export const metadata: Metadata = {
  title: 'Test my product — ProductArena',
  description:
    'Paste your product URL for an instant agent-readiness quick scan (llms.txt, OpenAPI, MCP signals), then submit it for a full evidence-based arena evaluation.',
}

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display leading-[1.1] text-3xl font-bold tracking-tight">Test my product</h1>
        <p className="mt-3 text-zinc-400">
          Paste a product URL and we&rsquo;ll run an instant agent-readiness quick scan — the
          same well-known-path checks our pipeline probes first. Then submit it to compete in an
          arena with a full evidence-based evaluation.
        </p>
      </div>
      <SubmitScan />
      <p className="text-xs text-zinc-500">
        The scanner only fetches a fixed set of public, well-known paths (llms.txt, openapi.json,
        robots.txt, homepage) with strict limits — it never executes anything from the target,
        rejects internal or non-public addresses, and is rate-limited.
      </p>
    </div>
  )
}
