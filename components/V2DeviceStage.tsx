'use client'

/* eslint-disable @next/next/no-img-element -- static local agent logos (public/logos/*),
   same treatment as the other ported landing pages. */

import { useState } from 'react'

// The /v2 product page's laptop-and-phone demo — Claude, Codex and Gemini each running a
// managed process across two devices — ported from the retired /v2 landing origin (founder
// 2026-09-29). STATIC FALLBACK per the components/fx house pattern: the original beat-by-beat
// reveal script (/_astro/DeviceStage...js) and its scoped stage CSS are NOT recoverable — the
// Cloudflare zone rule only serves /v2 itself from the old origin, so its /_astro/* asset
// paths resolve to the Next origin and 404. Every scene renders fully revealed instead; the
// live page's scene tabs stay interactive (pure useState, no timers), and the phone's Approve
// button toggles its Approved state so the approval flow is still legible. Copy is verbatim
// from the live markup; the visual shell (window, phone frame, bubbles, process cards) is a
// Tailwind recreation in the house style.

type Step = { label: string; state: 'done' | 'waiting'; note?: string }

type Item =
  | { kind: 'bubble'; text: string }
  | { kind: 'agent'; text: string }
  | { kind: 'process'; title: string; progress: string; steps: Step[] }
  | { kind: 'approval'; label: string; title: string; body: string }

type Scene = {
  id: string
  tab: string
  agent: { name: string; logo: string }
  laptop: Item[]
  phone: Item[]
}

const SCENES: Scene[] = [
  {
    id: 'incorporate',
    tab: 'Incorporate a Delaware C-Corp',
    agent: { name: 'Claude', logo: '/logos/claude.png' },
    laptop: [
      { kind: 'bubble', text: 'set up https://ultrametric.ai/install' },
      { kind: 'agent', text: 'Connected to Ultrametric. What should we get done?' },
      { kind: 'bubble', text: 'Incorporate Acme Labs as a Delaware C-Corp. Me and Alex, 50/50.' },
      {
        kind: 'process',
        title: 'Incorporate a Delaware C-Corp',
        progress: '4 of 6 done',
        steps: [
          { label: 'Company details from your profile', state: 'done' },
          { label: 'Check the name in Delaware', state: 'done' },
          { label: 'File the certificate of incorporation', state: 'done' },
          { label: 'Issue founder stock', state: 'done' },
          { label: 'Apply for an EIN', state: 'waiting', note: 'Waiting on the IRS' },
          { label: 'File 83(b) elections', state: 'waiting', note: 'Due within 30 days' },
        ],
      },
      { kind: 'agent', text: 'Filed. I’ll pick up the EIN as soon as the IRS replies.' },
    ],
    phone: [
      {
        kind: 'approval',
        label: 'Needs your approval',
        title: 'Ready to file Acme Labs, Inc.',
        body: 'Certificate of incorporation with the State of Delaware, filed through Clerky.',
      },
    ],
  },
  {
    id: 'hire',
    tab: 'Hire your first employee',
    agent: { name: 'Codex', logo: '/logos/codex.png' },
    laptop: [
      {
        kind: 'process',
        title: 'Hire your first employee',
        progress: '5 of 6 done',
        steps: [
          { label: 'Draft the offer letter', state: 'done' },
          { label: 'Send the offer for signature', state: 'done' },
          { label: 'Get the signed offer', state: 'done', note: 'Waiting on Sam' },
          { label: 'Add Sam to payroll', state: 'done' },
          { label: 'Create email and Slack accounts', state: 'done' },
          { label: 'Grant stock options', state: 'waiting', note: 'Needs board approval' },
        ],
      },
      { kind: 'agent', text: 'Sam signed. Payroll and accounts are ready for day one.' },
    ],
    phone: [
      { kind: 'bubble', text: 'Hire Sam Park as our first engineer. $165k and 0.4%.' },
      { kind: 'agent', text: 'On it. You’ll see the offer before it goes to Sam.' },
      {
        kind: 'approval',
        label: 'Needs your approval',
        title: 'Send Sam’s offer',
        body: '$165,000 salary and 0.4% in options, starting November 3.',
      },
    ],
  },
  {
    id: 'payroll',
    tab: 'Run payroll',
    agent: { name: 'Gemini', logo: '/logos/gemini.png' },
    laptop: [],
    phone: [
      { kind: 'bubble', text: 'Run payroll for this period.' },
      {
        kind: 'process',
        title: 'Run payroll',
        progress: '5 of 5 done',
        steps: [
          { label: 'Check for roster changes', state: 'done' },
          { label: 'Verify time off', state: 'done' },
          { label: 'Preview the totals', state: 'done' },
          { label: 'Submit payroll', state: 'done' },
          { label: 'Confirm the bank debit', state: 'done' },
        ],
      },
      {
        kind: 'approval',
        label: 'Needs your approval',
        title: 'Submit payroll',
        body: '$48,210 for 6 people, paid Friday.',
      },
      { kind: 'agent', text: 'Payroll is in, and the debit cleared.' },
    ],
  },
]

function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12.5l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AgentHead({ agent }: { agent: Scene['agent'] }) {
  return (
    <span className="flex items-center gap-2">
      <img src={agent.logo} alt="" width={20} height={20} className="h-5 w-5 rounded object-contain" loading="lazy" />
      <strong className="text-sm font-medium text-zinc-100">{agent.name}</strong>
    </span>
  )
}

function ProcessCard({ item, compact }: { item: Extract<Item, { kind: 'process' }>; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-950/60 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <strong className={`font-medium text-zinc-100 ${compact ? 'text-xs' : 'text-sm'}`}>{item.title}</strong>
        <span className={`shrink-0 text-zinc-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>{item.progress}</span>
      </div>
      <ol className="space-y-1.5">
        {item.steps.map((step) => (
          <li key={step.label} className={`flex items-center gap-2 ${compact ? 'text-[11px]' : 'text-xs'}`}>
            <span
              aria-hidden
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                step.state === 'done' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-600'
              }`}
            >
              <CheckIcon className="h-2.5 w-2.5" />
            </span>
            <span className={step.state === 'done' ? 'text-zinc-300' : 'text-zinc-500'}>{step.label}</span>
            {step.note ? <span className={`ml-auto shrink-0 text-amber-400/90 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>{step.note}</span> : null}
          </li>
        ))}
      </ol>
    </div>
  )
}

function ApprovalCard({
  item,
  approved,
  onApprove,
  compact,
}: {
  item: Extract<Item, { kind: 'approval' }>
  approved: boolean
  onApprove: () => void
  compact?: boolean
}) {
  return (
    <div className={`rounded-xl border border-emerald-500/30 bg-emerald-500/5 ${compact ? 'p-3' : 'p-4'}`}>
      <span className={`block font-medium uppercase tracking-wide text-emerald-400 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{item.label}</span>
      <strong className={`mt-1 block font-medium text-zinc-100 ${compact ? 'text-xs' : 'text-sm'}`}>{item.title}</strong>
      <p className={`mt-1 leading-relaxed text-zinc-400 ${compact ? 'text-[11px]' : 'text-xs'}`}>{item.body}</p>
      {approved ? (
        <span className={`mt-3 inline-flex items-center gap-1.5 font-medium text-emerald-400 ${compact ? 'text-xs' : 'text-sm'}`}>
          <span aria-hidden className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500/20">
            <CheckIcon className="h-2.5 w-2.5" />
          </span>
          Approved
        </span>
      ) : (
        <button
          type="button"
          onClick={onApprove}
          className={`mt-3 inline-flex min-h-9 cursor-pointer items-center rounded-lg bg-white font-medium text-zinc-950 transition-colors hover:bg-zinc-200 ${
            compact ? 'px-3 text-xs' : 'px-4 text-sm'
          }`}
        >
          Approve
        </button>
      )}
    </div>
  )
}

function Thread({
  items,
  approved,
  onApprove,
  compact,
}: {
  items: Item[]
  approved: boolean
  onApprove: () => void
  compact?: boolean
}) {
  return (
    <div className={`flex flex-col ${compact ? 'gap-2.5' : 'gap-3'}`}>
      {items.map((item, i) => {
        if (item.kind === 'bubble') {
          return (
            <p
              key={i}
              className={`self-end rounded-2xl rounded-br-md bg-zinc-800 text-zinc-100 ${
                compact ? 'max-w-[90%] px-2.5 py-1.5 text-[11px]' : 'max-w-[85%] px-3.5 py-2 text-sm'
              }`}
            >
              {item.text}
            </p>
          )
        }
        if (item.kind === 'agent') {
          return (
            <p key={i} className={`leading-relaxed text-zinc-400 ${compact ? 'text-[11px]' : 'text-sm'}`}>
              {item.text}
            </p>
          )
        }
        if (item.kind === 'process') return <ProcessCard key={i} item={item} compact={compact} />
        return <ApprovalCard key={i} item={item} approved={approved} onApprove={onApprove} compact={compact} />
      })}
    </div>
  )
}

function Composer({ placeholder, compact }: { placeholder: string; compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 ${
        compact ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-sm'
      }`}
    >
      <span className="flex-1 text-zinc-600">{placeholder}</span>
      <span
        aria-hidden
        className={`flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 ${compact ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs'}`}
      >
        ↑
      </span>
    </div>
  )
}

export default function V2DeviceStage() {
  const [sceneIndex, setSceneIndex] = useState(0)
  // Per-scene Approve state, remembered across tab switches.
  const [approved, setApproved] = useState<Record<string, boolean>>({})
  const scene = SCENES[sceneIndex]
  const isApproved = approved[scene.id] ?? false
  const approve = () => setApproved((prev) => ({ ...prev, [scene.id]: true }))

  return (
    <figure className="m-0">
      <figcaption className="sr-only">
        Claude, Codex and Gemini incorporating a company, hiring an engineer and running payroll, each moving between a
        laptop and a phone.
      </figcaption>
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-stretch md:justify-center md:gap-8">
        {/* Laptop window */}
        <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-zinc-800/60 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
            <span className="ml-3">
              <AgentHead agent={scene.agent} />
            </span>
          </div>
          <div className="flex min-h-[22rem] flex-col justify-between gap-4 p-4 sm:p-5">
            <Thread items={scene.laptop} approved={isApproved} onApprove={approve} />
            <Composer placeholder="Message your agent" />
          </div>
        </div>
        {/* Phone */}
        <div className="w-full max-w-[16.5rem] shrink-0 rounded-[2rem] border border-zinc-700/80 bg-zinc-900/80 p-1.5 shadow-2xl">
          <div className="flex h-full min-h-[22rem] flex-col overflow-hidden rounded-[1.65rem] border border-zinc-800 bg-zinc-950">
            <div className="flex items-center justify-between px-4 pb-1 pt-2 text-[10px] text-zinc-400">
              <span>9:41</span>
              <span aria-hidden className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-3 rounded-[2px] bg-zinc-500" />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />
                <span className="inline-block h-2 w-3.5 rounded-[3px] border border-zinc-600 bg-zinc-500/60" />
              </span>
            </div>
            <div className="border-b border-zinc-800/60 px-4 py-2">
              <AgentHead agent={scene.agent} />
            </div>
            <div className="flex flex-1 flex-col justify-between gap-3 p-3">
              <Thread items={scene.phone} approved={isApproved} onApprove={approve} compact />
              <Composer placeholder="Message" compact />
            </div>
            <span aria-hidden className="mx-auto mb-1.5 block h-1 w-20 rounded-full bg-zinc-700" />
          </div>
        </div>
      </div>
      {/* Scene tabs — verbatim labels/classes from the live page. */}
      <div className="mt-8 flex flex-wrap justify-center gap-2" role="group" aria-label="Choose a process to watch">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={i === sceneIndex}
            onClick={() => setSceneIndex(i)}
            className="min-h-11 cursor-pointer rounded-full border border-zinc-800 px-4 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100 aria-pressed:border-zinc-700 aria-pressed:bg-zinc-800 aria-pressed:text-zinc-100"
          >
            {s.tab}
          </button>
        ))}
      </div>
    </figure>
  )
}
