import Link from 'next/link'
import { confidenceTitle, type ProductConfidence } from '@/lib/confidence'

// Small A–D grade chip rendered next to PA Score badges (MegaTable + ArenaTable): says how
// much of the score rests on tested vs claimed evidence (see lib/confidence.ts). Deliberately
// quiet — a letter, not another number — so it annotates the score without competing with it.
// The chip links to the methodology's confidence section: hover tooltips are unreliable on
// touch devices, so the explainer must always be one tap away.
const GRADE_CLASSES: Record<ProductConfidence['grade'], string> = {
  A: 'text-emerald-300 ring-emerald-400/40',
  B: 'text-emerald-400/80 ring-zinc-700',
  C: 'text-amber-400/90 ring-zinc-700',
  D: 'text-red-400/90 ring-red-900/60',
}

export default function ConfidenceChip({ confidence }: { confidence: ProductConfidence }) {
  return (
    <Link
      href="/methodology#confidence"
      title={confidenceTitle(confidence)}
      aria-label={`Confidence grade ${confidence.grade} — what the grades mean`}
      className={`inline-flex w-fit items-center rounded-full bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold ring-1 transition hover:ring-emerald-400/60 ${GRADE_CLASSES[confidence.grade]}`}
    >
      {confidence.grade}
    </Link>
  )
}
