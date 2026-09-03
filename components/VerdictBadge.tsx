import type { Verdict } from '@/lib/schemas'

const STYLES: Record<Verdict['verdict'], string> = {
  full: 'bg-emerald-950 text-emerald-300 ring-emerald-800',
  partial: 'bg-emerald-950 text-emerald-300 ring-emerald-800',
  disputed: 'bg-red-950 text-red-300 ring-red-800',
  none: 'bg-zinc-900 text-zinc-500 ring-zinc-700',
  na: 'bg-zinc-900 text-zinc-400 ring-zinc-800 italic',
}

const LABELS: Record<Verdict['verdict'], string> = {
  full: 'full',
  partial: 'partial',
  disputed: 'disputed',
  none: 'none',
  na: 'n/a',
}

export default function VerdictBadge({ verdict }: { verdict: Verdict['verdict'] }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STYLES[verdict]}`}>
      {LABELS[verdict]}
    </span>
  )
}
