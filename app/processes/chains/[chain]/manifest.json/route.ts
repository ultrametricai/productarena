import { chainManifestById } from '@/lib/processManifest'
import { loadChains } from '@/lib/processes'

// Chain-level manifest: one document composing every process manifest in the playbook, in run
// order — the executor handoff contract for an end-to-end run (docs/AFK-HANDOFF.md). Public
// data, statically enumerated like the per-process manifest route.
export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return loadChains().map((c) => ({ chain: c.id }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ chain: string }> }) {
  const { chain } = await params
  const manifest = chainManifestById(chain)
  if (!manifest) return new Response('not found', { status: 404 })
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
