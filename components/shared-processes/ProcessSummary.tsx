'use client'

import type { SharedRecord } from '@/lib/shared-processes/schema'
import { processSummary } from '@/lib/shared-processes/summary'
import { useRegionalVariant } from './RegionalVariant'
export { processSummary } from '@/lib/shared-processes/summary'

export function ProcessTitle({ title, agent }: { title: string; agent: number | null }) {
  const region = useRegionalVariant()
  const showSuffix = agent !== null && (!region?.decision || region.selected === 'default')
  return <>{title}{showSuffix && !/using ai\s*$/i.test(title) && <span className="font-normal text-[#85858f]"> using AI</span>}</>
}

export default function ProcessSummary({ record, records = [] }: { record: SharedRecord; records?: SharedRecord[] }) {
  const summary = processSummary(record, records)
  const region = useRegionalVariant()
  // A regional option is not a verified whole-process path. Do not sum its
  // alternatives or imply the downstream legacy route classifications apply.
  if (region?.decision && region.selected !== 'default') return null
  if (summary.steps === null && summary.agent === null && summary.unverified === null) return null
  return <dl aria-label="Process summary" className="mt-6 flex flex-wrap gap-x-6 gap-y-3" title="Existing default-path route classifications, not verified tool integrations. Conditional add-ons and alternative branches are not counted.">
    {summary.steps !== null && <div className="flex items-baseline gap-1.5"><dd className="text-base font-medium text-zinc-200">{summary.steps}</dd><dt className="text-sm text-zinc-400">Steps{summary.subprocesses !== null && ` across ${summary.subprocesses} subprocesses`}</dt></div>}
    {summary.agent !== null && <div className="flex items-baseline gap-1.5"><dd className="text-base font-medium text-zinc-200">{summary.agent}</dd><dt className="text-sm text-zinc-400">Agent</dt></div>}
    {summary.unverified !== null && <div className="flex items-baseline gap-1.5"><dd className="text-base font-medium text-zinc-200">{summary.unverified}</dd><dt className="text-sm text-zinc-400">Agent · unverified</dt></div>}
    {summary.approvals !== null && <div className="flex items-baseline gap-1.5" title="Known approval gates on these agent-classified steps, not an exact interruption count; other human work and runtime batching can differ"><dd className="text-base font-medium text-zinc-200">{summary.approvals}</dd><dt className="text-sm text-zinc-400">Agent-step approvals</dt></div>}
    {summary.person !== null && <div className="flex items-baseline gap-1.5"><dd className="text-base font-medium text-zinc-200">{summary.person}</dd><dt className="text-sm text-zinc-400">Human or computer use</dt></div>}
    {summary.manual !== null && <div className="flex items-baseline gap-1.5"><dd className="text-base font-medium text-zinc-200">{summary.manual}</dd><dt className="text-sm text-zinc-400">Manual form</dt></div>}
    {summary.signature !== null && <div className="flex items-baseline gap-1.5"><dd className="text-base font-medium text-zinc-200">{summary.signature}</dd><dt className="text-sm text-zinc-400">Human signature</dt></div>}
    <div className="basis-full"><dt className="sr-only">Assessment basis</dt><dd className="text-xs text-zinc-500">Default scope · source classifications · integrations not verified</dd></div>
  </dl>
}
