# Homebrew PR #23967 — close-out (RETIRE, do not resend)

**Final state (2026-09-15): CLOSED, rejected on merits by the lead maintainer.** Do not
reopen, do not relitigate, do not send a revised version.

## Timeline and verbatim objections

1. **Bot close (missing template)** — github-actions, on open:

   > Thanks for your pull request. This has been closed because it appears to be missing the
   > pull request template, perhaps because this was written by an AI not a human. We require
   > humans to read and fill in these templates.
   >
   > Please edit this pull request to fill in the current pull request template. This
   > workflow will reopen this pull request automatically once the template is complete.
   > **Do not open a new pull request for this.**

   This was fixed (template filled in) and the workflow reopened the PR.

2. **Merit rejection (final)** — MikeMcQuaid (Homebrew project leader), 2026-09-15, closing:

   > This offers no advantage over the index. Passing on this.

## Reading

The objection is scope/value, not quality or process: docs.brew.sh already has a human-facing
index page, and the maintainer sees no advantage in a parallel machine-facing one. That is a
project-direction call and it is final. Per our own rules of engagement ("if this isn't
something the project wants, please just close") the correct move is a brief thanks and
nothing else.

## Optional graceful exit comment (founder decision — posting is fine but not required)

```
gh pr comment 23967 --repo Homebrew/brew --body \
"Understood — thanks for taking a look, and sorry for the noise. For transparency: the file \
and the original description were AI-drafted; I reviewed and verified everything and take \
responsibility for the submission (including initially missing the PR template — apologies \
for that)."
```

Do NOT include score/tracker talk, do NOT ask them to reconsider, do NOT link ProductArena
again.

## Program consequences (folded into README.md checklist + GIFT-LIST learnings)

- Template-presence is bot-enforced on some repos; a missing template literally reads to
  their tooling as "written by an AI not a human".
- "No advantage over the index" is a genre-level objection to llms.txt gifts: any remaining
  llms.txt draft must answer, in the PR body, what the file adds over the docs site's
  existing human index/sitemap (machine-stable entry point, curated for agents, plain text) —
  or the target should be screened out when maintainers are known scope-hawks.
- A "passing on this" from a lead maintainer retires the gift permanently. Our verdict data
  for homebrew (`agentic-agent-docs: none`) stays as-is — the surface did not change.
