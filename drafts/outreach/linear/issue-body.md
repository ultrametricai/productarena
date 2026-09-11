<!--
DRAFT — NOT POSTED. For human review before sending.

Status change since our audit: this was drafted as a "fix your llms.txt" gift, but Linear fixed
it upstream first — https://linear.app/llms.txt now serves proper text/plain markdown
(verified 2026-09-11). The gift is now the certification itself: a passing, machine-verifiable
Agent-Ready report (sibling file cert-report.json) plus the one item left for Agent-Native.

Linear's docs site source is not public (developers.linear.app redirects into linear.app/developers,
a closed Next.js app), so a docs PR is not possible — this is an issue draft instead.
Suggested target: https://github.com/linear/linear (issues enabled, MIT, active — verified
2026-09-11). Alternative: developers@ / their developer Slack, founder's choice.
Suggested title: "Your agent surfaces now pass an Agent-Ready conformance suite — report attached (nothing needed)"
Attach or inline: drafts/outreach/linear/cert-report.json
-->

Hi — this is a heads-up with a small gift attached, not a request.

We maintain ProductArena, an open, evidence-based tracker of how agent-ready developer
products are. Part of it is a keyless, read-only conformance suite anyone can run
(`npx productarena certify <url>`) covering the surfaces agents depend on: `llms.txt`,
markdown doc mirrors, OpenAPI at conventional paths, an MCP initialize handshake, robots.txt,
and structured errors.

When we first audited Linear, `linear.app/llms.txt` served the HTML app shell, which kept the
suite from passing. Re-running it on 2026-09-11, that's fixed on your side — it now serves
10 KB of clean text/plain markdown — and Linear passes **Certified Agent-Ready**:

- llms.txt: pass (HTTP 200, non-HTML)
- docs .md mirrors: pass (3/3 sampled pages, e.g. `linear.app/developers/graphql.md`)
- MCP: pass (`mcp.linear.app/mcp` answers initialize with an OAuth protected-resource
  challenge — exactly right)
- robots.txt: pass
- OpenAPI at a conventional path: fail (expected — your API is GraphQL)

The full machine-verifiable report (per-request URLs, statuses, digests) is attached. If you'd
like the dated certification to show on your ProductArena page, it's one issue form and takes
minutes — or ignore this entirely and the result stands as a maintainer-run record either way:
https://ultrametric.ai/productarena/arena/project-management/product/linear

The only check between you and the top level (Agent-Native) is a machine-readable schema at a
conventional path. For a GraphQL API the equivalent would be serving the SDL (the schema you
already publish through introspection and the TypeScript SDK) at a stable documented URL —
happy to share exactly what our suite (and the agents it models) look for, or to adjust the
suite's GraphQL handling if you think SDL-at-a-URL is the better convention. No expectation
attached — if this isn't useful, please just close, and sorry for the noise.
