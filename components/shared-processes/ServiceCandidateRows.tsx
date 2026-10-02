'use client'

import CoverageScore from './CoverageScore'
import Link from 'next/link'
import ProductLogoView from '@/components/ProductLogoView'
import type { ServiceCandidate } from '@/lib/shared-processes/service-candidates'
import type { VendorCoverage } from '@/lib/shared-processes/vendor-preview'
import { useRegionalVariant } from './RegionalVariant'
import { useVendorSelection } from './VendorSelection'

function CandidateRow({ candidate, choiceScope, coverage, scores }: { candidate: ServiceCandidate; choiceScope?: string; coverage?: VendorCoverage; scores: readonly number[] }) {
  const selection = useVendorSelection()
  const region = useRegionalVariant()
  if (region && `${region.decision?.scope}:default` === coverage?.scope && region.selected !== 'default') coverage = undefined
  const selected = choiceScope !== undefined && selection?.picks[choiceScope] === candidate.id
  const logo = <ProductLogoView product={{ id: candidate.logoId ?? candidate.id, name: candidate.name }} size={18} hasLogo={candidate.logoId !== null} />
  return <li className="border-b border-zinc-800/70 last:border-b-0">
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 transition hover:bg-zinc-900/60 ${selected ? 'bg-zinc-900/60' : ''}`}>
      {choiceScope && selection && <button type="button" aria-pressed={selected} aria-label={`Use ${candidate.name}`} onClick={() => selection.toggle(choiceScope, candidate.id)} className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-200"><span aria-hidden="true" className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${selected ? 'border-emerald-400 text-emerald-300' : 'border-zinc-600'}`}>{selected ? '✓' : ''}</span></button>}
      <span className="flex min-w-0 grow basis-20 items-center gap-2">
        {logo}
        {candidate.href ? <Link href={candidate.href} aria-label={`${candidate.name} profile`} className="min-w-0 break-words text-sm font-medium text-zinc-100 hover:text-emerald-300">{candidate.name}</Link> : <span className="min-w-0 break-words text-sm font-medium text-zinc-100">{candidate.name}</span>}
      </span>
      {coverage && <span className="ml-auto flex shrink-0 items-center justify-end gap-3">
        <CoverageScore score={coverage.score} scores={scores} title={`Filing story coverage ${coverage.score}/100 across ${coverage.storyCount} mapped stories for the default filing option.`} />
      </span>}
    </div>

  </li>
}

export default function ServiceCandidateRows({ candidates, choiceScope, coverage }: { candidates: ServiceCandidate[]; choiceScope?: string; coverage?: Record<string, VendorCoverage> }) {
  const region = useRegionalVariant()
  const isForeign = region?.decision && region.selected !== 'default'
  const hasScores = !isForeign && coverage && Object.keys(coverage).length > 0
  return <>
    {hasScores && <p className="mb-2 text-xs text-zinc-400" title="Weighted coverage of the default filing step’s mapped stories, including manual workflows and APIs; not an automation probability or a whole-process score.">Filing coverage · /100</p>}
    <ul aria-label="Service options" className="overflow-hidden rounded-2xl border border-zinc-800">
      {candidates.map(candidate => <CandidateRow scores={candidates.flatMap(item => coverage?.[item.id] && coverage[item.id].scope === coverage?.[candidate.id]?.scope ? [coverage[item.id].score] : [])} key={candidate.id} candidate={candidate} choiceScope={choiceScope} coverage={coverage?.[candidate.id]} />)}
    </ul>
  </>
}
