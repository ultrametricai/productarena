# Directory / registry submissions — target list

Status: draft — each row requires founder sign-off before submitting (these create public
content under our name). Ordered by expected traffic × fit. Mechanics verified against each
venue's contribution docs where public; re-verify at submit time.

Prereqs before ANY submission: publish `mcp/` and `cli/` to npm (both are documented on the
site but not yet installable — submitting before that burns credibility), and deploy the
Cloudflare worker so the remote MCP endpoint is live.

| # | Venue | What we submit | Mechanics |
|---|-------|----------------|-----------|
| 1 | modelcontextprotocol/servers (official community list) | ProductArena MCP server | PR adding one line to the community servers README section, alphabetical order |
| 2 | PulseMCP | MCP server listing | Submission form on pulsemcp.com; needs npm package or remote endpoint URL |
| 3 | Glama MCP directory | MCP server listing | glama.ai/mcp — auto-indexes from GitHub topic `mcp` + manual claim; add the topic to our repo (zero-risk, do first) |
| 4 | mcp.so | MCP server listing | GitHub issue/PR on the chenas/mcp-directory style repo — verify current process |
| 5 | awesome-mcp-servers (punkpeye) | One-line entry under "Search/Data" | PR, follows awesome-list lint rules (alphabetical, one line, no marketing adjectives) |
| 6 | GitHub topics on our repo | `mcp`, `llms-txt`, `ai-agents`, `benchmarks`, `developer-tools`, `rankings` | Repo Settings → topics; no sign-off risk, purely metadata — can do immediately |
| 7 | llmstxt.site / llms.txt directories | Our llms.txt | PR/form; we both serve and index llms.txt, good citizenship story |
| 8 | alternativeto.net | ProductArena as product (alternative to G2/Capterra) | Account + submission form; slow moderation |
| 9 | r/selfhosted + r/opensource | Post about the open dataset + methodology | Reddit posts — draft separately if greenlit; strict self-promo rules, lead with the data not the product |
| 10 | Hacker News | Show HN | See show-hn.md |

Notes:
- #3 and #6 are metadata-only (GitHub topics) — no public post is created, so they're safe
  to do without a launch moment. Everything else should wait for the npm publishes.
- The dataset angle (open, licensed, citable) is the strongest non-promotional hook for #9
  and for any academic/awesome-datasets list later.
