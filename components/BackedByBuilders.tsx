import Link from 'next/link'
/* eslint-disable @next/next/no-img-element -- static local jpg/svg assets ported from the
   landing site (public/faces/*, public/logos/*); no remote loader or resizing needed. */

// "Backed by builders" — the landing site's investor grid (logos + faces), ported verbatim
// from the Astro landing so /home and /company render it inside the shared product layout
// (one top bar sitewide, founder 2026-09-29). Pure server component, data inline: this list
// IS the content.
// Where a sub names a JUDGED vendor, the card clicks through to OUR product page for it
// (founder 2026-10-02) — the judged evidence, not the vendor's marketing site. 'Gomila
// Capital' removed (same ask).
const INVESTORS: { img: string; alt: string; name: string; sub?: string; href?: string }[] = [
  { img: '/faces/garry-tan.jpg', alt: 'Photo of Garry Tan', name: 'Garry Tan' },
  { img: '/faces/charlie-songhurst.jpg', alt: 'Photo of Charlie Songhurst', name: 'Charlie Songhurst' },
  { img: '/faces/drew-houston.jpg', alt: 'Photo of Drew Houston', name: 'Drew Houston', sub: 'Dropbox', href: '/arena/cloud-storage/product/dropbox' },
  { img: '/faces/immad-akhund.jpg', alt: 'Photo of Immad Akhund', name: 'Immad Akhund', sub: 'Mercury', href: '/arena/startup-banking/product/mercury' },
  { img: '/faces/tomer-london.jpg', alt: 'Photo of Tomer London', name: 'Tomer London', sub: 'CTO, Gusto', href: '/arena/payroll/product/gusto' },
  { img: '/faces/darby-wong.jpg', alt: 'Photo of Darby Wong', name: 'Darby Wong', sub: 'CEO, Clerky', href: '/arena/legal-ops/product/clerky' },
  { img: '/faces/jude-gomila.jpg', alt: 'Photo of Jude Gomila', name: 'Jude Gomila' },
]

export default function BackedByBuilders() {
  return (
    <section className="border-t border-zinc-800/60 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-8 md:px-12">
        <p className="mb-10 text-sm font-medium uppercase tracking-wide text-emerald-400">Backed by builders</p>
        <div className="mx-auto grid max-w-sm grid-cols-2 gap-x-8 gap-y-6 sm:max-w-none sm:grid-cols-3 sm:gap-x-12 sm:gap-y-8 md:flex md:flex-wrap md:justify-center">
          <Link href="/yc" title="YC companies on Ultrametric — agentic winners per batch" className="flex items-center justify-center gap-3 opacity-70 transition-opacity hover:opacity-100 md:justify-start">
            <img src="/logos/yc.svg" alt="Y Combinator logo" width={120} height={40} className="h-10 w-auto object-contain" loading="lazy" />
            <span className="text-sm font-medium text-zinc-200">Y Combinator</span>
          </Link>
          <div className="flex items-center justify-center gap-3 opacity-70 transition-opacity hover:opacity-100 md:justify-start">
            <img src="/logos/pioneer-fund.svg" alt="Pioneer Fund logo" width={120} height={40} className="h-10 w-auto object-contain" loading="lazy" />
          </div>
          {INVESTORS.map((inv) => {
            const card = (
              <>
                <img src={inv.img} alt={inv.alt} width={32} height={32} className="h-8 w-8 rounded-full object-cover" loading="lazy" />
                <div className="text-left">
                  <span className="block text-sm font-medium leading-tight text-zinc-200">{inv.name}</span>
                  {inv.sub ? <span className="text-xs leading-tight text-zinc-400">{inv.sub}</span> : null}
                </div>
              </>
            )
            return inv.href ? (
              <Link key={inv.name} href={inv.href} title={`${inv.sub} on Ultrametric — the judged product page`} className="flex items-center gap-3 opacity-70 transition-opacity hover:opacity-100">
                {card}
              </Link>
            ) : (
              <div key={inv.name} className="flex items-center gap-3 opacity-70 transition-opacity hover:opacity-100">
                {card}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
