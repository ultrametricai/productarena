---
venue: news.ycombinator.com (Show HN)
status: draft — requires founder sign-off before posting
notes: >
  Post from a personal account with history, not a fresh one. Best window:
  Tue–Thu, 6–9am PT. First comment (also drafted below) should land within
  a minute of the post. Do not ask anyone to upvote — HN penalizes it.
---

# Title

Show HN: ProductArena – evidence-based software rankings for the agent era

# URL

https://ultrametric.ai/productarena

# First comment (post immediately after submitting)

Hi HN — we built ProductArena because software rankings are broken in a specific way:
they measure what vendors claim and what reviewers feel, not what actually works. That
gets worse in the agent era, where the "user" is often a coding agent that needs an API,
an MCP server, or llms.txt — not a pretty onboarding flow.

So we test the claims. For 300+ products across 60 categories, we crawl the docs, then run
hands-on keyless probes: real MCP initialize handshakes, real CLI installs, real API calls —
recorded as terminal transcripts you can replay. An LLM judge scores each product against
user stories, and every verdict carries a citation to the evidence, a confidence grade, and
a public contest button. Scores only move when evidence moves; the full history is in git.

Things you can poke at:
- Any arena, e.g. AI coding: every score cell links to its evidence
- /proofs — the recorded terminal sessions behind probe verdicts
- /integrations — 535 integration pairs, each backed by a verbatim doc quote (fabricated
  edges get dropped by an excerpt-verification pass)
- /global — capability diffusion curves (e.g. % of products shipping an official MCP server)
- MCP server + JSON API + llms.txt, so your agent can query the rankings directly

On bias, since we're an AI company ranking AI products: the judge doesn't know who's asking.
ChatGPT outranks Claude in our AI-assistants arena, Anthropic's own skills repo carries
disputed cells and loses a head-to-head, and our own product ranks mid-table. The judge
prompts, scoring code, and every verdict are in the repo — if you find a biased cell, the
contest button opens a public issue.

Ask us anything — especially where you think the methodology is wrong. That's the point.

# Fallback title variants (pick one only if the primary reads stale on the day)

- Show HN: We probe 300 software products with real MCP/CLI/API calls and rank the evidence
- Show HN: G2-style rankings, but every verdict has a citation and a contest button
