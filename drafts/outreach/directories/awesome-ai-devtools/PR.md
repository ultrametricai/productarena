---
venue: github.com/jamesmurdza/awesome-ai-devtools (3.9k stars, active — Resources PRs merged 2026)
type: awesome-list PR
status: draft — NOT submitted. Local branch prepared; founder review required before push.
verified: 2026-09-15 (rules read from .github/PULL_REQUEST_TEMPLATE.md; Resources section
  already lists direct analogues aiforcode.io and AI Coding Compare)
branch: add-productarena-resources in /tmp/pa-awesome/awesome-ai-devtools (ephemeral clone;
  recreate anywhere with `git apply entry.patch` on a fresh clone)
---

# PR draft: Add ProductArena to awesome-ai-devtools → Resources

## Why this list

The `## Resources` section is explicitly scoped to "Curated lists, comparison guides, and
configuration templates for AI coding tools" and already contains two comparison sites
(aiforcode.io, AI Coding Compare). Resources is NOT alphabetical — entries are appended at
the bottom. Dominant entry style: `- [Name](url) — Description.` (em dash).

Their PR template gate: developer tools exclusively; description unambiguous and matching
the style of other entries. No open-source requirement.

## The change (exact — see entry.patch)

Append as the last line of `## Resources`, after the "Awesome AI Startups — Coding &
Developer Tools" entry:

```markdown
- [ProductArena](https://ultrametric.ai/productarena) — Open-methodology comparison rankings of AI coding agents and developer tools, with evidence-cited scoring against published criteria.
```

## PR title

```
Add ProductArena to Resources
```

## PR body (fills their template checklist)

```markdown
## Description

Adds [ProductArena](https://ultrametric.ai/productarena) to the **Resources** section —
comparison rankings of AI coding agents and developer tools where every verdict cites its
public evidence and the scoring methodology is published
(https://ultrametric.ai/productarena/methodology). Same category as the existing
aiforcode.io and AI Coding Compare entries.

## Checklist

- [x] The entry is a developer-focused resource (comparison guide for AI coding tools)
- [x] The description is unambiguous and clear
- [x] The description matches the style of other entries (em-dash separator, ends with a period)
- [x] Added at the bottom of the Resources section (section is append-ordered, not alphabetical)
```

## Submit steps (founder-gated: pushing creates public content under our name)

```sh
gh repo fork jamesmurdza/awesome-ai-devtools --clone /tmp/awesome-ai-devtools
cd /tmp/awesome-ai-devtools && git checkout -b add-productarena-resources
git apply <this-dir>/entry.patch --3way   # or cherry-pick from the prepared local branch
git push -u origin add-productarena-resources
gh pr create --repo jamesmurdza/awesome-ai-devtools --title "Add ProductArena to Resources" --body-file <body above>
```

Then add `status.json` here per drafts/outreach/README.md.
