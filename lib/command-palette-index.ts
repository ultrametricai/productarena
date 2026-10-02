import { createHash } from 'node:crypto'
import { loadAll } from './data'
import { ARENA_ICONS } from './arenaIcons'
import { hasLogo } from './logos'
import { buildChainEntries, buildPageEntries, buildProcessEntries, buildSearchIndex, buildStackEntries, V2_PRODUCT_ENTRY, type SearchEntry } from './search-index'
import { loadAiStacks } from './aiStacks'
import { loadChains, loadProcesses, processSlug } from './processes'
import searchAliases from '@/data/search-aliases.json'

// Keep the complete palette in one static asset instead of every route's RSC payload.
export function buildCommandPaletteEntries(): SearchEntry[] {
  // The two full global rankings (see app/rankings/*) aren't arenas, but they're arena-shaped
  // (a ranked list you land on and browse) — surfacing them as `type: 'arena'` groups them with
  // the per-category arenas in the palette instead of inventing a one-off section for two items.
  // Alias phrases people actually type ("agent harness", "etl", "mcp adoption") come from
  // data/search-aliases.json — see lib/search-index.ts for the matcher that consumes them.
  const pageAliases = searchAliases.pages as Record<string, string[]>;
  const searchEntries: SearchEntry[] = [
    ...buildSearchIndex(loadAll(), {
      // House icon tokens (lib/arenaIcons.ts) — the palette renders them as the custom duotone
      // glyphs via IconGlyph; the legacy emoji stay in data/arena-icons.json as guides.
      arenaIcons: ARENA_ICONS,
      hasLogo,
      keywords: searchAliases.arenas as Record<string, string[]>,
    }),
    { type: "arena", label: "Most agent-ready (full ranking)", sublabel: "All products, ranked by agent-readiness", href: "/rankings/agentic", keywords: pageAliases["/rankings/agentic"] },
    { type: "arena", label: "Best built-in AI (full ranking)", sublabel: "All products, ranked by Built-in AI features", href: "/rankings/ai-native", keywords: pageAliases["/rankings/ai-native"] },
    { type: "arena", label: "Claims vs reality (full ranking)", sublabel: "All products, ranked by claims integrity", href: "/rankings/claims-integrity", keywords: pageAliases["/rankings/claims-integrity"] },
    { type: "arena", label: "Most connected (full ranking)", sublabel: "Products ranked by verified integrations", href: "/rankings/most-connected", keywords: pageAliases["/rankings/most-connected"] },
    { type: "arena", label: "Most tested (full ranking)", sublabel: "All products, ranked by tested-evidence share", href: "/rankings/most-tested", keywords: pageAliases["/rankings/most-tested"] },
    { type: "arena", label: "Rising & falling (30-day moves)", sublabel: "Biggest Overall score gains and falls", href: "/rankings/rising", keywords: pageAliases["/rankings/rising"] },
    { type: "arena", label: "Most popular (stars, installs, 🔥 hot)", sublabel: "Popularity measured fairly, by segment", href: "/rankings/popular", keywords: pageAliases["/rankings/popular"] },
    { type: "arena", label: "Lowest lock-in (full ranking)", sublabel: "Self-hosting, data export, open licenses, API parity", href: "/rankings/most-open", keywords: pageAliases["/rankings/most-open"] },
    { type: "arena", label: "Best API (full ranking)", sublabel: "All products, ranked by API quality", href: "/rankings/best-api", keywords: pageAliases["/rankings/best-api"] },
    ...buildStackEntries(loadAiStacks(), searchAliases.stacks as Record<string, string[]>),
    // The ⌘K 'Processes' group (founder 2026-10-02: defaults include processes): the
    // /processes index entry plus the high-traffic processes below. Ids come from
    // processes/corpus.json; titles/slugs resolve through loadProcesses/processSlug so a
    // rename can never strand a palette row — a missing id fails the build loudly instead
    // of silently dropping a founder-curated entry.
    ...buildProcessEntries(
      ["form_001", "form_002", "qs_023", "qs_063", "fund_001", "tax_001"].map((id) => {
        const t = loadProcesses().find((p) => p.id === id);
        if (!t) throw new Error(`⌘K high-traffic process ${id} missing from processes/corpus.json`);
        return { slug: processSlug(t.title), title: t.title, sublabel: `Founder process · ${t.phase}` };
      }),
      pageAliases,
    ),
    // The Situations index (founder 2026-10-02: situations moved out of /processes onto their
    // own area) — one ⌘K entry beside the process group; the 12 detail pages stay reachable
    // as /processes/<slug> rows via the fat search and their aliases.
    {
      type: "process",
      label: "Situations",
      sublabel: "When something hits — lawsuit, breach, tax notice… trigger + urgency",
      href: "/situations",
      keywords: (pageAliases["/situations"] ?? []).map((k) => k.toLowerCase()),
    },
    ...buildPageEntries(pageAliases),
    // The company's own CLI/MCP product page (app/v2) — a `product` row in the palette.
    V2_PRODUCT_ENTRY,
    // End-to-end playbooks (process chains) — searchable by name and by the journey phrases
    // people actually type ("raise a seed round", "launch on product hunt").
    ...buildChainEntries(loadChains(), pageAliases),
  ];
  return searchEntries
}

let asset: { body: string; url: string } | undefined

export function getCommandPaletteAsset(): { body: string; url: string } {
  if (!asset) {
    const body = JSON.stringify(buildCommandPaletteEntries())
    const version = createHash('sha256').update(body).digest('hex')
    asset = { body, url: `/search-index.json?v=${version}` }
  }
  return asset
}
