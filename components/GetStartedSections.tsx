import InstallMethods from '@/components/InstallMethods'
import V2DeviceStage from '@/components/V2DeviceStage'

// The /get-started page's CONTENT sections, extracted into shared components (founder
// 2026-09-30: the homepage flow ends with the get-started content before the sitewide
// InstallBanner takes over) so app/get-started/page.tsx and app/home/page.tsx render ONE
// module each, never two hand-kept copies — the same never-drift rule as InstallMethods.
//
// Fidelity notes (see app/get-started/page.tsx for the full port history vs the live /v2):
// - Copy is verbatim: hero, the three-method install module, the laptop/phone process demo,
//   and the "Works across the agents you already use" cards.
// - The hero heading's LEVEL is a prop: h1 on /get-started (it's that page's title), h2 on the
//   homepage (whose h1 is the landing hero) — markup is otherwise identical on both pages.
// - Neither section carries id="install": the sitewide InstallBanner owns that anchor.

const AGENT_CARDS: { title: string; body: string }[] = [
  {
    title: 'Keep your setup',
    body: 'Your agent keeps its connections, plugins and context. No new app to learn.',
  },
  {
    title: 'Switch models anytime',
    body: 'Move to a new model the day it ships. Your company and work in progress come with you.',
  },
  {
    title: 'No second AI bill',
    body: 'Ultrametric runs no model. The work uses the AI plan you already pay for.',
  },
]

/** Hero copy + the shared install module + the laptop/phone device demo. */
export function GetStartedHeroSection({ headingLevel = 'h1' }: { headingLevel?: 'h1' | 'h2' }) {
  const Heading = headingLevel
  return (
    <section aria-labelledby="gs-hero-heading" className="overflow-x-clip pb-20 pt-16 sm:pb-28 sm:pt-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-8 md:px-12">
        <Heading id="gs-hero-heading" className="font-display text-balance text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl">
          Start and run your company from any agent
        </Heading>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          Step-by-step managed processes to let your agent handle incorporating, hiring, payroll, and more.
        </p>
        <div className="mt-10 w-full">
          <InstallMethods />
        </div>
      </div>
      {/* Laptop/phone process demo */}
      <div className="mx-auto mt-16 max-w-6xl px-4 sm:mt-20 sm:px-8 md:px-12">
        <V2DeviceStage />
      </div>
    </section>
  )
}

/** The "Works across the agents you already use" cards. */
export function GetStartedAgentsSection() {
  return (
    <section aria-labelledby="agents-heading" className="border-t border-zinc-800/60 py-24 sm:py-32">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-8 md:px-12">
        <h2 id="agents-heading" className="font-display text-balance text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
          Works across the agents you already use
        </h2>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          Most companies already use more than one AI provider. Start a process in one agent and finish it in
          another, on your laptop or your phone.
        </p>
        <ul className="mt-14 grid w-full max-w-2xl gap-4 text-left lg:max-w-none lg:grid-cols-3">
          {AGENT_CARDS.map((card) => (
            <li key={card.title} className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h3 className="font-display text-lg font-medium text-zinc-100">{card.title}</h3>
              <p className="leading-relaxed text-zinc-400">{card.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
