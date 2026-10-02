# Build size: what's big, what we excluded, how to diagnose a regression

Founder report (2026-10-02): "we are generating 17GB of files for each build which is
grinding things to a halt", plus ENOSPC failures in Vercel's output packaging. Measured on
that date with next@16.3.8 (Turbopack), 7,118 generated pages, 94 server traces.

## The 17GB is two separate problems

`du -sh .next` = 18 GB: `.next/server` 17 GB (virtually all `.next/server/app` prerender
artifacts — problem 2), `.next/cache` ~0.3 GB, `.next/static` 2.6 MB. The tracing fix
(problem 1) does not shrink the local `.next` — it shrinks what the deployment packaging
copies per function, which is what was failing on Vercel.

### 1. Deployment traces dragged the whole corpus into every function (fixed here)

Every page imports loaders (`lib/data.ts` and friends) that read repo data with `fs` at
prerender time. `@vercel/nft` cannot tell build-time reads from runtime reads, so every
page's `.nft.json` trace listed the lot. Measured before the fix (summing the on-disk size
of every file listed by every trace — this is what Vercel copies per function when
packaging the deployment, and what ran its container out of disk):

| | before | after |
|---|---|---|
| traced bytes, all 94 traces | 10.17 GB | 2.64 GB |
| `data/**` share | 6.64 GB | 0.22 GB (preview routes only) |
| `public/**` share | 1.25 GB | 0.24 GB (preview routes only) |
| `node_modules` share (legit function deps) | 2.02 GB | 2.02 GB (unchanged — nothing over-excluded) |
| typical static page trace | ~116 MB, ~5,900 files | ~26 MB, ~290 files (node_modules + .next chunks only) |
| fattest trace (`/arena/.../product/[id]`) | 244 MB, 46,955 files | 27 MB, 393 files |
| the 3 preview-route traces | ~116 MB each | 187 MB each (see include notes below) |
| `.nft.json` files themselves on disk | 56 MB | 7.4 MB |

The preview traces GREW by design: the include globs are matched unanchored, so
`'./data/**'` re-includes the `public/data/**` mirror too (~83 MB extra per preview
function). 187 MB traced (of which ~24 MB node_modules) is below the per-function size
limit, but it is the number to watch as `data/` grows.

The fix is `outputFileTracingExcludes` in `next.config.ts`. See that file's comments for
the exact shape; the summary of what we verified **empirically against this Next version's
Turbopack tracer** (probe builds 2026-10-02 — the shipped docs describe the webpack/JS
path in `collect-build-traces.js`, which DOES NOT RUN under Turbopack):

- `'*'` works as a global route key (applies to every route, including dynamic ones).
- Exact keys (`'/ops'`), brace alternations (`'/{ops,proofs}'`), and single-star path
  segments (`'/vs/*'` matches `'/vs/[slug]'`) all work.
- **Negated keys (`'!{...}'`) are silently ignored** — do not use them.
- **Includes are applied AFTER excludes and win** — the reverse of the JS implementation
  in `collect-build-traces.js`. A route listed in `outputFileTracingIncludes` keeps those
  files even when a global exclude matches them.
- Value globs (both excludes and includes) are matched UNANCHORED (contains-style):
  `'./data/**'` also strips — or re-includes — `public/data/**`. Keep patterns specific
  enough that they cannot collide with `node_modules` paths (verified: every page trace
  keeps its full `node_modules` set with the current list).
- **Never anchor a value glob with a leading slash**: `'/data/**'` makes the tracer's
  `read_glob` walk outside the project and crash the whole build on node_modules
  platform-stub symlink loops (`TurbopackInternalError ... is a symlink causes that causes
  an infinite loop`).
- Excludes do not disturb the `next-server.js.nft.json` trace (it contains only
  `node_modules` files).

### 2. Prerender artifacts are huge (measured, reported, NOT fixed here)

`.next/server/app` holds the prerendered output: 11.7 GB of `.rsc` (31,304 files,
avg 372 KB) + 6.9 GB of `.html` (6,261 files, avg 1.1 MB). Each page is materialized
~4 times: `.html`, `.rsc`, `.segments/_full.segment.rsc`, `.segments/_index.segment.rsc`
(+ per-segment files). By directory: `arena/` 9.5 GB, `vs/` 6.5 GB, `alternatives/`
0.5 GB, `processes/` 0.5 GB.

The single biggest shared cost: `app/layout.tsx` passes the full command-palette search
index (`buildSearchIndex(loadAll(), ...)` — every arena, every product, all alias
keywords) as props to the `CommandPalette` **client** component. That serializes a
~160 KB flight blob into every artifact of every page: ~160 KB x 4 copies x 7,118 pages
≈ 4.5 GB of the 17 GB, and ~160 KB of every page's wire HTML. A near-empty page
(`/about`) is 215 KB of HTML + 172 KB rsc + 348 KB segments mostly because of it.
Candidate fix (own change, not done here): stop passing the index as props; serve it as
a static JSON (it is already buildable at `public/`-time) and fetch it when the palette
opens.

`.next/cache` (Turbopack) was ~300-360 MB across builds — not part of the problem, and
fine to keep persisted in CI/Vercel build caching.

## The include exceptions (preview routes)

Only three routes render at request time (`force-dynamic`); everything else is
prerendered (`force-static`, or `generateStaticParams` + `dynamicParams = false`, and
all route handlers are `force-static`):

- `/processes/preview`
- `/processes/preview/[id]`
- `/processes/incorporate-c-corp/v2`

At request time they read `processes/corpus.json` (+ `artifacts.json`,
`vendor-registry.json`), `journeys/chains.json`, `content/processes/records/**` — and they
render the root layout, which reads `data/**` (`loadAll()` for the palette index) and
lists `public/logos` (`hasLogo`). Their traces must keep all of that
(`PREVIEW_RUNTIME` in `next.config.ts`). NOT kept: the 34 `pipeline/cache/judge/**` files
the auto-tracer used to drag in — nothing reads them at request time, and the include glob
cannot be narrowed to 34 files (`'./pipeline/cache/judge/**'` re-includes all ~34,000 /
133 MB). `scripts/check-preview-runtime.mjs` is the gate: it asserts the required files
are in the traces, boots the packaged artifact from ONLY the traced files, fetches the
preview routes, and fails on any ENOENT.

## Diagnosing a regression

1. `pnpm build`, then `node scripts/check-preview-runtime.mjs` — it now also fails if a
   static route's trace carries any excluded directory again (`verifyStaticTraceExcludes`).
2. To see where traced bytes go: sum `stat` sizes of the files listed in
   `.next/server/app/<route>/page.js.nft.json` (resolve entries relative to the trace
   file), bucketed by top-level directory.
3. If `.next` itself balloons again, check `du -sh .next/server/app/*` and look at a
   single page's `.html`: the `self.__next_f.push` script blobs are the serialized client
   props — a new fat blob there means someone passed a big object to a client component
   mounted in a shared layout.
4. Changing the excludes? The route keys and value globs behave as the probe results
   above describe — verify any new syntax with a probe build before trusting it; the
   shipped `output.md` doc does not describe this tracer.
