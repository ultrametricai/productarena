import fs from 'node:fs'
import path from 'node:path'

// Founder 2026-09-23: "show a flag on the vendor page if we have done a deep spike or surface
// spike." The flag is grounded in the two numbers we actually record — the product's evidence
// corpus size and its last spike date (data/spike-queue.json) — with the exact rule disclosed
// in the tooltip, never a vibe. DEEP_THRESHOLD mirrors the depth-wave target (~35 items ≈ the
// fleet median); products below it are honestly labeled surface coverage, and never-spiked
// products say so outright.
const DEEP_THRESHOLD = 35

const DATA_DIR = path.join(process.cwd(), 'data')

function evidenceCount(arenaId: string, productId: string): number {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, arenaId, 'evidence', `${productId}.json`), 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

function lastSpiked(arenaId: string, productId: string): string | null {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, 'spike-queue.json'), 'utf8')
    const queue: Array<{ arena: string; productId: string; lastSpiked?: string | null }> = JSON.parse(raw).queue
    return queue.find((e) => e.arena === arenaId && e.productId === productId)?.lastSpiked ?? null
  } catch {
    return null
  }
}

export default function SpikeDepthChip({ arenaId, productId }: { arenaId: string; productId: string }) {
  const count = evidenceCount(arenaId, productId)
  if (count === 0) return null
  const spiked = lastSpiked(arenaId, productId)
  const spikedDay = spiked ? spiked.slice(0, 10) : null
  const deep = count >= DEEP_THRESHOLD
  const label = deep ? 'deep-spiked' : spikedDay ? 'surface spike' : 'not yet spiked'
  const title = `Evidence coverage: ${count} cited evidence items (deep = ${DEEP_THRESHOLD}+); ${
    spikedDay ? `last evidence spike ${spikedDay}` : 'no evidence spike recorded yet — baseline crawl only'
  }. Depth says how hard we've looked, never how good the product is.`
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${
        deep
          ? 'border-emerald-400/40 bg-emerald-400/5 text-emerald-300'
          : 'border-zinc-700 bg-zinc-900/60 text-zinc-400'
      }`}
    >
      <span aria-hidden className="text-[10px]">{deep ? '◉' : '◎'}</span>
      {label}
      <span className="font-mono text-[10px] tabular-nums text-zinc-500">{count} ev</span>
    </span>
  )
}
