// Enterprise-motion pill — renders for products whose verified `enterprise` flag is true
// (vendor's primary GTM is sales-led: no self-serve signup, pricing by sales contact; see the
// Product schema comment in lib/schemas.ts). Violet on purpose — the same hue as the
// `enterprise` pricing-tier chip (components/TierChip.tsx), so "enterprise-gated" reads as one
// color system across the site. Renders nothing when the flag is absent, matching
// YcBadge/OssPill's "no chip rather than an empty placeholder" convention.
export default function EnterpriseBadge({
  enterprise,
  className = '',
}: {
  enterprise: boolean | undefined
  className?: string
}) {
  if (!enterprise) return null
  return (
    <span
      title="Enterprise-focused vendor — sales-led: no self-serve signup, pricing by sales contact (verified against the vendor's pricing/signup pages)"
      className={`inline-flex w-fit items-center rounded-full border border-violet-400/60 bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300 ${className}`}
    >
      Enterprise
    </span>
  )
}
