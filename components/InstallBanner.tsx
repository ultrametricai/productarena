import InstallMethods from '@/components/InstallMethods'

// The sitewide install banner (founder 2026-09-29): the exact bottom-of-/v2 module — "Your AI
// native company starts here" + the three install methods — rendered at the end of every
// content page (app/layout.tsx, above the footer). The methods UI itself is the shared
// components/InstallMethods.tsx (extracted when /v2 was ported into the app, 2026-09-29) so
// this banner and the /v2 hero render one module, not two hand-kept copies. On /v2 this
// banner IS the page's closing "Your AI native company starts here" section — the page ends
// before it rather than duplicating the module (see app/v2/page.tsx).
export default function InstallBanner() {
  return (
    <section id="install" aria-label="Set up Ultrametric" className="scroll-mt-4 border-t border-zinc-800">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-5 py-10 text-center">
        <h2 className="font-display text-xl font-semibold tracking-tight">Your AI native company starts here</h2>
        <InstallMethods className="mt-4 w-full max-w-2xl" />
      </div>
    </section>
  )
}
