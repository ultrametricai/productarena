import { processManifestBySlug } from '@/lib/processManifest'
import { loadProcesses, processSlug } from '@/lib/processes'

// Machine-readable process manifest — the executor handoff contract (docs/AFK-HANDOFF.md).
// Public data: the published corpus reshaped, no gating. Static export safety: every {slug} is
// enumerated at build time (generateStaticParams + dynamicParams = false), same pattern as
// app/arena/[category]/llms.md/route.ts.
export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return loadProcesses().map((t) => ({ slug: processSlug(t.title) }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const manifest = processManifestBySlug(slug)
  if (!manifest) return new Response('not found', { status: 404 })
  // Pretty-printed on purpose — a public artifact humans will read in the browser too.
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
