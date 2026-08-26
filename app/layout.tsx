import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 antialiased">
        <header className="border-b border-zinc-800">
          <div className="mx-auto flex max-w-4xl items-baseline justify-between px-5 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Product<span className="text-amber-400">Arena</span>
            </Link>
            <span className="text-xs text-zinc-500">evidence in, rankings out</span>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-5 py-10">{children}</main>
      </body>
    </html>
  );
}
