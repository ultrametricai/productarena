import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { loadCategories } from "@/lib/data";

const REPO = "ultrametricai/productarena";

// Short nav labels for each arena — full names are too long for a single-line top nav.
const NAV_LABELS: Record<string, string> = {
  "desktop-os": "OS",
  "startup-banking": "Banking",
  "project-management": "PM",
  "web-scraping": "Scraping",
  "mobile-dev": "Mobile",
  "code-hosting": "Git",
  "ai-coding": "AI",
};

// Build-time only, best-effort: repo is currently private so this 404s and we fall back to
// a plain link. Never let a network hiccup fail the build.
async function fetchStarCount(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, { cache: "force-cache" });
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json.stargazers_count === "number" ? json.stargazers_count : null;
  } catch {
    return null;
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Product Arena",
  description: "User-story combat for software. Evidence in, rankings out.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const categories = loadCategories();
  const stars = await fetchStarCount();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 antialiased">
        <header className="border-b border-zinc-800">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
            <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
              Product<span className="text-amber-400">Arena</span>
            </Link>
            <nav className="flex min-w-0 items-center gap-4 overflow-x-auto whitespace-nowrap text-sm text-zinc-400">
              {categories.map((c) => (
                <Link key={c.id} href={`/arena/${c.id}`} className="hover:text-amber-300">
                  {NAV_LABELS[c.id] ?? c.name}
                </Link>
              ))}
              <a
                href={`https://github.com/${REPO}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-300"
              >
                GitHub{stars !== null ? ` ★ ${stars}` : ""}
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-5 py-10">{children}</main>
      </body>
    </html>
  );
}
