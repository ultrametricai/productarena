"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import GeoMark from "@/components/GeoMark";

export interface ArenaMenuItem {
  id: string;
  name: string;
  label: string;
  icon?: string;
  // Explicit destination — overrides `${hrefPrefix}/${id}` for menus whose items live under
  // different roots (e.g. the header's Explore menu: /rankings/*, /icp, /methodology).
  href?: string;
}

// One titled group of items — the Arenas dropdown passes ~9 curated sections
// (data/arena-sections.json via lib/arenaSections.ts); the Explore menu stays flat via `items`.
export interface ArenaMenuSection {
  name: string;
  items: ArenaMenuItem[];
}

// Case-insensitive live filter over name/label/id — pure so it's unit-testable.
export function filterMenuSections(sections: ArenaMenuSection[], query: string): ArenaMenuSection[] {
  const q = query.trim().toLowerCase();
  if (q === "") return sections;
  return sections.flatMap((section) => {
    const items = section.items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.label.toLowerCase().includes(q) || i.id.includes(q),
    );
    return items.length > 0 ? [{ ...section, items }] : [];
  });
}

export default function ArenaMenu({
  items,
  sections,
  title = "Arenas",
  // Trigger icon (founder 2026-09-23: every top button wears a unique icon).
  triggerIcon,
  hrefPrefix = "/arena",
  geo = false,
  searchable = false,
}: {
  /** Flat list (the Explore menu). Ignored when `sections` is provided. */
  items?: ArenaMenuItem[];
  /** Grouped list with small uppercase section headers (the Arenas menu). */
  sections?: ArenaMenuSection[];
  title?: string;
  triggerIcon?: React.ReactNode;
  hrefPrefix?: string;
  /** Render a deterministic GeoMark (components/GeoMark.tsx) for items without an emoji icon —
      the Explore menu's concept-mark family, seeded by item id so each destination's mark is
      the same one it wears on its own page. */
  geo?: boolean;
  /** Pin a mini search input at the top of the open dropdown (autofocused, filters live). */
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Autofocus the pinned search whenever the dropdown opens (rAF: the input mounts this render).
  useEffect(() => {
    if (!open || !searchable) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open, searchable]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  const allSections = useMemo<ArenaMenuSection[]>(
    () => sections ?? [{ name: "", items: items ?? [] }],
    [sections, items],
  );
  const visibleSections = useMemo(() => filterMenuSections(allSections, query), [allSections, query]);
  const hrefOf = (item: ArenaMenuItem) => item.href ?? `${hrefPrefix}/${item.id}`;

  // Enter in the search box opens the first visible result — the "type a few letters, hit
  // Enter" fast path the ⌘K palette also supports.
  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const first = visibleSections[0]?.items[0];
    if (!first) return;
    e.preventDefault();
    close();
    router.push(hrefOf(first));
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
      >
        {triggerIcon}
        {title}
        <span aria-hidden className={`text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-2 flex max-h-[70vh] w-80 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/40 sm:left-auto sm:right-0 sm:w-96">
          {searchable && (
            // Pinned above the scrolling list (sibling of the overflow container, so it never
            // scrolls away). Filters every section live; Enter opens the first match.
            <div className="shrink-0 border-b border-zinc-800 p-1.5">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder={`Search ${title.toLowerCase()}…`}
                aria-label={`Search ${title.toLowerCase()}`}
                className="w-full rounded-lg bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
            </div>
          )}
          <div role="menu" className="min-h-0 overflow-y-auto p-1.5">
            {visibleSections.map((section) => (
              <div key={section.name}>
                {section.name !== "" && (
                  <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-400/90 first:pt-1">
                    {section.name}
                  </p>
                )}
                {section.items.map((item) => (
                  <Link
                    key={item.id}
                    role="menuitem"
                    href={hrefOf(item)}
                    onClick={close}
                    className="flex items-baseline justify-between gap-3 rounded-lg px-3 py-1.5 hover:bg-zinc-800 hover:text-emerald-300"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm text-zinc-200">
                      {item.icon && <span aria-hidden className="w-4 shrink-0 text-center text-xs leading-none opacity-80">{item.icon}</span>}
                      {!item.icon && geo && (
                        <GeoMark seed={item.id} title={item.name} size={16} className="w-4 justify-center text-zinc-500" />
                      )}
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
            {visibleSections.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-zinc-500">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
