import ProductLogo from '@/components/ProductLogo'
import VerdictBadge from '@/components/VerdictBadge'
import VerificationBadge from '@/components/VerificationBadge'
import { evidenceById, groupInOrder, verdictFor, type CategoryData } from '@/lib/data'
import type { Story } from '@/lib/schemas'
import { verificationLevel } from '@/lib/verification'

export default function StoryMatrix({ data }: { data: CategoryData }) {
  const byTheme = groupInOrder(data.stories, (s) => s.theme)
  const evidence = evidenceById(data)

  return (
    <div className="space-y-10">
      {byTheme.map(([theme, storiesInTheme]) => {
        const byGroup = groupInOrder(storiesInTheme, (s) => s.group)
        return (
          <div key={theme}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-400">{theme}</h3>
            <div className="space-y-6">
              {byGroup.map(([group, stories]) => (
                <StoryMatrixGroup key={group} data={data} theme={theme} group={group} stories={stories} evidence={evidence} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StoryMatrixGroup({
  data,
  theme,
  group,
  stories,
  evidence,
}: {
  data: CategoryData
  theme: string
  group: string
  stories: Story[]
  evidence: ReturnType<typeof evidenceById>
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      {group !== theme && <p className="border-b border-zinc-800 px-4 py-2 text-xs text-zinc-500">{group}</p>}
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <th className="px-4 py-2 font-normal">Story</th>
            {data.products.map((p) => (
              <th key={p.id} className="px-3 py-2 text-center font-normal">
                <div className="flex flex-col items-center gap-1">
                  <ProductLogo product={p} size={24} />
                  <span className="text-[10px] text-zinc-600">{p.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/70">
          {stories.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 text-zinc-300">{s.title}</td>
              {data.products.map((p) => {
                const v = verdictFor(data, p.id, s.id)
                return (
                  <td key={p.id} className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <VerdictBadge verdict={v.verdict} />
                        <VerificationBadge level={verificationLevel(v, evidence)} compact />
                      </div>
                      {v.verdict !== 'na' && (
                        <span className="font-mono text-xs tabular-nums text-zinc-600">{v.quality}/10</span>
                      )}
                    </div>
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
