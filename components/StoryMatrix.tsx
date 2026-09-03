'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import ProductLogoView from '@/components/ProductLogoView'
import ThemeIcon from '@/components/ThemeIcon'
import VerdictBadge from '@/components/VerdictBadge'
import VerificationBadge from '@/components/VerificationBadge'
import {
  evidenceById, groupInOrder, originLabel, stripPersonaPrefix, verdictFor, type CategoryData,
} from '@/lib/data-helpers'
import type { Story, Verdict } from '@/lib/schemas'
import { verificationLevel } from '@/lib/verification'

// Tooltip text for a matrix cell: the verdict plus a truncated excerpt of the first cited
// evidence item (not necessarily the strongest tier — just the judge's first citation, kept
// simple and predictable for a hover title), plus the story's provenance (origin kind ·
// promptVersion — see #methodology).
function cellTitle(v: Verdict, story: Story, evidence: ReturnType<typeof evidenceById>): string {
  const first = v.evidenceIds.length > 0 ? evidence.get(v.evidenceIds[0]) : undefined
  const origin = originLabel(story)
  if (!first) return `${v.verdict} (${origin})`
  const excerpt = first.excerpt.length > 160 ? `${first.excerpt.slice(0, 160)}…` : first.excerpt
  return `${v.verdict}: "${excerpt}" (${origin})`
}

const ALL_PERSONAS = 'all'

export default function StoryMatrix({ data, logoMap }: { data: CategoryData; logoMap: Record<string, boolean> }) {
  // Persona filter (v1): re-scoped to this matrix only — it narrows which STORY ROWS are shown,
  // never re-scores or re-sorts the ArenaTable above. See ArenaTable.tsx's header comment for why
  // the two filters are deliberately not wired together yet.
  const personas = useMemo(() => {
    const seen: string[] = []
    for (const s of data.stories) if (!seen.includes(s.persona)) seen.push(s.persona)
    return seen
  }, [data])
  const [persona, setPersona] = useState<string>(ALL_PERSONAS)

  const evidence = evidenceById(data)
  const visibleStories = persona === ALL_PERSONAS ? data.stories : data.stories.filter((s) => s.persona === persona)
  const byTheme = groupInOrder(visibleStories, (s) => s.theme)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="matrix-persona-filter" className="text-xs uppercase tracking-widest text-zinc-400">
          Filter by persona
        </label>
        <select
          id="matrix-persona-filter"
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 focus:border-emerald-400/60 focus:outline-none"
        >
          <option value={ALL_PERSONAS}>All personas</option>
          {personas.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-500">
          {visibleStories.length}/{data.stories.length} stories shown ·{' '}
          <a href="#legend" className="underline decoration-zinc-700 hover:text-emerald-300">
            legend
          </a>
        </span>
      </div>

      {byTheme.length === 0 && <p className="text-sm text-zinc-500">No stories for this persona.</p>}

      <div className="space-y-10">
        {byTheme.map(([theme, storiesInTheme]) => {
          const byGroup = groupInOrder(storiesInTheme, (s) => s.group)
          return (
            <div key={theme}>
              <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-emerald-400">
                <ThemeIcon theme={theme} className="text-emerald-400" />
                {theme}
              </h3>
              <div className="space-y-6">
                {byGroup.map(([group, stories]) => (
                  <StoryMatrixGroup
                    key={group}
                    data={data}
                    theme={theme}
                    group={group}
                    stories={stories}
                    evidence={evidence}
                    logoMap={logoMap}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StoryMatrixGroup({
  data,
  theme,
  group,
  stories,
  evidence,
  logoMap,
}: {
  data: CategoryData
  theme: string
  group: string
  stories: Story[]
  evidence: ReturnType<typeof evidenceById>
  logoMap: Record<string, boolean>
}) {
  return (
    // max-h + overflow-auto gives the sticky thead below an actual scrolling ancestor to stick
    // within for this group's own rows, on top of the existing horizontal scroll for narrow
    // viewports — column identity (logos/names) stays visible while scrolling a long group.
    <div className="max-h-[70vh] overflow-auto rounded-xl border border-zinc-800">
      {group !== theme && (
        <p className="sticky left-0 border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-xs text-zinc-500">{group}</p>
      )}
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-zinc-950">
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <th className="sticky left-0 z-20 bg-zinc-950 px-4 py-2 font-normal">Story</th>
            <th className="bg-zinc-950 px-2 py-2 font-normal">Persona</th>
            {data.products.map((p) => (
              <th key={p.id} className="bg-zinc-950 px-3 py-2 text-center font-normal">
                <div className="flex flex-col items-center gap-1">
                  <ProductLogoView product={p} size={24} hasLogo={logoMap[p.id] ?? false} />
                  <span className="text-[10px] text-zinc-400">{p.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/70">
          {stories.map((s) => (
            <tr key={s.id} id={`story-${s.id}`} className="scroll-mt-4">
              <td className="sticky left-0 z-[5] bg-zinc-950 px-4 py-3 text-zinc-300">{stripPersonaPrefix(s.title)}</td>
              <td className="px-2 py-3 text-center">
                <span className="rounded border border-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                  {s.persona}
                </span>
              </td>
              {data.products.map((p) => {
                const v = verdictFor(data, p.id, s.id)
                return (
                  <td key={p.id} className="px-3 py-3 text-center">
                    <Link
                      href={`/arena/${data.category.id}/product/${p.id}#story-${s.id}`}
                      title={cellTitle(v, s, evidence)}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="flex items-center gap-1">
                        <VerdictBadge verdict={v.verdict} />
                        <VerificationBadge level={verificationLevel(v, evidence)} compact />
                      </div>
                      {v.verdict !== 'na' && (
                        <span className="font-mono text-xs tabular-nums text-zinc-400">{v.quality}/10</span>
                      )}
                    </Link>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
