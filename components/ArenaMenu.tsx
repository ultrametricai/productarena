"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface ArenaMenuItem {
  id: string;
  name: string;
  label: string;
  // Explicit destination — overrides `${hrefPrefix}/${id}` for menus whose items live under
  // different roots (e.g. the header's Explore menu: /rankings/*, /icp, /methodology).
  href?: string;
}

export default function ArenaMenu({
  items,
  title = "Arenas",
  hrefPrefix = "/arena",
}: {
  items: ArenaMenuItem[];
  title?: string;
  hrefPrefix?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
      >
        {title}
        <span aria-hidden className={`text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 z-50 mt-2 max-h-[70vh] w-64 max-w-[calc(100vw-2.5rem)] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-xl shadow-black/40 sm:left-auto sm:right-0"
        >
          {items.map((item) => (
            <Link
              key={item.id}
              role="menuitem"
              href={item.href ?? `${hrefPrefix}/${item.id}`}
              onClick={() => setOpen(false)}
              className="flex items-baseline justify-between gap-3 rounded-lg px-3 py-1.5 hover:bg-zinc-800 hover:text-emerald-300"
            >
              <span className="text-sm text-zinc-200">{item.name}</span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
