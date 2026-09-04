import { stripPersonaPrefix } from './data'
import { mcpEndpointFor } from './mcpEndpoints'
import { loadProcesses, processSlug, VENDOR_ARENA, type ProcessTask } from './processes'
import { proofsForProduct, readProofTranscript } from './proofs'
import type { Story } from './schemas'
import { stripSgr, type TryItStory } from './tryitReplay'

// Server-side assembly for the product pages' "Try it" section (components/TryIt/*): which
// products get the section at all, the story menu built from recorded proofs (lib/proofs.ts)
// plus the live MCP handshake (lib/mcpEndpoints.ts allowlist), and the founder-process
// cross-links. Client-safe types/logic live in lib/tryitReplay.ts — this module owns the fs
// reads and stays server-only.

// A product is "tryable" when it has at least one REPLAYABLE recorded proof (kind 'terminal' —
// video proofs play in ProofsSection, not the microterminal) or an allowlisted live MCP
// endpoint. Products with neither keep their existing primary CTA: no fake try.
export function hasTryIt(category: string, productId: string): boolean {
  return (
    proofsForProduct(category, productId).some((p) => p.kind === 'terminal') ||
    mcpEndpointFor(category, productId) !== null
  )
}

// The recorded-session story menu: one entry per terminal proof, titled by the prefixed user
// stories the proof substantiates. Transcripts are read and SGR-stripped here (server) so the
// client component receives plain serializable props.
export function buildRecordedStories(category: string, productId: string, stories: Story[]): TryItStory[] {
  const titleById = new Map(stories.map((s) => [s.id, stripPersonaPrefix(s.title)]))
  const entries: TryItStory[] = []
  for (const proof of proofsForProduct(category, productId)) {
    if (proof.kind !== 'terminal') continue
    const transcript = readProofTranscript(category, proof)
    if (!transcript) continue
    const titles = proof.storyIds.map((id) => titleById.get(id) ?? id)
    entries.push({
      id: proof.probeId,
      title: titles.join(' · ') || proof.probeId,
      kind: 'recorded',
      command: proof.command,
      recordedAt: proof.recordedAt,
      exitCode: proof.exitCode,
      transcript: stripSgr(transcript),
    })
  }
  return entries
}

export interface ProcessLink {
  slug: string
  title: string
}

// Founder processes (lib/processes.ts) whose DAG runs on this product — surfaced under the
// microterminal as future prefixed stories ("this product appears in: run-payroll →"). Uses
// the VENDOR_ARENA reverse mapping: a corpus vendor key equals the product id in its mapped
// arena, so `VENDOR_ARENA[productId] === category` means this product IS that vendor here.
export function processesFeaturing(category: string, productId: string, dir?: string): ProcessLink[] {
  if (VENDOR_ARENA[productId] !== category) return []
  const featuring = (task: ProcessTask) =>
    task.dag.nodes.some((n) => n.vendor === productId) || task.vendors.includes(productId)
  return loadProcesses(dir)
    .filter(featuring)
    .slice(0, 6)
    .map((t) => ({ slug: processSlug(t.title), title: t.title }))
}
