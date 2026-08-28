import type { Verdict } from '@/lib/schemas'

const REPO_ISSUES_URL = 'https://github.com/ultrametricai/productarena/issues/new'

// A quick, always-available "something's wrong here" flag on every verdict. It's just a
// prefilled GitHub issue link — the deeper check (adding evidence, re-judging, deriving)
// is still a maintainer/PR flow, documented in CONTRIBUTING.md.
export default function ContestLink({
  category,
  productId,
  storyId,
  verdict,
}: {
  category: string
  productId: string
  storyId: string
  verdict: Verdict
}) {
  const title = `[contest] ${category}/${productId}/${storyId}`
  const body = `**Category**\n${category}\n\n**Product**\n${productId}\n\n**Story id**\n${storyId}\n\n**Current verdict**\n${verdict.verdict}, quality ${verdict.quality}\n\n**Proposed verdict**\n<!-- what you think it should be, and why -->\n\n**Evidence URLs**\n<!-- one or more source URLs supporting your proposed verdict -->\n\n**Quotes**\n<!-- verbatim excerpt(s) from each URL above -->\n`

  const params = new URLSearchParams({
    template: 'contest-verdict.md',
    title,
    labels: 'contest',
    body,
  })

  return (
    <a
      href={`${REPO_ISSUES_URL}?${params.toString()}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-zinc-600 hover:text-amber-300"
    >
      ⚑ contest
    </a>
  )
}
