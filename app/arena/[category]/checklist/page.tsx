import type { Metadata } from 'next'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'
import {
  checklistMarkdown, checklistThemes, matrixGlyph, priorityForWeight, topWeightedStories,
  type Priority,
} from '@/lib/checklist'
import { loadAll, loadCategory, stripPersonaPrefix } from '@/lib/data'
import { SITE_URL } from '@/lib/site'

// Buyer checklist / RFP view of one arena (see lib/checklist.ts): every judged story as a
// checkbox requirement grouped by theme with weight-as-priority, the current per-product
// verdicts as a compact glyph matrix for reference, and a one-click markdown export.

export function generateStaticParams() {
  return loadAll().map((data) => ({ category: data.category.id }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const data = loadCategory(category)
  const year = new Date().getFullYear()
  return {
    title: `${data.category.name} buyer checklist / RFP template (${year}) — ProductArena`,
    description: `A ready-to-send ${data.category.name} RFP checklist: ${data.stories.length} evidence-judged requirements grouped by theme with must-have/should-have/nice-to-have priorities, plus the current verdict matrix for ${data.products.length} products.`,
    alternates: { canonical: `${SITE_URL}/arena/${category}/checklist` },
  }
}

const PRIORITY_STYLES: Record<Priority, string> = {
  'must-have': 'border-emerald-400/60 text-emerald-300',
  'should-have': 'border-zinc-600 text-zinc-300',
  'nice-to-have': 'border-zinc-800 text-zinc-500',
}

export default async function ChecklistPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const data = loadCategory(category)
  const themes = checklistThemes(data.stories)
  const matrixStories = topWeightedStories(data.stories)
  const markdown = checklistMarkdown(data)
  const productById = new Map(data.products.map((p) => [p.id, p]))

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">
          <Link href={`/arena/${category}`} className="hover:text-emerald-300">
            {data.category.name} Arena
          </Link>
        </p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">Buyer checklist</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          The arena&apos;s {data.stories.length} judged user stories as an RFP checklist. Priorities mirror the
          story weights our scoring uses (3 = must-have, 2 = should-have, 1 = nice-to-have) — see the{' '}
          <Link href="/methodology" className="text-emerald-300 hover:underline">
            methodology
          </Link>
          .
        </p>
        <div className="mt-3">
          <CopyButton text={markdown} label="Copy as markdown" />
        </div>
      </div>

      <div className="space-y-6">
        {themes.map(([theme, stories]) => (
          <section key={theme}>
            <h2 className="font-display leading-[1.1] mb-2 text-lg font-semibold">{theme}</h2>
            <ul className="space-y-1.5">
              {stories.map((s) => {
                const priority = priorityForWeight(s.weight)
                return (
                  <li key={s.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      aria-label={stripPersonaPrefix(s.title)}
                      className="mt-0.5 size-4 shrink-0 accent-emerald-400"
                    />
                    <span className="min-w-0 text-zinc-300">{stripPersonaPrefix(s.title)}</span>
                    <span
                      className={`ml-auto shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${PRIORITY_STYLES[priority]}`}
                    >
                      {priority}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <div>
        <h2 className="font-display leading-[1.1] mb-1 text-lg font-semibold">Current verdicts</h2>
        <p className="mb-3 text-xs text-zinc-400">
          How the ranked products score today on the {matrixStories.length} heaviest-weighted requirements —
          ✓ full · ~ partial · ! disputed · — none · n/a not applicable. Full evidence on each{' '}
          <Link href={`/arena/${category}`} className="text-emerald-300 hover:underline">
            arena page
          </Link>
          .
        </p>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-left">
                <th className="px-3 py-2 font-medium text-zinc-400">Product</th>
                {matrixStories.map((s, i) => (
                  <th key={s.id} className="px-2 py-2 text-center font-medium text-zinc-400">
                    <span title={stripPersonaPrefix(s.title)} className="cursor-help underline decoration-dotted decoration-zinc-700">
                      S{i + 1}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rankings.leaderboard.map((entry) => {
                const product = productById.get(entry.productId)
                if (!product) return null
                return (
                  <tr key={entry.productId} className="border-b border-zinc-800/60 last:border-b-0">
                    <td className="px-3 py-1.5">
                      <Link
                        href={`/arena/${category}/product/${product.id}`}
                        className="whitespace-nowrap text-zinc-200 hover:text-emerald-300"
                      >
                        {product.name}
                      </Link>
                    </td>
                    {matrixStories.map((s) => {
                      const glyph = matrixGlyph(data, entry.productId, s.id)
                      return (
                        <td
                          key={s.id}
                          className={`px-2 py-1.5 text-center font-mono ${
                            glyph === '✓' ? 'text-emerald-300' : glyph === '!' ? 'text-red-300' : 'text-zinc-500'
                          }`}
                        >
                          {glyph}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <ol className="mt-2 space-y-0.5 text-[11px] text-zinc-500">
          {matrixStories.map((s, i) => (
            <li key={s.id}>
              <span className="font-mono text-zinc-400">S{i + 1}</span> — {stripPersonaPrefix(s.title)}{' '}
              <span className="text-zinc-600">({priorityForWeight(s.weight)})</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
