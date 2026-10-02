import { notFound } from 'next/navigation'
import { RegionalCoverageNote } from './RegionalVariant'
import SharedProcessReader from './SharedProcessReader'
import { findSharedRecord, readSharedCatalog } from '@/lib/shared-processes/reader'
import { loadProcesses } from '@/lib/processes'
import ProcessLeaderboard from '@/components/ProcessLeaderboard'
import { buildComposedComparisons } from '@/lib/shared-processes/composed-preview'
import { buildProcessProviderChoice } from '@/lib/shared-processes/provider-choice'
import { buildVendorPreview } from '@/lib/shared-processes/vendor-preview'

export default function SharedProcessPreview({ id }: { id: string }) {
  const records = readSharedCatalog()
  const record = findSharedRecord(records, id)
  if (!record) notFound()
  // Existing vendor coverage stays supplementary. It supplies no content or edges to the reader.
  const coverage = loadProcesses().find(task => task.id === record.id)
  const comparisons = buildComposedComparisons(record, records)
  return <SharedProcessReader
    record={record}
    records={records}
    vendorPreview={buildVendorPreview(record)}
    comparisons={comparisons}
    processChoice={buildProcessProviderChoice(record, comparisons)}
    supplementary={coverage ? <ProcessLeaderboard task={coverage} showStepStrip={false} scopeNote={<RegionalCoverageNote />} /> : undefined}
  />
}
