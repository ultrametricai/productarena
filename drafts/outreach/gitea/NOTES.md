# Outreach draft: Gitea llms.txt — maintainer review notes

**Status: draft. Nothing has been posted anywhere.** These files exist for a human to review,
edit, and send (or discard).

## Why Gitea (over obsidian / logseq / zulip)

- **OSS with an active public repo**: Gitea is MIT-licensed with active development at
  github.com/go-gitea/gitea, and the docs themselves are an open repo (gitea.com/gitea/docs) —
  a real place to land the artifact. Obsidian fails this criterion outright: the app is
  closed-source and its public repos are releases/community repos, not docs.
- **Scores none on llms.txt/agent-docs**: our committed verdicts
  (`data/code-hosting/verdicts.json`) record `agentic-agent-docs: none` and
  `api-machine-spec: none` for Gitea, with a probe showing `docs.gitea.com/llms.txt` → 404.
  Zulip fails this criterion: it already scores `partial` on agent-docs and `full` on
  machine-readable spec (it ships an OpenAPI file).
- **Genuinely benefits**: Gitea is in a live close race (GitLab 31.4 vs Gitea 28.4, gap 3.0,
  triple-judged) and overtook GitHub on Sep 4 — agent-docs is one of its few remaining "none"
  axes, and self-hosters increasingly point coding agents at their own Gitea instance.
  Logseq was the runner-up, but its docs are a published Logseq graph (no clean sitemap to
  draft from honestly) and the project is mid database-version rewrite.
- **Friendly community**: Gitea's community is contribution-oriented (docs PRs are routine).

## What's in this directory

- `llms.txt` — the artifact: drafted from the docs.gitea.com sitemap (`/sitemap-index.xml` →
  `sitemap-0.xml`), current-version English pages only, curated to ~85 links with short
  descriptions. **Every URL was verified to return HTTP 200 on 2026-09-08** (89/89, including
  the four Optional-section links).
- `issue-body.md` — the proposed issue text, with a suggested title and target in an HTML
  comment. Review checklist before sending: (1) re-run a quick 200-check on the URLs,
  (2) confirm no existing llms.txt issue/PR in go-gitea/gitea or gitea/docs,
  (3) decide issue vs. docs PR — a PR with the file is friendlier if you're up for it.
