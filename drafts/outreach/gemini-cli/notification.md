---
vendor: Google (Gemini CLI team)
arena: ai-coding
product_id: gemini-cli
venue: https://github.com/google-gemini/gemini-cli/discussions
venue_note: GitHub Discussions confirmed enabled (HTTP 200) on 2026-09-10; new "General" discussion suggested
suggested_title: "ProductArena carries 13 'disputed' verdicts on Gemini CLI — official response channel, if you want it"
status: draft — requires founder sign-off, NOT POSTED
---
<!--
DRAFT — NOT POSTED. For human review before sending.
Verbatim message below this comment.
-->

Hi — we maintain ProductArena, an open, evidence-based tracker of developer products. This is a courtesy notification that Gemini CLI's page currently carries 13 verdicts in our `disputed` tier, and that an official response channel exists if the team ever wants to use it. No action is expected; feel free to ignore or close this.

**What "disputed" means on our site.** Every (product, user-story) cell is judged by an LLM from a committed evidence pack (vendor docs, GitHub, community reports, hands-on probes). `disputed` is defined as: "Vendor claims it, but community/hands-on evidence contradicts — must cite both sides." It is not "doesn't work" — it means the record shows both a first-party claim and concrete contradicting reports, side by side. Disputed cells score at a 0.3 factor (vs 1.0 full / 0.6 partial), so they materially affect the product's arena score. All evidence and rationale are public in the repo (`data/ai-coding/verdicts.json`, `data/ai-coding/evidence/gemini-cli.json`).

**The 13 disputed cells:** agentic-ai-insights, agentic-builtin-assistant, agentic-nl-commands, architecture-navigation, automated-test-and-lint-fixes, enterprise-grade-auth, existing-subscription-auth, full-codebase-mapping, issue-to-pr-automation, natural-language-debugging, natural-language-feature-implementation, persistent-project-instructions, root-cause-analysis.

**A representative example** (persistent-project-instructions). Your README claims "Custom context files (GEMINI.md) to tailor behavior for your projects" (github.com/google-gemini/gemini-cli, fetched 2026-08-28). A community report contradicts it: "Tip 1, it consistently ignores my GEMINI.md file, both global and local, even though it always says '1 GEMINI.md file is being used.'" (https://news.ycombinator.com/item?id=46060508). Our committed rationale for that cell reads, in part: "a hands-on community report says the CLI 'consistently ignores my GEMINI.md file' ... a concrete functional contradiction rather than mere skepticism. Missing for 10: independent confirmation that GEMINI.md reliably enforces standards, and no vendor response addressing the ignoring bug."

Most of the other cells hinge on the same cluster of community reports about agentic reliability (error loops, failed edits — https://news.ycombinator.com/item?id=46060508) and two auth reports: Workspace-account login failing ("Failed to login. Ensure your Google account is not a Workspace account") and subscription confusion ("Paying them specifically for 'Gemini' doesn't get me anything for 'Gemini CLI'") — both at https://news.ycombinator.com/item?id=44376919. Full per-cell rationales: https://ultrametric.ai/productarena/arena/ai-coding/product/gemini-cli

**How to respond officially, if you want to.** We run a CVE-style vendor-response lane: a short official statement (≤1200 chars), verified as actually coming from the vendor, published verbatim next to the specific verdict — even if it flatly disagrees with us. It never changes a verdict by itself; it enters the evidence pool for the next re-judge. Process: https://github.com/ultrametricai/productarena/blob/main/docs/VENDOR-RESPONSES.md — intake form: https://github.com/ultrametricai/productarena/issues/new?template=vendor-response.yml. If any of these behaviors are since fixed and reproducible with keyless deterministic commands, a *Prove a story* submission is stronger than a statement: https://github.com/ultrametricai/productarena/blob/main/docs/PROVE-IT.md

No expectation attached — the verdicts stand on the public evidence either way, and silence carries no penalty. If this isn't useful, please just close this and sorry for the noise.
