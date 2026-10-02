'use client'

import Link from 'next/link'
import { createContext, useContext, useId, useState, useLayoutEffect, useRef, type ReactNode } from 'react'
import type { SharedRecord } from '@/lib/shared-processes/schema'
import { graphExecutionType, processGraphs, type GraphNode, type GraphScope } from '@/lib/shared-processes/graph'
import { useRegionalVariant } from './RegionalVariant'

const ViewContext = createContext<{ view: 'details' | 'graph'; setView: (view: 'details' | 'graph') => void } | null>(null)
export function ProcessViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<'details' | 'graph'>('details')
  return <ViewContext.Provider value={{ view, setView }}>{children}</ViewContext.Provider>
}
export function ProcessViewSwitcher() {
  const state = useContext(ViewContext)!
  return <div role="group" aria-label="Process view" className="inline-flex rounded-xl border border-zinc-800 p-1">
    {(['details', 'graph'] as const).map(view => <button key={view} type="button" aria-pressed={state.view === view} onClick={() => state.setView(view)} className={`rounded-lg px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-emerald-300 ${state.view === view ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100'}`}>{view === 'details' ? 'Details' : 'Graph'}</button>)}
  </div>
}
function TypeIcon({ node }: { node: GraphNode }) {
  const type = graphExecutionType(node)
  const id = useId()
  return <span className="group relative shrink-0">
    <button type="button" aria-label={type.label} aria-describedby={id} title={type.label} className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-lg focus-visible:outline-2 focus-visible:outline-emerald-300 ${type.color}`}>{type.symbol}</button>
    <span id={id} role="tooltip" className="pointer-events-none absolute left-0 top-8 z-20 hidden w-52 rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-xs leading-relaxed text-zinc-200 shadow-xl group-hover:block group-focus-within:block">{type.label}</span>
  </span>
}
function ScopeGraph({ graph, open, href }: { href?: string; graph: GraphScope; open: (scope: string) => void }) {
  const marker = useId().replaceAll(':', '')
  const nodeWidth = 240, gapX = 56, gapY = 32
  const elements = useRef(new Map<string, HTMLDivElement>())
  const [heights, setHeights] = useState<Record<string, number>>({})
  useLayoutEffect(() => {
    function measure() {
      const next = Object.fromEntries([...elements.current].map(([scope, element]) => [scope, Math.ceil(element.getBoundingClientRect().height) || 54]))
      setHeights(previous => Object.keys(next).length === Object.keys(previous).length && Object.entries(next).every(([key, value]) => previous[key] === value) ? previous : next)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    for (const element of elements.current.values()) observer.observe(element)
    return () => observer.disconnect()
  }, [graph.nodes])
  const width = Math.max(...graph.layers.map(layer => layer.length), 1) * (nodeWidth + gapX) - gapX + 128
  const positions = new Map<string, { x: number; y: number; height: number; row: number; rowBottom: number }>()
  let nextY = 12
  graph.layers.forEach((layer, row) => {
    const rowHeight = Math.max(...layer.map(node => heights[node.scope] ?? 54))
    layer.forEach((node, column) => positions.set(node.id, { x: (width - (layer.length * (nodeWidth + gapX) - gapX)) / 2 + column * (nodeWidth + gapX), y: nextY, height: heights[node.scope] ?? 54, row, rowBottom: nextY + rowHeight }))
    nextY += rowHeight + gapY
  })
  const height = nextY - gapY + 12
  return <section aria-label={graph.title} className="min-w-0 space-y-3">
    <h3 className="break-words text-xl font-medium leading-snug text-zinc-100">{href ? <Link href={href} className="rounded-sm hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-300">{graph.title}</Link> : graph.title}</h3>
    {graph.annotation && <p className="text-xs text-zinc-400">{graph.annotation}</p>}
    {!graph.edges.length && <p className="text-xs text-zinc-500">No dependencies recorded in this scope. Placement does not establish execution order or independence.</p>}
    {graph.unresolved > 0 && <p className="text-xs text-amber-300">{graph.unresolved} unresolved links omitted.</p>}
    <div tabIndex={0} role="region" aria-label={`Scrollable dependency graph: ${graph.title}`} className="max-w-full overflow-auto rounded-xl border border-zinc-800 bg-zinc-950/30 focus-visible:outline-2 focus-visible:outline-emerald-300">
      <div className="relative mx-auto" style={{ width, height }}>
        <svg width={width} height={height} className="absolute inset-0 overflow-visible" role="img" aria-label="Recorded directional dependency edges">
          <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#71717a" /></marker></defs>
          {graph.edges.map((edge, index) => {
            const from = positions.get(edge.from)!, to = positions.get(edge.to)!
            const x1 = from.x + nodeWidth / 2, y1 = from.y + from.height, x2 = to.x + nodeWidth / 2, y2 = to.y
            // Long edges run beside cards instead of through intervening nodes.
            const skip = to.row - from.row > 1
            const lane = 16 + (index % 4) * 8
            const path = skip ? `M ${x1} ${y1} V ${from.rowBottom + gapY / 2} H ${lane} V ${y2 - 16} H ${x2} V ${y2}` : `M ${x1} ${y1} V ${from.rowBottom + 8} C ${x1} ${from.rowBottom + gapY / 2}, ${x2} ${y2 - gapY / 2}, ${x2} ${y2 - 8} V ${y2}`
            return <path key={index} data-edge-from={`${graph.id}:${edge.from}`} data-edge-to={`${graph.id}:${edge.to}`} d={path} fill="none" stroke="#71717a" strokeWidth="1.5" strokeDasharray={edge.conditional ? '5 4' : undefined} markerEnd={`url(#${marker})`}><title>{edge.description}</title></path>
          })}
        </svg>
        {graph.nodes.filter(node => positions.has(node.id)).map(node => { const pos = positions.get(node.id)!; return <div key={node.id} ref={element => { if (element) elements.current.set(node.scope, element); else elements.current.delete(node.scope) }} data-graph-node={node.scope} className="absolute flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-2 py-1" style={{ left: pos.x, top: pos.y, width: nodeWidth }}>
          <TypeIcon node={node} />
          <button type="button" onClick={() => open(node.scope)} title={node.when ? `Applies when: ${node.when}` : undefined} className="min-h-11 min-w-0 flex-1 self-stretch break-words text-left text-sm font-medium leading-snug text-zinc-100 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-300">{node.title}<span className="sr-only"> — open step details{node.when ? `; applies when: ${node.when}` : ''}</span></button>
        </div> })}
      </div>
    </div>
    {graph.unlinked.length > 0 && <div className="space-y-3">
      <p className="text-xs text-zinc-400">Unlinked actions · dependency order unspecified</p>
      <div className="flex max-w-full gap-4 overflow-x-auto pb-3">{graph.unlinked.map(node => <div key={node.id} data-graph-node={node.scope} className="relative flex w-60 shrink-0 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2 py-1">
        <TypeIcon node={node} />
        <button type="button" onClick={() => open(node.scope)} title={node.when ? `Applies when: ${node.when}` : undefined} className="min-h-11 min-w-0 flex-1 self-stretch break-words text-left text-sm font-medium leading-snug text-zinc-100 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-300">{node.title}<span className="sr-only"> — open step details{node.when ? `; applies when: ${node.when}` : ''}</span></button>
      </div>)}</div>
    </div>}
    {graph.edges.some(edge => edge.conditional) && <p className="text-xs leading-relaxed text-zinc-400">Dashed links have unresolved applicability: {graph.edges.filter(edge => edge.conditional).map(edge => edge.description).join('; ')}.</p>}
  </section>
}
export function ProcessViews({ record, records, children, processHrefs = {} }: { record: SharedRecord; records: SharedRecord[]; children: ReactNode; processHrefs?: Record<string, string> }) {
  const state = useContext(ViewContext)!
  const region = useRegionalVariant()
  const graphs = processGraphs(record, records, region?.selected)
  function open(scope: string) {
    state.setView('details')
    requestAnimationFrame(() => {
      const element = document.getElementById(scope)
      for (let parent = element?.parentElement; parent; parent = parent.parentElement) if (parent instanceof HTMLDetailsElement) parent.open = true
      if (element instanceof HTMLDetailsElement) element.open = true
      element?.setAttribute('tabindex', '-1')
      element?.focus({ preventScroll: true })
      element?.scrollIntoView({ block: 'start', behavior: 'instant' })
    })
  }
  return <>
    <div hidden={state.view !== 'details'}>{children}</div>
    <section hidden={state.view !== 'graph'} aria-label="Process graph" className="min-w-0 space-y-6">
      <p className="text-xs leading-relaxed text-zinc-400">Arrows show recorded dependencies; branches share a row where those dependencies allow parallel work. Conditional and option scopes retain their own applicability; placement does not establish complete regional coverage. Select a title to open its details. Select a type icon for its meaning.</p>
      {state.view === 'graph' && graphs.map(graph => <ScopeGraph key={graph.id} graph={graph} href={graph.sourceRecordId && graph.id !== record.id ? processHrefs[graph.sourceRecordId] : undefined} open={open} />)}
    </section>
  </>
}
