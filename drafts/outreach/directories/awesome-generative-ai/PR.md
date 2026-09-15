---
venue: github.com/steven2358/awesome-generative-ai (12.6k stars, merges weekly — last 2026-09-09)
type: awesome-list PR (DISCOVERIES.md, not the main README)
status: draft — NOT submitted. Local branch prepared; founder review required before push.
verified: 2026-09-15 (rules quoted from CONTRIBUTING.md; Discoveries → Leaderboards already
  lists comparison/ranking sites Price Per Token and Rival)
branch: add-productarena-leaderboards in /tmp/pa-awesome/awesome-generative-ai (ephemeral
  clone; recreate anywhere with `git apply entry.patch` on a fresh clone)
---

# PR draft: Add ProductArena to awesome-generative-ai → DISCOVERIES → Leaderboards

## Why this list, and why Discoveries not the Main List

CONTRIBUTING.md rules (quoted):
- Format: `[ProjectName](Link) - Description.` — plain hyphen separator, period at the end.
- "Add new entries to the bottom of their respective category." (NOT alphabetical)
- "Keep descriptions concise, clear, and straightforward, and end them with a period."
- `#opensource` tag is only for open-source projects — our repo is private, so omit it
  (most Discoveries entries have no tag; no penalty).
- Main List requires "high general interest and significant followers (at least 1,000)" —
  we don't clear that yet, and CONTRIBUTING says such entries go to the Discoveries list.
  Target DISCOVERIES.md → `### Leaderboards` directly and say so in the PR (being upfront
  beats getting bounced).

`### Leaderboards` already hosts exact analogues: Price Per Token (LLM pricing comparison)
and Rival (model leaderboard).

## The change (exact — see entry.patch)

Append at the bottom of `### Leaderboards` in DISCOVERIES.md, immediately after the
`[Rival](https://rival.tips)` line:

```markdown
- [ProductArena](https://ultrametric.ai/productarena) - Evidence-cited comparison rankings of AI coding agents and developer tools, with an open, published methodology.
```

## PR title

```
Add ProductArena to Discoveries Leaderboards
```

## PR body

```markdown
Adds [ProductArena](https://ultrametric.ai/productarena) to **DISCOVERIES.md →
Leaderboards**: comparison rankings of AI coding agents and developer tools where every
verdict links the public evidence it was derived from, scored against a published
methodology (https://ultrametric.ai/productarena/methodology).

Targeting the Discoveries list deliberately (we don't yet meet the Main List's 1,000+
follower bar). Entry follows the CONTRIBUTING format: bottom of its category,
`[Name](link) - Description.`, no #opensource tag (source is not public).
```

## Submit steps (founder-gated)

```sh
gh repo fork steven2358/awesome-generative-ai --clone /tmp/awesome-generative-ai
cd /tmp/awesome-generative-ai && git checkout -b add-productarena-leaderboards
git apply <this-dir>/entry.patch --3way
git push -u origin add-productarena-leaderboards
gh pr create --repo steven2358/awesome-generative-ai --title "Add ProductArena to Discoveries Leaderboards" --body-file <body above>
```

Note: the maintainer hand-reviews FIFO and rejects low-effort adds; the evidence-cited /
open-methodology angle is the differentiator to keep in the body. Then add `status.json`
here per drafts/outreach/README.md.
