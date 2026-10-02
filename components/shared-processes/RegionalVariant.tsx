'use client'

import { createContext, useContext, useId, useState, type ReactNode } from 'react'
import type { regionalDecision } from '@/lib/shared-processes/regions'

type Decision = ReturnType<typeof regionalDecision>
const RegionContext = createContext<{ decision: Decision; selected: string; select: (id: string) => void } | null>(null)

export function RegionalVariantProvider({ decision, children }: { decision: Decision; children: ReactNode }) {
  const [selected, select] = useState('default')
  return <RegionContext.Provider value={{ decision, selected, select }}>{children}</RegionContext.Provider>
}

export function useRegionalVariant() { return useContext(RegionContext) }

export function RegionalVariantSelector() {
  const state = useRegionalVariant()
  const id = useId()
  if (!state?.decision) return null
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm text-zinc-400">Regional variant</label>
    <select id={id} value={state.selected} onChange={event => state.select(event.target.value)} aria-describedby={`${id}-scope`} className="w-full max-w-xl rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
      {state.decision.options.map(option => <option key={option.id} value={option.id}>{option.title}</option>)}
    </select>
    <p id={`${id}-scope`} className="max-w-2xl text-xs leading-relaxed text-zinc-400">Changes “{state.decision.title}” only.{state.selected !== 'default' && ' Other steps have not been adapted to this region.'}</p>
  </div>
}

export function RegionalDecisionTitle({ scope, title }: { scope: string; title: string }) {
  const state = useRegionalVariant()
  return <>{state?.decision?.scope === scope && state.selected !== 'default'
    ? state.decision.options.find(option => option.id === state.selected)?.title ?? title
    : title}</>
}

// Only the explicitly bound choice changes. Other decisions/nested graphs keep their UI.
export function RegionalOption({ scope, optionId, id, heading, assessment, children }: {
  scope: string; optionId: string; id: string; heading: ReactNode; assessment?: ReactNode; children: ReactNode
}) {
  const state = useRegionalVariant()
  const bound = state?.decision?.scope === scope && state.decision.options.some(option => option.id === optionId)
  if (bound) return state.selected === optionId
    ? <div id={id} className="min-w-0 px-3 py-3 sm:px-4"><div>{assessment}</div><div className="mt-3 space-y-3">{children}</div></div>
    : null
  return <details id={id} open={optionId === 'default'} className="min-w-0 px-3 py-3 sm:px-4"><summary className="cursor-pointer break-words font-medium text-zinc-100">{heading}</summary><div className="mt-3 space-y-3">{children}</div></details>
}

// Qualify the existing scores without changing their calculation or ordering.
export function RegionalCoverageNote() {
  const state = useRegionalVariant()
  if (!state?.decision) return null
  return <p className="mt-2 text-xs text-zinc-400">Default-scope coverage{state.selected !== 'default' && ' · selected regional variant not assessed'}</p>
}
