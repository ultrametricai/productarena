import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import ArenaMenu from "@/components/ArenaMenu";
import CommandPalette from "@/components/CommandPalette";
import { loadAll, loadCategories } from "@/lib/data";
import { WATCHLIST_ENABLED } from "@/lib/flags";
import { loadIcpTypes } from "@/lib/icp";
import { REPO, SITE_URL } from "@/lib/site";
import { buildSearchIndex, type SearchEntry } from "@/lib/search-index";

// Short labels used inside the Arenas dropdown alongside full names.
const NAV_LABELS: Record<string, string> = {
  "desktop-os": "OS",
  "startup-banking": "Banking",
  "project-management": "PM",
  "web-scraping": "Scraping",
  "mobile-dev": "Mobile AI dev",
  "code-hosting": "Git",
  "ai-coding": "AI",
  "edge-platforms": "Edge",
  "frontend-frameworks": "Frontend",
  "local-llm-runtimes": "Local LLM",
  "payroll": "Payroll",
  "mobile-payments": "POS",
  "payments": "Payments",
  "accounting": "Accounting",
  "security-scanners": "Security",
  "infra-as-code": "IaC",
  "vibe-coding": "Vibe coding",
  "model-gateways": "Gateways",
  "llm-evals-observability": "LLM Evals",
  "ai-search-apis": "AI Search",
  "agent-frameworks": "Agent SDKs",
  "agent-sandboxes": "Sandboxes",
  "product-analytics": "Analytics",
  "crm": "CRM",
  "terminals": "Terminals",
  "legal-ops": "Legal",
  "robotics-platforms": "Robotics",
  "package-managers": "Pkg managers",
  "vector-databases": "Vector DBs",
};

// Build-time only, best-effort: repo is currently private so this 404s and we fall back to
// a plain link. Never let a network hiccup fail the build.
async function fetchStarCount(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, { cache: "force-cache" });
    if (res.ok) {
      const json = await res.json();
      if (typeof json.stargazers_count === "number") return json.stargazers_count;
    }
  } catch {
    /* fall through to env fallback */
  }
  // While the repo is private, the anonymous API can't see it — a deploy-time env var
  // (refreshed from an authenticated fetch before each deploy) carries the count instead.
  const fallback = Number(process.env.GITHUB_STARS_FALLBACK);
  return Number.isFinite(fallback) && fallback >= 0 ? fallback : null;
}

// Compact star-count formatting (1.2k, 3m) — Firecrawl-nav style, lowercase suffix.
function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  const units: [number, string][] = [
    [1_000_000_000, "b"],
    [1_000_000, "m"],
    [1_000, "k"],
  ];
  for (const [threshold, suffix] of units) {
    if (n >= threshold) {
      const value = n / threshold;
      const rounded = value >= 100 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, "");
      return `${rounded}${suffix}`;
    }
  }
  return String(n);
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ProductArena",
  description:
    "ProductArena — the unbiased, evidence-based arena for software in the AI era. Evidence in, rankings out.",
  openGraph: {
    title: "ProductArena",
    description: "The unbiased, evidence-based arena for software in the AI era.",
    url: SITE_URL,
    siteName: "ProductArena",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProductArena",
    description: "The unbiased, evidence-based arena for software in the AI era.",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const categories = loadCategories();
  const icpTypes = loadIcpTypes();
  const stars = await fetchStarCount();
  // The two full global rankings (see app/rankings/*) aren't arenas, but they're arena-shaped
  // (a ranked list you land on and browse) — surfacing them as `type: 'arena'` groups them with
  // the per-category arenas in the palette instead of inventing a one-off section for two items.
  const searchEntries: SearchEntry[] = [
    ...buildSearchIndex(loadAll()),
    { type: "arena", label: "Most agentic (full ranking)", sublabel: "All products, ranked by agentreadyness", href: "/rankings/agentic" },
    { type: "arena", label: "Most AI-native (full ranking)", sublabel: "All products, ranked by agentic", href: "/rankings/ai-native" },
    { type: "arena", label: "Claims vs reality (full ranking)", sublabel: "All products, ranked by claims integrity", href: "/rankings/claims-integrity" },
  ];

  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700,900&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 antialiased">
        <header className="border-b border-zinc-800">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4">
            <div className="flex shrink-0 items-baseline gap-2">
              <a
                href="https://ultrametric.ai"
                className="hidden text-sm text-zinc-500 transition hover:text-emerald-300 sm:inline"
                title="Ultrametric home"
              >
                ultrametric
              </a>
              <span aria-hidden className="hidden text-zinc-700 sm:inline">/</span>
              <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
                {/* The arena mark: two facing triangles (same asset family as the landing site's
                    product-menu icon). */}
                <svg viewBox="0 0 24 24" width={16} height={16} className="shrink-0 text-emerald-400" fill="currentColor" aria-hidden>
                  <path d="M4.5 5.6v12.8c0 .84.99 1.3 1.64.76l7.68-6.4a1 1 0 0 0 0-1.52L6.14 4.84c-.65-.54-1.64-.08-1.64.76Z" />
                  <path opacity="0.5" d="M19.5 5.6v12.8c0 .84-.99 1.3-1.64.76l-7.68-6.4a1 1 0 0 1 0-1.52l7.68-6.4c.65-.54 1.64-.08 1.64.76Z" />
                </svg>
                <span>
                  Product<span className="text-emerald-400">Arena</span>
                </span>
              </Link>
            </div>
            {/* Primary IA: Arenas (the product), Explore (every secondary view: global rankings,
                buyer lenses, methodology/pipeline/proofs/MCP), then the three tools (Stacks,
                Processes, Compare), GitHub, and search. One menu for all secondary destinations
                instead of the old Rankings + Lenses dropdowns + a Methodology link. */}
            <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-400 sm:gap-3">
              <ArenaMenu
                items={categories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  label: NAV_LABELS[c.id] ?? "",
                }))}
              />
              <ArenaMenu
                title="Explore"
                items={[
                  { id: "agentic", name: "Most agent-ready", label: "ranking", href: "/rankings/agentic" },
                  { id: "init", name: "Highest Arena Score", label: "ranking", href: "/rankings/init" },
                  { id: "ai-native", name: "Most AI-native", label: "ranking", href: "/rankings/ai-native" },
                  { id: "claims-integrity", name: "Claims vs reality", label: "ranking", href: "/rankings/claims-integrity" },
                  { id: "icp", name: `Buyer lenses (${icpTypes.length})`, label: "lenses", href: "/icp" },
                  { id: "methodology", name: "Methodology", label: "docs", href: "/methodology" },
                  { id: "pipeline", name: "Testing pipeline", label: "docs", href: "/pipeline" },
                  { id: "proofs", name: "Recorded proofs", label: "docs", href: "/proofs" },
                  { id: "mcp", name: "MCP server", label: "agents", href: "/mcp" },
                ]}
              />
              <Link
                href="/stacks"
                className="flex shrink-0 items-center rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
              >
                Stacks
              </Link>
              <Link
                href="/processes"
                className="flex shrink-0 items-center rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
              >
                Processes
              </Link>
              <Link
                href="/compare"
                className="flex shrink-0 items-center rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
              >
                Compare
              </Link>
              <a
                href={`https://github.com/${REPO}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
              >
                <svg viewBox="0 0 16 16" width={14} height={14} fill="currentColor" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                  />
                </svg>
                {stars !== null ? (
                  <span className="flex items-center gap-1 font-mono text-emerald-400">
                    ★ {formatCompact(stars)}
                  </span>
                ) : (
                  <span className="font-mono">GitHub</span>
                )}
              </a>
              {WATCHLIST_ENABLED && (
                <Link
                  href="/watchlist"
                  title="Your watchlist — starred products, stored in this browser"
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
                >
                  <span aria-hidden className="text-emerald-400">☆</span>
                  <span className="hidden sm:inline">Watchlist</span>
                  <span className="sr-only sm:hidden">Watchlist</span>
                </Link>
              )}
              <CommandPalette entries={searchEntries} />
            </nav>
          </div>
        </header>
        {/* w-full + min-w-0: body is a column flex container, so without min-w-0 this flex
            item's automatic minimum width tracks its content's min-content width — wide tables
            inside overflow-x-auto wrappers would push the whole page wider than the viewport
            on phones instead of scrolling inside their wrapper. */}
        <main className="mx-auto w-full min-w-0 max-w-7xl px-5 py-10">{children}</main>
        <footer className="border-t border-zinc-800 py-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 text-xs text-zinc-400">
            <span>© 2026 Ultrametric Inc</span>
            <div className="flex items-center gap-4">
              <Link href="/pipeline" className="hover:text-emerald-300">
                Testing pipeline
              </Link>
              <Link href="/proofs" className="hover:text-emerald-300">
                Recorded proofs
              </Link>
              <Link href="/submit" className="hover:text-emerald-300">
                Test my product →
              </Link>
              <Link href="/llms.txt" className="hover:text-emerald-300">
                For agents: /llms.txt
              </Link>
              <Link href="/mcp" className="hover:text-emerald-300">
                MCP
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
