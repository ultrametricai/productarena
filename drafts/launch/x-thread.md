---
venue: X/Twitter (founder account)
status: draft — requires founder sign-off before posting
notes: attach the OG card (public/og.png renders automatically when linking the site);
  screenshots suggested per tweet below. Thread of 8.
---

1/ Software rankings measure claims. We built one that measures evidence.

ProductArena: 300+ products, 60 categories, 18,000+ judged verdicts — every one cited,
confidence-graded, and publicly contestable.

https://ultrametric.ai/productarena

2/ The AI twist: buyers are increasingly agents, not humans. So we rank what agents need —
does it have a real API? An MCP server that actually handshakes? llms.txt? Can a headless
agent run it end to end?

We don't take the vendor's word. We run the probe and record the terminal session.

3/ Example: Shopify says it's agent-ready. We ran a keyless agent flow through their
Universal Commerce Protocol — live catalog search across merchants, then created a real
cart on Shopify's own hardware store. Recorded. That's what "agent-ready" should mean.
[screenshot: shopify proof transcript]

4/ Spicy findings so far:
- A docs platform whose own llms.txt advertises an MCP URL that 404s
- WooCommerce edging Shopify on openness while losing on API quality
- Codex and Copilot trading the AI-coding lead three times in three days
[screenshot: changelog]

5/ On bias — yes, we're an AI company ranking AI products, including our own and our
competitors'. The judge doesn't know who's asking: ChatGPT ranks above Claude in our
assistants arena, and Anthropic's own repos carry disputed verdicts. Every judge prompt
is public.

6/ For agents: there's an MCP server, a JSON API, and llms.txt. Your coding agent can ask
"top payment APIs by agent-readiness" and get evidence-backed answers natively.
[screenshot: /mcp page]

7/ For buyers: procurement reports per category (print-ready, with confidence grades and a
proofs appendix), stack builder, ICP lenses, and /compare for head-to-heads with the user
stories that matter to you.

8/ It's all open — data, methodology, judge prompts, score history in git. If you find a
wrong verdict, contest it: that's a feature, not a bug reports channel.

⭐ https://github.com/ultrametricai/productarena
