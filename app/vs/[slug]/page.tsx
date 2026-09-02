import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AgentAccessGlyphs from '@/components/AgentAccessGlyphs'
import AgenticBadge from '@/components/AgenticBadge'
import AiEraBadge from '@/components/AiEraBadge'
import BattleView from '@/components/BattleView'
import { BusinessModelChip } from '@/components/BusinessModel'
import ClaimsChip from '@/components/ClaimsChip'
import ProductLogo from '@/components/ProductLogo'
import { battleSlug, findBattleBySlug, loadAll, type CategoryData } from '@/lib/data'
import type { BattleRecord, Product } from '@/lib/schemas'
import { SITE_URL } from '@/lib/site'

// Top-level mirror of every arena battle (`/arena/{category}/battle/{slug}` also still resolves
// — see that page's generateMetadata for the canonical pointer back here). Product ids are
// globally unique, so the slug alone (`{a}-vs-{b}`) is enough to resolve a battle across all
// categories with no category segment in the URL — see lib/data-helpers.ts's findBattleBySlug.
export function generateStaticParams() {
  return loadAll().flatMap((data) => data.rankings.battles.map((b) => ({ slug: battleSlug(b.a, b.b) })))
}

export const dynamicParams = false

// Honest FAQPage JSON-LD, same discipline as the arena page's arenaFaqJsonLd — both answers
// come straight from this battle's own computed record, never a fabricated rating.
function vsFaqJsonLd(data: CategoryData, battle: BattleRecord, a: Product, b: Product) {
  const winnerName = battle.winner === 'draw' ? null : battle.winner === a.id ? a.name : b.name
  const record = `${battle.record.aWins}–${battle.record.bWins}${battle.record.draws > 0 ? ` (${battle.record.draws} drawn)` : ''}`
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${a.name} vs ${b.name}: which is more AI-ready?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: winnerName
            ? `${winnerName} wins the head-to-head ${record} across ${data.category.name}'s evidence-graded user stories — see ${SITE_URL}/vs/${battleSlug(battle.a, battle.b)}.`
            : `${a.name} and ${b.name} draw the head-to-head ${record} across ${data.category.name}'s evidence-graded user stories.`,
        },
      },
      {
        '@type': 'Question',
        name: 'How is this measured?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Every user story is judged independently for both products using cited evidence (vendor docs, GitHub, community sources, or a hands-on probe) — never opinion — and the higher-scoring product wins that round. See ${SITE_URL}/methodology for the full scoring writeup.`,
        },
      },
    ],
  }
}

function resolve(slug: string): { data: CategoryData; battle: BattleRecord; a: Product; b: Product } | null {
  const found = findBattleBySlug(loadAll(), slug)
  if (!found) return null
  const { data, battle } = found
  const a = data.products.find((p) => p.id === battle.a)!
  const b = data.products.find((p) => p.id === battle.b)!
  return { data, battle, a, b }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const found = resolve(slug)
  if (!found) return { title: 'Comparison — INIT' }
  const { data, a, b } = found
  const year = new Date().getFullYear()
  return {
    title: `${a.name} vs ${b.name} (${year}): which is more AI-ready? Evidence-tested comparison`,
    description: `Head-to-head, evidence-graded comparison of ${a.name} and ${b.name} across ${data.category.name} — INIT Score, agent-readiness, business model, vendor claims verified, and every judged round.`,
    alternates: { canonical: `${SITE_URL}/vs/${slug}` },
  }
}

export default async function VsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const found = resolve(slug)
  if (!found) notFound()
  const { data, battle, a, b } = found
  const aEntry = data.rankings.leaderboard.find((e) => e.productId === a.id)!
  const bEntry = data.rankings.leaderboard.find((e) => e.productId === b.id)!

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vsFaqJsonLd(data, battle, a, b)) }}
      />
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-amber-400">
          <Link href={`/arena/${data.category.id}`} className="hover:text-amber-300">
            {data.category.name} Arena
          </Link>
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {a.name} <span className="text-zinc-400">vs</span> {b.name}
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Evidence-tested comparison — INIT Score, agent-readiness, and every judged round.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[{ p: a, entry: aEntry }, { p: b, entry: bEntry }].map(({ p, entry }) => (
          <div key={p.id} className="rounded-xl border border-zinc-800 p-5">
            <Link
              href={`/arena/${data.category.id}/product/${p.id}`}
              className="flex items-center gap-3 hover:text-amber-300"
            >
              <ProductLogo product={p} size={40} />
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-zinc-500">{p.vendor}</p>
              </div>
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400">INIT</span>
              <AiEraBadge
                value={entry.aiEra}
                components={{
                  agentReady: entry.agentReady,
                  apiQuality: entry.apiQuality,
                  openness: entry.themeScores['openness'] ?? null,
                  agenticApp: entry.agenticApp,
                  automation: entry.themeScores['automation-depth'] ?? null,
                }}
              />
              <AgenticBadge kind="agent-ready" value={entry.agentReady} size="sm" />
              <AgenticBadge kind="agentic-app" value={entry.agenticApp} size="sm" />
            </div>
            <div className="mt-2">
              <AgentAccessGlyphs data={data} productId={p.id} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <BusinessModelChip product={p} />
              <ClaimsChip data={data} productId={p.id} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-center">
        <Link
          href={`/arena/${data.category.id}#legend`}
          className="text-xs text-zinc-400 underline decoration-zinc-700 hover:text-amber-300"
        >
          How to read this: legend →
        </Link>
      </p>

      <BattleView data={data} battle={battle} />
    </div>
  )
}
