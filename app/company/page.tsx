/* eslint-disable @next/next/no-img-element -- static local svg logos ported from the landing
   site (public/logos/*); no remote loader or resizing needed. */
import type { Metadata } from 'next'
import BackedByBuilders from '@/components/BackedByBuilders'
import { JuliaHero } from '@/components/fx/lazy'

// The AFK "Company processes" product page, ported from the retired Astro landing site
// (https://ultrametric.ai/company) into the product app so it shares app/layout.tsx — one top
// bar sitewide (founder 2026-09-29). The worker 301s the old /afk path here.
//
// Fidelity notes vs the live landing:
// - The Julia-set WebGL hero backdrop is RESTORED (founder 2026-09-29: "the homepage has lost
//   its animations") as components/fx/JuliaHeroCanvas.tsx — a re-implementation (the original
//   compiled chunk is no longer fetchable and unarchived), same visual family as the recovered
//   wordmark Julia (z² + c, |c| = 0.7885), dark/subtle/emerald-tinted. The graph-paper grid +
//   static radial gradient below stay as the no-WebGL / reduced-motion / pre-hydration state.
// - The animated DAG walkthrough (script-injected process steps, clickable tabs/sidebar) is
//   rendered as a static frame of the same mock: the workspace shell with the Integrations
//   panel (its only fully static panel) visible.
// - The per-vendor hover popups in the integrations grid (script-driven) are dropped; the
//   tiles themselves are verbatim.
// - The final CTA linked /afk/waitlist (a landing-origin page that now 301s here); it posts
//   the same waitlist form as the hero instead.
export const metadata: Metadata = {
  title: 'Ultrametric — Build an AI native business',
  description:
    'Run business processes with AI, from company setup to payroll, banking, and compliance. Ultrametric coordinates steps across your tools, with approvals where you need them.',
  alternates: { canonical: 'https://ultrametric.ai/company' },
}

// Static page — no data dependency.
export const dynamic = 'force-static'

function WaitlistForm() {
  // Verbatim from the landing: posts to the worker's auth backend with the AFK product tag
  // (the afk_signup_source attribution cookie is set landing-side; the target field is what
  // the backend keys on).
  return (
    <form method="post" action="/auth/join" className="w-full max-w-sm">
      <input type="hidden" name="target" value="afk" />
      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-white px-7 py-3 text-base font-medium leading-tight text-zinc-950 transition-colors hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        Join the Ultrametric waitlist
      </button>
    </form>
  )
}

// One ✓/! line in a feature-card mock (the landing's `fam-step` rows).
function CheckRow({ ok, label, note, noteRight }: { ok: boolean; label: string; note?: string; noteRight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-3.5 w-3.5 items-center justify-center rounded text-[9px] ${ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}
      >
        {ok ? '✓' : '!'}
      </span>
      <span className={ok ? 'text-zinc-300' : 'text-amber-400'}>{label}</span>
      {note ? <span className={`text-[10px] text-zinc-500 ${noteRight ? 'ml-auto' : ''}`}>{note}</span> : null}
    </div>
  )
}

const MOCK_PANEL = 'mb-5 h-32 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950/60 p-3 text-xs'
const CARD = 'rounded-lg border border-zinc-800 bg-zinc-900/40 p-8'
const H3 = 'font-display mb-3 text-lg font-semibold'
const CARD_P = 'text-sm leading-relaxed text-zinc-400'

const CONNECTED_VENDORS: [string, string][] = [
  ['Mercury', 'Banking'],
  ['Gusto', 'Payroll'],
  ['Carta', 'Cap table'],
  ['Stripe', 'Billing'],
  ['QuickBooks', 'Accounting'],
  ['Linear', 'Projects'],
]

const AVAILABLE_VENDORS: [string, string][] = [
  ['Clerky', 'Formation'],
  ['Slack', 'Comms'],
  ['Google Workspace', 'Email'],
  ['GitHub', 'Code'],
  ['AWS', 'Infra'],
  ['Asana', 'Projects'],
  ['Brex', 'Banking'],
  ['Rippling', 'HR'],
  ['Deel', 'Global pay'],
  ['Xero', 'Accounting'],
]

const INTEGRATION_TILES: { logo: string; name: string }[] = [
  { logo: '/logos/mercury.svg', name: 'Mercury' },
  { logo: '/logos/gusto.svg', name: 'Gusto' },
  { logo: '/logos/carta.svg', name: 'Carta' },
  { logo: '/logos/stripe.svg', name: 'Stripe' },
  { logo: '/logos/linear.svg', name: 'Linear' },
  { logo: '/logos/clerky.svg', name: 'Clerky' },
]

const SIDEBAR_ITEMS: { label: string; active?: boolean }[] = [
  { label: 'Dashboard' },
  { label: 'Processes' },
  { label: 'Orchestrator' },
  { label: 'Goals' },
  { label: 'Data Explorer' },
  { label: 'Integrations', active: true },
  { label: 'Settings' },
]

export default function CompanyPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-16 sm:pb-24 sm:pt-24">
        {/* Graph-paper grid + static radial gradient: the Julia canvas's fallback (no WebGL,
            pre-hydration) — the animated backdrop fades in over it once a frame renders. */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgb(161 161 170) 1px, transparent 1px), linear-gradient(0deg, rgb(161 161 170) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
        </div>
        <JuliaHero />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(65% 60% at 50% 42%, rgb(9 9 11 / 78%) 0%, rgb(9 9 11 / 40%) 55%, rgb(9 9 11 / 0%) 100%)' }}
          aria-hidden
        />
        <div className="relative z-[2] mx-auto max-w-5xl px-4 text-center sm:px-8 md:px-12">
          <h1 className="font-display mb-5 mt-6 text-3xl font-medium leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Build an <span className="text-emerald-400">AI native business</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
            Start from an idea, or bring a company you already run. Ultrametric runs your business processes —
            from company setup to payroll, banking, and compliance.
          </p>
          <div className="mt-10 flex flex-col items-center gap-5">
            <WaitlistForm />
            <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
              Create your Ultrametric account now. Get notified when access is available.
            </p>
          </div>
        </div>

        {/* Workspace walkthrough (static frame of the landing's animated DAG demo) */}
        <div className="relative z-[2] mx-auto mb-8 mt-24 max-w-[1000px] px-4 text-center sm:px-8 sm:mt-32 md:px-12">
          <h2 className="font-display mb-4 text-2xl font-medium leading-[1.1] tracking-tight sm:text-3xl md:text-4xl">
            Watch your dream business set itself up.
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Start a process, and Ultrametric coordinates the steps across your tools. Follow company setup from
            the first request through execution, approvals, and completion.
          </p>
        </div>
        <div className="relative z-[2] mx-auto mt-8 max-w-[1000px] px-4 sm:px-8 md:px-12">
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-2xl">
            {/* Browser title bar */}
            <div className="flex items-center gap-2 border-b border-zinc-800/60 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="ml-2 font-mono text-xs text-zinc-500">Ultrametric</span>
            </div>
            {/* App body: sidebar + main */}
            <div className="flex">
              <div className="hidden w-48 flex-shrink-0 flex-col border-r border-zinc-800/60 bg-zinc-950/40 sm:flex">
                <div className="px-3 pb-2 pt-3">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Workspace</div>
                  <div className="space-y-0.5">
                    {SIDEBAR_ITEMS.map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs ${item.active ? 'bg-zinc-800/50 text-zinc-300' : 'text-zinc-500'}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${item.active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-auto px-3 pb-3">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Recent</div>
                  <div className="space-y-0.5">
                    <div className="truncate px-2 py-1 text-[11px] text-zinc-500">Setup a company</div>
                    <div className="truncate px-2 py-1 text-[11px] text-zinc-500">Connect Mercury</div>
                    <div className="truncate px-2 py-1 text-[11px] text-zinc-500">Add co-founder</div>
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                {/* Inner tab bar */}
                <div className="flex items-center gap-0 border-b border-zinc-800/60 bg-zinc-950/30">
                  <div className="flex items-center gap-1.5 border-r border-zinc-800/60 bg-zinc-900/60 px-4 py-2 text-xs text-zinc-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="max-w-[140px] truncate">Setup a company</span>
                    <span className="ml-1 text-zinc-500">&times;</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-2 text-xs text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                    <span>New process</span>
                  </div>
                </div>
                {/* Integrations panel */}
                <div className="h-full overflow-hidden p-4 text-xs sm:p-6">
                  <div className="mb-4">
                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Connected</div>
                    <div className="grid grid-cols-2 gap-2">
                      {CONNECTED_VENDORS.map(([name, role]) => (
                        <div key={name} className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          <span className="text-zinc-300">{name}</span>
                          <span className="ml-auto text-zinc-500">{role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Available</div>
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABLE_VENDORS.map(([name, role]) => (
                        <div key={name} className="flex items-center gap-2 rounded border border-zinc-800/50 bg-zinc-950/20 px-3 py-2">
                          <span className="h-2 w-2 rounded-full bg-zinc-700" />
                          <span className="text-zinc-500">{name}</span>
                          <span className="ml-auto text-zinc-500">{role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BackedByBuilders />

      {/* Features */}
      <section id="features" className="border-t border-zinc-800/60 py-28 sm:py-40">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 md:px-12">
          <div className="mb-20 text-center">
            <p className="mb-5 text-sm font-medium uppercase tracking-wide text-emerald-400">Features</p>
            <h2 className="font-display mb-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Business processes,
              <br className="hidden sm:block" /> coordinated from start to finish
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-400">
              AI agents carry out each process across your tools, using shared company context. See which steps
              are complete, what comes next, and where your approval is needed.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Cross-vendor control */}
            <div className={CARD}>
              <div className={MOCK_PANEL}>
                <div className="grid h-full grid-cols-2 gap-2">
                  {(
                    [
                      ['Mercury', '$3.8M', 'Operating balance', null],
                      ['Stripe', '$42K', 'MRR', '+12%'],
                      ['Gusto', 'Mar 20', 'Next payroll · $287K', null],
                      ['Carta', '10M', 'Shares · 15% pool', null],
                    ] as [string, string, string, string | null][]
                  ).map(([vendor, value, caption, delta]) => (
                    <div key={vendor} className="rounded border border-zinc-800/60 bg-zinc-900/40 p-2">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] text-zinc-500">{vendor}</span>
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {value} {delta ? <span className="text-[10px] font-normal text-emerald-400">{delta}</span> : null}
                      </div>
                      <div className="text-[10px] text-zinc-500">{caption}</div>
                    </div>
                  ))}
                </div>
              </div>
              <h3 className={H3}>Cross-vendor control</h3>
              <p className={CARD_P}>
                Query and act across Mercury, Gusto, Carta, Stripe, and more from a single surface. No
                tab-switching, no copy-pasting between dashboards.
              </p>
            </div>

            {/* Context-aware setup */}
            <div className={CARD}>
              <div className={MOCK_PANEL}>
                <div className="space-y-1.5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Your company</span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">DE C-Corp</span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">4 employees</span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">CA, NY</span>
                  </div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tailored ops plan</div>
                  <CheckRow ok label="DE franchise tax" />
                  <CheckRow ok label="CA + NY employer registration" />
                  <CheckRow ok label="409A valuation" note="4+ employees" />
                  <CheckRow ok={false} label="Workers comp required" note="CA" />
                  <CheckRow ok label="Multi-state payroll tax" />
                </div>
              </div>
              <h3 className={H3}>Context-aware setup</h3>
              <p className={CARD_P}>
                Tell us your entity type, state, and headcount. Ultrametric builds a tailored ops plan for your
                actual situation, not a generic checklist.
              </p>
            </div>

            {/* Intelligent field filling */}
            <div className={CARD}>
              <div className={MOCK_PANEL}>
                <div className="space-y-1.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Gusto — Company setup</span>
                    <span className="text-[10px] text-emerald-400">6 auto-filled</span>
                  </div>
                  {(
                    [
                      ['Company', 'Acme Labs, Inc.'],
                      ['EIN', '84-3847291'],
                      ['Address', '548 Market St, SF'],
                      ['Bank', 'Mercury ****7204'],
                      ['Signatory', 'Jane Chen, CEO'],
                    ] as [string, string][]
                  ).map(([field, value]) => (
                    <div key={field} className="flex items-center gap-2">
                      <span className="w-14 shrink-0 text-[10px] text-zinc-500">{field}</span>
                      <span className="flex-1 rounded border border-emerald-800/30 bg-emerald-950/30 px-2 py-0.5 text-zinc-200">
                        {value}
                      </span>
                      <span className="text-[9px] text-emerald-400">✓</span>
                    </div>
                  ))}
                </div>
              </div>
              <h3 className={H3}>Intelligent field filling</h3>
              <p className={CARD_P}>
                AI pre-fills forms using context it already knows — your EIN, addresses, founder details. You
                confirm or correct. No re-typing the same data into seven vendor portals.
              </p>
            </div>

            {/* Goal-driven AI */}
            <div className={CARD}>
              <div className={MOCK_PANEL}>
                <div className="space-y-1.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-200">Get to $1M ARR</span>
                    <span className="text-[10px] text-amber-400">ETA Sep</span>
                  </div>
                  <div className="mb-2 h-1.5 w-full rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: '50%' }} />
                  </div>
                  <CheckRow ok label="Analyze cohorts" note="3.2% churn" noteRight />
                  <CheckRow ok label="Find expansion revenue" note="14 targets" noteRight />
                  <CheckRow ok label="Revenue model" note="3 scenarios" noteRight />
                  <CheckRow ok label="Milestone tracker" note="12 checkpoints" noteRight />
                  <CheckRow ok={false} label="Pricing review" note="needs decision" noteRight />
                  <CheckRow ok label="KPI alerts" note="weekly Slack" noteRight />
                </div>
              </div>
              <h3 className={H3}>Goal-driven AI</h3>
              <p className={CARD_P}>
                Set a goal like &quot;Get to $1m ARR&quot; and AI plans the steps — revenue modeling, cohort
                analysis, KPI alerts, and milestone tracking. It carries the process forward and asks when it
                needs a human decision.
              </p>
            </div>

            {/* Approval gates */}
            <div className={CARD}>
              <div className={MOCK_PANEL}>
                <div className="space-y-1.5">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Action queue</div>
                  <div className="flex items-center gap-2 rounded bg-zinc-900/40 px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="flex-1 text-zinc-400">Read bank balance</span>
                    <span className="text-[10px] text-zinc-500">Mercury</span>
                    <span className="text-[10px] text-emerald-400">auto</span>
                  </div>
                  <div className="flex items-center gap-2 rounded bg-zinc-900/40 px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="flex-1 text-zinc-400">List employees</span>
                    <span className="text-[10px] text-zinc-500">Gusto</span>
                    <span className="text-[10px] text-emerald-400">auto</span>
                  </div>
                  <div className="flex items-center gap-2 rounded border border-amber-900/30 bg-amber-950/20 px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="flex-1 text-zinc-200">Wire $12,400 to AWS</span>
                    <span className="text-[10px] text-zinc-500">Mercury</span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-400">Approved</span>
                  </div>
                  <div className="flex items-center gap-2 rounded border border-red-900/30 bg-red-950/20 px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    <span className="flex-1 text-zinc-400 line-through">Delete option grant</span>
                    <span className="text-[10px] text-zinc-500">Carta</span>
                    <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] text-red-400">Denied</span>
                  </div>
                  <div className="flex items-center gap-2 rounded bg-zinc-900/40 px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="flex-1 text-zinc-400">Post notification</span>
                    <span className="text-[10px] text-zinc-500">Slack</span>
                    <span className="text-[10px] text-emerald-400">auto</span>
                  </div>
                </div>
              </div>
              <h3 className={H3}>Approval gates</h3>
              <p className={CARD_P}>
                Reads run automatically. Writes pause for sign-off. Cost-incurring actions show estimates. You
                control the boundary between autonomous and supervised.
              </p>
            </div>

            {/* Connected process steps */}
            <div className={CARD}>
              <div className={MOCK_PANEL}>
                <div className="space-y-1">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Company setup — 7 nodes</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 shrink-0 text-right text-[10px] text-zinc-500">1</span>
                    <span className="flex h-4 flex-1 items-center rounded bg-emerald-500/20 px-1.5 text-[10px] text-emerald-400">Incorporate</span>
                    <span className="text-[9px] text-emerald-400">✓</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 shrink-0 text-right text-[10px] text-zinc-500">2</span>
                    <span className="flex h-4 flex-1 items-center rounded bg-emerald-500/20 px-1.5 text-[10px] text-emerald-400">Apply for EIN</span>
                    <span className="text-[9px] text-emerald-400">✓</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="w-5 shrink-0 pt-0.5 text-right text-[10px] text-zinc-500">3–5</span>
                    <div className="flex flex-1 gap-1">
                      <span className="flex h-4 flex-1 animate-pulse items-center rounded bg-cyan-500/20 px-1 text-[10px] text-cyan-400">Mercury</span>
                      <span className="flex h-4 flex-1 animate-pulse items-center rounded bg-cyan-500/20 px-1 text-[10px] text-cyan-400">Carta</span>
                      <span className="flex h-4 flex-1 animate-pulse items-center rounded bg-cyan-500/20 px-1 text-[10px] text-cyan-400">Gusto</span>
                    </div>
                    <span className="text-[9px] text-cyan-400">∥</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 shrink-0 text-right text-[10px] text-zinc-500">6</span>
                    <span className="flex h-4 flex-1 items-center rounded bg-zinc-800/60 px-1.5 text-[10px] text-zinc-500">Stripe connect</span>
                    <span className="text-[9px] text-zinc-500">←3</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 shrink-0 text-right text-[10px] text-zinc-500">7</span>
                    <span className="flex h-4 flex-1 items-center rounded bg-zinc-800/60 px-1.5 text-[10px] text-zinc-500">Evaluate</span>
                    <span className="text-[9px] text-zinc-500">←all</span>
                  </div>
                </div>
              </div>
              <h3 className={H3}>Connected process steps</h3>
              <p className={CARD_P}>
                Each process connects the steps needed to reach an outcome. Independent steps run in parallel;
                dependent steps wait until the work they need is complete.
              </p>
            </div>

            {/* Security Engineered */}
            <div className={CARD}>
              <div className={MOCK_PANEL}>
                <div className="space-y-1.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Security audit</span>
                    <span className="text-[10px] text-emerald-400">6/7 passing</span>
                  </div>
                  <CheckRow ok label="OAuth tokens scoped" note="minimal access" noteRight />
                  <CheckRow ok label="Secrets encrypted" note="AES-256" noteRight />
                  <CheckRow ok label="API keys rotated" note="3 days ago" noteRight />
                  <CheckRow ok label="Full audit log" note="all actions" noteRight />
                  <CheckRow ok={false} label="2FA not enabled" note="2 members" noteRight />
                  <CheckRow ok label="SOC 2 controls" note="14/16" noteRight />
                </div>
              </div>
              <h3 className={H3}>Security Engineered</h3>
              <p className={CARD_P}>
                Scoped OAuth tokens, encrypted secrets, automatic key rotation, and full audit logs. Every action
                is traceable, every permission is minimal.
              </p>
            </div>

            {/* Built for teams */}
            <div className={CARD}>
              <div className={MOCK_PANEL}>
                <div className="space-y-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Team</span>
                    <span className="text-[10px] text-zinc-500">
                      42 processes this week · <span className="text-emerald-400">97% auto</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/30 text-[9px] font-semibold text-violet-300">JC</span>
                    <span className="flex-1 text-zinc-200">Jane Chen</span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-400">admin</span>
                    <span className="text-[10px] text-zinc-500">12 processes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/30 text-[9px] font-semibold text-cyan-300">AR</span>
                    <span className="flex-1 text-zinc-200">Alex Rivera</span>
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] text-cyan-400">member</span>
                    <span className="text-[10px] text-zinc-500">5 processes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/30 text-[9px] font-semibold text-amber-300">SP</span>
                    <span className="flex-1 text-zinc-200">Sam Park</span>
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] text-cyan-400">member</span>
                    <span className="text-[10px] text-amber-400">3 pending</span>
                  </div>
                  <div className="mt-1 flex gap-1.5">
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">company</span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">cap table</span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">payroll</span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">banking</span>
                  </div>
                </div>
              </div>
              <h3 className={H3}>Built for teams</h3>
              <p className={CARD_P}>
                Shared company context across your team. Role-based access controls, delegated approvals, and a
                single source of truth for every operational decision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="border-t border-zinc-800/60 py-28 text-center sm:py-40">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 md:px-12">
          <p className="mb-5 text-sm font-medium uppercase tracking-wide text-emerald-400">Integrations</p>
          <h2 className="font-display mb-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Supports your favorite APIs, MCPs and services
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-lg leading-relaxed text-zinc-400">
            Intelligent cross-vendor data view and control.
          </p>
          <div className="mx-auto grid max-w-md grid-cols-2 gap-4 sm:max-w-2xl sm:grid-cols-3 md:max-w-none md:grid-cols-6">
            {INTEGRATION_TILES.map((tile) => (
              <div
                key={tile.name}
                className="flex flex-col items-center justify-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-6 transition-colors hover:border-zinc-700"
              >
                <img src={tile.logo} alt={`${tile.name} logo`} width={84} height={28} className="h-7 w-auto object-contain opacity-80" loading="lazy" />
                <span className="text-xs text-zinc-200">{tile.name}</span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-zinc-500">and many more</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-zinc-800/60 py-28 sm:py-40">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-8 md:px-12">
          <h2 className="font-display mb-8 text-3xl font-bold tracking-tight sm:text-4xl">
            Join the Ultrametric waitlist
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-lg leading-relaxed text-zinc-400">
            Create an Ultrametric account and register your interest. We’ll contact you when access is available.
          </p>
          <div className="flex justify-center">
            <WaitlistForm />
          </div>
        </div>
      </section>
    </div>
  )
}
