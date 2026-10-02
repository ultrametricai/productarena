import { resolveServiceCandidates } from '@/lib/shared-processes/service-candidates'
import type { Reference } from '@/lib/shared-processes/schema'
import type { VendorCoverage } from '@/lib/shared-processes/vendor-preview'
import ServiceCandidateRows from './ServiceCandidateRows'

export default function ServiceCandidates({ references, separated = false, choiceScope, coverage, excludeIds = [] }: { references: Reference[]; separated?: boolean; choiceScope?: string; coverage?: Record<string, VendorCoverage>; excludeIds?: string[] }) {
  const candidates = resolveServiceCandidates(references).filter(candidate => !excludeIds.includes(candidate.id))
  if (coverage) candidates.sort((a, b) => (coverage[b.id]?.score ?? -1) - (coverage[a.id]?.score ?? -1))
  if (!candidates.length) return null
  return <div className={separated ? 'border-t border-zinc-800/50 pt-3' : undefined}>
    {excludeIds.length > 0 && <p className="mb-2 text-xs text-zinc-400">Other listed options</p>}
    <ServiceCandidateRows candidates={candidates} choiceScope={choiceScope} coverage={coverage} />
  </div>
}
