import Link from 'next/link'
import { ACCESS_COLUMNS, accessGlyphFor, bestAccessVerdict } from '@/lib/accessGlyphs'
import type { CategoryData } from '@/lib/data-helpers'

// Three mono glyph columns derived straight from canonical agent-access verdicts — no new
// scoring, just a compact visual citation of full/partial/none-or-na for the three questions
// that matter most for "can an agent even get to this product": MCP, CLI, API. Each glyph is a
// citation, so it links to the story section (verdict + evidence) on the product page.
//
// The actual verdict-picking + glyph-mapping logic lives in lib/accessGlyphs.ts so
// components/MegaTable.tsx's server-side row builder can precompute the same glyphs without
// pulling full CategoryData/verdicts into the client bundle — see that file's doc comment.
export default function AgentAccessGlyphs({ data, productId }: { data: CategoryData; productId: string }) {
  return (
    <div className="flex items-center gap-3 font-mono text-xs">
      {ACCESS_COLUMNS.map(({ label, storyIds }) => {
        const verdict = bestAccessVerdict(data, productId, storyIds)
        const { char, className, title, storyId } = accessGlyphFor(label, verdict)
        return (
          <Link
            key={label}
            href={`/arena/${data.category.id}/product/${productId}#story-${storyId}`}
            className="flex items-center gap-1 hover:text-emerald-300"
            title={title}
          >
            <span className="text-zinc-400">{label}</span>
            <span className={className}>{char}</span>
          </Link>
        )
      })}
    </div>
  )
}
