import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import ArenaMenu from "@/components/ArenaMenu";
import CommandPalette from "@/components/CommandPalette";
import { loadAll, loadCategories } from "@/lib/data";
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
                <span>
                  Product<span className="text-emerald-400">Arena</span>
                </span>
              </Link>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-400 sm:gap-3">
              <ArenaMenu
                items={categories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  label: NAV_LABELS[c.id] ?? "",
                }))}
              />
              <ArenaMenu
                title="Rankings"
                hrefPrefix="/rankings"
                items={[
                  { id: "agentic", name: "Most agent-ready", label: "" },
                  { id: "init", name: "Highest Arena Score", label: "" },
                  { id: "ai-native", name: "Most AI-native", label: "" },
                  { id: "claims-integrity", name: "Claims vs reality", label: "" },
                ]}
              />
              <Link
                href="/stacks"
                className="flex shrink-0 items-center rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
              >
                Stacks
              </Link>
              <Link
                href="/methodology"
                className="hidden shrink-0 items-center rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300 md:flex"
              >
                Methodology
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
            <span>© 2026 Ultrametric Inc · data CC BY 4.0</span>
            <div className="flex items-center gap-4">
              <a
                href={`https://github.com/${REPO}/issues/new?template=request-a-product.yml`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-300"
              >
                Submit a product →
              </a>
              <Link href="/llms.txt" className="hover:text-emerald-300">
                For agents: /llms.txt
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
