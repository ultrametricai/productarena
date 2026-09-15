# Directory & launch-platform submissions — full ranked plan

Status: research + prepared copy, 2026-09-15. **Nothing here has been submitted.** Two
awesome-list PRs are fully prepared (branches + patches + PR bodies in
`drafts/outreach/directories/`) and await founder sign-off; everything else is either
founder-gated (account/payment) or N/A with the reason noted. Supersedes the earlier
shortlist in `drafts/launch/directories.md` (kept for the MCP-registry prereq notes).
Venue mechanics were verified against each platform's own pages on 2026-09-15; re-verify at
submit time.

Blocking prereq for the whole MCP cluster (unchanged): publish `mcp/` (and ideally `cli/`)
to npm and/or make the MCP server's repo public, and deploy the remote endpoint. Tracked as
founder-blocked; not repeated per-row below.

## Ranked table

| # | Directory | Traffic potential | Requirements | Status |
|---|-----------|-------------------|--------------|--------|
| 1 | Official MCP Registry (registry.modelcontextprotocol.io) | High — upstream feed that PulseMCP and Glama auto-ingest, so one submission populates three+ directories | `server.json` + domain auth (DNS TXT on ultrametric.ai or `/.well-known/mcp-registry-auth`) via `mcp-publisher` CLI; remote-only server allowed, npm optional | **Founder-needed** (DNS/npm control; MCP publish already tracked as founder-blocked) |
| 2 | Hacker News Show HN | High (high variance); links nofollow but drives secondary coverage | Founder account + founder in the comments; rules exclude "lists/reading material" — frame as an interactive artifact ("query the evidence, MCP endpoint"); bias-audit is the ready answer to methodology pushback | **Founder-needed** — draft exists at `drafts/launch/show-hn.md` |
| 3 | awesome-ai-devtools → Resources (jamesmurdza, 3.9k★) | Med — active list whose Resources section already carries two comparison sites | GitHub PR; append-to-bottom, em-dash entry style | **Ready-to-submit** — branch + patch + PR body in `drafts/outreach/directories/awesome-ai-devtools/` |
| 4 | awesome-generative-ai → DISCOVERIES Leaderboards (steven2358, 12.6k★) | Med — very active (merges weekly); Discoveries tier, not main list (needs 1k followers) | GitHub PR; `[Name](link) - Description.` format, bottom of category, no #opensource tag (repo private) | **Ready-to-submit** — branch + patch + PR body in `drafts/outreach/directories/awesome-generative-ai/` |
| 5 | dev.to (content channel) | Med-high; publish API supports `canonical_url`; in-body links effectively dofollow once account is established | Free account + API key; then fully scriptable (`POST /api/articles`) | **Founder-needed** (account) — copy below; best first article: the methodology/bias-audit story |
| 6 | SaaSHub | Med-low each, but ~10 min and its "submit to 110 directories" tool is a free multiplier | Free account, form at saashub.com/services/new | **Founder-needed** (login) — copy below |
| 7 | AlternativeTo | Med-high ("alternatives" SEO is their moat); rejection risk as content-only site — pitch the interactive compare/API/MCP | Free account; $5 skips a months-long review queue | **Founder-needed** (login) — copy below, listed as alternative to G2/Capterra/Gartner |
| 8 | Uneed | Med; DR 75 dofollow (20 upvotes on free tier, guaranteed paid) | Form starts anonymous, signup to finish; free queue ~5 months or $14.99–$29.99 | **Founder-needed** (account + optional $) — copy below |
| 9 | Product Hunt | High on launch day, nofollow | Founder account (new accounts wait 1 week to post — create now), launch prep | **Founder-needed** — copy below |
| 10 | Smithery (MCP) | High among MCP users | Paste hosted URL at smithery.ai/new or REST API with key | **Founder-needed** (MCP publish prereq + account key) |
| 11 | mcp.so | Med-high SEO, big backlog | Freeform GitHub issue on chatmcp/mcpso — automatable, no SLA | **Founder-needed** (MCP publish prereq; issue itself is public outreach → sign-off) |
| 12 | Glama / PulseMCP (MCP) | Med-high | Auto-ingest from official registry (#1); PulseMCP direct submissions PAUSED since 2026-09-03 | **N/A as direct targets** — covered by #1 |
| 13 | Console.dev newsletter | Med-high per feature (30k dev subscribers, editorial) | One email to hello@console.dev, no account | **Founder-needed** (outbound email = outreach sign-off) — pitch below |
| 14 | DevHunt | Med (weekly devtools launch, dofollow) | GitHub OAuth login | **Founder-needed** (login) |
| 15 | Peerlist Launchpad | Med (dev audience) | Peerlist account | **Founder-needed** (login) |
| 16 | Fazier | Med (claims DR 82+ dofollow on paid) | Login; free tier demands a reciprocal backlink (decline — link hygiene), or $29–$139 | **Founder-needed** (login + $; low priority) |
| 17 | MicroLaunch | Med (claims DR 60+) | Login; free queue or $39 | **Founder-needed** (low priority) |
| 18 | IndieHackers | Low SEO (nofollow), medium community value | Account | **Founder-needed** (low priority) |
| 19 | Reddit (r/SideProject, r/AI_Agents, r/ChatGPTCoding) | High but spiky, nofollow; posts also trigger LibHunt auto-indexing | Aged account, strict per-sub self-promo rules; manual by design | **Founder-needed** — lead with the open dataset/bias-audit, not the product |
| 20 | Toolify.ai | Med (huge auto-scraped long tail; already lists comparison sites) | Login-gated form, but email to business@toolify.ai works account-free | **Founder-needed** (outbound email) |
| 21 | Startup Stash | Med (aged domain) | Public form, likely paid | **Founder-needed** (payment unverified) |
| 22 | Hashnode | Med traffic, weak SEO (in-body links rel="ugc"); API went Pro-only ($5/mo) May 2026 | Account | **Founder-needed**; secondary to dev.to |
| 23 | LibHunt | Low-med | Single-field public form, but requires a **public repo** — ours is private | **N/A until repo/MCP public**; auto-ingests HN/Reddit/dev.to mentions anyway |
| 24 | punkpeye/awesome-mcp-servers (95k★) | Med-high discovery (Glama mirrors it); agents get fast-tracked (🤖🤖🤖 title suffix) | CONTRIBUTING requires a **public GitHub repo** ("something you install and run yourself") | **N/A until MCP server has a public repo/npm** — queue for the moment it does |
| 25 | G2 | — | Vendor-vetted marketplace for purchasable software with peer reviews; a free comparison site has nothing to buy/review, is human-vetted at intake, and is literally their competitor | **N/A** |
| 26 | Capterra | — | Same pipeline as G2 now ("G2 Digital Markets"; gartner vendor portal 301s there); requires a purchasable software product | **N/A** |
| 27 | StackShare | — | Acquired by FOSSA (2024), effectively frozen; no active submission pipeline | **N/A** |
| 28 | BetaList | Low fit | Paid-only now, "new startup" novelty framing | **N/A/defer** — we're a live site, not a beta |
| 29 | There's An AI For That / Futurepedia | Med DR, poor fit | $437 / $247–497, refund on rejection; a comparison site *about* AI tools isn't an "AI tool" | **Defer** — only plausible pitch is the MCP server, revisit after npm publish |
| 30 | e2b/awesome-ai-agents, moimikey/awesome-devtools, mahseema/awesome-ai-tools, sourcegraph/awesome-code-ai | — | Evaluated and rejected: wrong scope (we're not an agent / not a browser utility), dormant merge queues, or archived (sourcegraph list archived Feb 2026) | **N/A** |

## Standard submission copy (reuse everywhere)

- **Name:** ProductArena
- **URL:** https://ultrametric.ai/productarena
- **Maker:** Ultrametric, Inc.
- **Tagline (≤60 chars):** `Evidence-cited rankings of AI coding agents and dev tools`
- **Alt tagline:** `Software rankings where every verdict cites its evidence`
- **Short description (~250 chars):** ProductArena ranks software tools — AI coding agents,
  developer tooling, and more — against a published methodology. Every verdict links the
  public evidence it was derived from, and anyone can flag a verdict with counter-evidence.
  Free, no signup.
- **Long description:** ProductArena is an evidence-based software comparison site. Instead
  of star ratings or affiliate-driven "best of" lists, each arena scores products against
  concrete user stories; every verdict cites the public evidence (docs, changelogs, issues,
  recordings) it was derived from, and the full methodology is published. Wrong verdicts can
  be flagged by anyone — including vendors — with counter-evidence, and get re-judged. The
  data is queryable through a public API and an MCP server, and quotable with attribution.
  Free, no account required.
- **Tags:** developer tools, AI, comparison, rankings, benchmarks, open data, MCP
- **Key links:** methodology https://ultrametric.ai/productarena/methodology · MCP
  https://ultrametric.ai/productarena/mcp · llms.txt https://ultrametric.ai/productarena/llms.txt

### Venue-specific copy

**Product Hunt** — Tagline: `Software rankings where every verdict cites its evidence`.
First comment: the founder story — why star-rating review sites are broken, how
evidence-cited verdicts + a public flag mechanism fix the incentive problem, invite the
audience to flag anything wrong (the flag flow is the demo).

**AlternativeTo** — submit as an alternative to: G2, Capterra, Gartner Peer Insights.
Emphasize the interactive parts (compare builder, API, MCP) to dodge the "content site"
rejection. Description: short description above.

**Uneed / DevHunt / Peerlist / MicroLaunch / Fazier** — standard copy verbatim; category
"Developer Tools" or "AI".

**SaaSHub** — standard copy; then run their free "submit to 110 directories" tool from the
same session.

**Console.dev pitch email** (to hello@console.dev, subject `ProductArena — evidence-cited
dev-tool rankings`): "Console features devtools with clear docs and honest positioning —
ProductArena is a rankings site built on that same premise: every verdict cites the public
evidence it came from, methodology is published, wrong verdicts get flagged and re-judged in
the open. Free, no signup: https://ultrametric.ai/productarena — happy to answer anything
about the methodology."

**dev.to article** (once account exists) — title: `We ranked AI coding agents and published
every piece of evidence (and our bias audit)`; canonical_url the methodology page; body =
methodology story + bias-audit precedent + flag mechanism; footer link to the arena.

**Show HN** — already drafted at `drafts/launch/show-hn.md` (founder-blocked).

## Execution order recommendation

1. Founder unblocks the MCP cluster (npm publish / public MCP repo + registry DNS auth) —
   one action, five directories (#1, 10, 11, 23, 24).
2. Founder approves the two ready awesome-list PRs (5-minute review each; branches ready).
3. Free accounts batch: SaaSHub (+110-directory blast), AlternativeTo (+$5 priority),
   dev.to, Uneed. Create the Product Hunt account now regardless (1-week posting cooldown).
4. Show HN when founder has a comments-day free; Product Hunt after that traffic wave.
5. Paid tier only if #1–4 underdeliver: Uneed paid > Fazier > MicroLaunch.
