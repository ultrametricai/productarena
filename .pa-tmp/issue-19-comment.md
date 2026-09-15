Welcome to the arena, YYLO — and thank you for being ProductArena's **first community product submission**. The bar you set with this issue (clear category call, honest affiliation disclosure, and a starter evidence pack with verbatim quotes) is exactly what we hope every future submission looks like.

## What we did

**Security review first** (our standard for every external submission — nothing personal, and yours passed cleanly):
- `yylo.dev` — registered 2026-08-20 (Namecheap, per Google-registry RDAP), HTTPS+HSTS, real docs/site. Young domain, but consistent with your 0.2.x launch timeline.
- `yylo-dev/yylo` — created 2026-01-06, MIT, active history; your account is the repo's top contributor, which matches the disclosed affiliation.
- `@yylo/cli` — registry-published since 2026-08-23, ~933 downloads/month, repository field points back to the same repo, **no install lifecycle scripts**, mainstream dependencies only. We also did a static audit of the 0.2.2 tarball (bin wrappers, dist bundle): no obfuscation, no unexpected network endpoints.
- All four quotes in your evidence pack verified **verbatim** against the live tree before use — though per policy we re-fetched everything ourselves rather than reusing your `fetchedAt` stamps. Note we did not execute the CLI itself during evaluation; the two recorded probes are metadata-only (`npm view` + raw `LICENSE` fetch).

**Arena call: `software-factory`**, as you requested — and we agree it's the honest fit. YYLO wraps agent work in typed task/validation/merge/release boundaries, which is the factory problem from the local-orchestration side; slotting an orchestrator into `ai-coding` against the agents it drives would be a category error.

**Full pipeline bring-up**: crawl (13 URLs: site, `/docs/yylo` + script-catalog pages, ledger/benchmark docs, skills, both sibling READMEs), extract, keyless convention probes, judge (73 stories), claims, rankings, confidence intervals, popularity (stars + npm weekly), integrations (GitHub, Slack — both verified), logo, screenshots.

## Where you landed

**#5 of 8 in Software Factory, ProductArena score 28.9** (between Codegen and Factory):

https://ultrametric.ai/productarena/arena/software-factory/product/yylo

(merged to main with this issue; it appears on the live site with the next deploy — usually same-day)

- **6 full verdicts**: official CLI (q8), headless/CI execution (q7), open license (q8), self-host (q8), sandboxed/test-mode workflow (q7), bulk operations (q8)
- **22 partial, 34 none, 11 na** — the `na` cells are hosted-cloud stories that don't apply to a local-first orchestrator and are excluded from your score denominator entirely.
- Openness carries you (MIT, fully local, npm-distributed). Your **agent-readiness index (20.5) is the drag**, and it's an honest one: no `llms.txt`, no docs `.md` mirrors, no public HTTP API, no MCP server — three negative convention probes are on the record.

## How scores and flags work (and how to move yours)

- **Evidence-or-nothing**: every verdict cites specific evidence items; a capability documented on a page we didn't crawl scores `none`. Your product entry carries a vendor-submission disclosure (citing this issue), and you're judged by the same rules as everyone else.
- **Contest anything**: every verdict on the site has a ⚑ contest link that opens a prefilled issue. New cited evidence → re-judge → verdict moves. That's the whole governance model.
- **Vendor response**: if you want an official statement on the record next to a verdict (CVE-style), use the Vendor Response issue form — verified, published verbatim, never changes a verdict by itself.
- **Score-moving shortlist for YYLO** (see CONTRIBUTING §3c): ship an `llms.txt` at yylo.dev, serve docs pages as `.md` mirrors, and — the big one — an MCP server at `mcp.yylo.dev` would light up the highest-weight agent-readiness story. Each is a keyless probe we can re-run the day you ship it. Then run `npx productarena certify https://yylo.dev` yourself.

Thanks again for the submission and for setting the affiliation-disclosure precedent. When you ship any of the above, open a contest issue or just comment here-adjacent and we'll re-probe and re-judge.

— ProductArena
