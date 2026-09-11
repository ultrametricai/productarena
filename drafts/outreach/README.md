# Outreach drafts

**Nothing in this directory has been posted anywhere.** Every file is a draft awaiting founder
review; sending (or discarding) is a human decision. Venue URLs and the live product-page URLs
were checked read-only (HTTP 200) on the date noted in each draft's frontmatter — no issues,
discussions, emails, or form submissions were created.

## Index

| Draft | Arena | Type | Venue | Status |
| --- | --- | --- | --- | --- |
| [GIFT-LIST](./GIFT-LIST.md) | (cross-arena) | ranked gift-PR program (18 candidates) | various — see list | draft — requires founder sign-off |
| [gitea](./gitea/issue-body.md) | code-hosting | gift (llms.txt offer) | github.com/go-gitea/gitea issue or gitea.com/gitea/docs PR | draft — requires founder sign-off |
| [linear](./linear/issue-body.md) | project-management | gift (passing cert report + invitation) | github.com/linear/linear issue (docs source closed — no PR possible) | draft — requires founder sign-off |
| [vllm](./vllm/PR.md) | local-llm-runtimes | gift PR (llms.txt, 50 links verified) | vllm-project/vllm → `docs/llms.txt` (DCO sign-off required) | draft — requires founder sign-off |
| [crawl4ai](./crawl4ai/PR.md) | web-scraping | gift PR (llms.txt, 49 links verified) | unclecode/crawl4ai → `docs/md_v2/llms.txt` | draft — requires founder sign-off |
| [homebrew](./homebrew/PR.md) | package-managers | gift PR (llms.txt, 49 links verified) | Homebrew/brew → `docs/llms.txt` (Responsible-AI disclosure included) | draft — requires founder sign-off |
| [docusaurus](./docusaurus/PR.md) | docs-platforms | gift PR (llms.txt, 54 links verified) | facebook/docusaurus → `website/static/llms.txt` (Meta CLA required) | draft — requires founder sign-off |
| [gemini-cli](./gemini-cli/notification.md) | ai-coding | disputed-verdict notification | github.com/google-gemini/gemini-cli/discussions | draft — requires founder sign-off |
| [cloudflare](./cloudflare/notification.md) | edge-platforms | disputed-verdict notification | github.com/cloudflare/workers-sdk/discussions | draft — requires founder sign-off |
| [logseq](./logseq/notification.md) | notes-knowledge | disputed-verdict notification | github.com/logseq/logseq/discussions | draft — requires founder sign-off |
| [sentry](./sentry/notification.md) | observability | disputed-verdict notification | github.com/getsentry/sentry/discussions | draft — requires founder sign-off |
| [cockroachdb](./cockroachdb/notification.md) | serverless-databases | disputed-verdict notification | github.com/cockroachdb/cockroach/discussions | draft — requires founder sign-off |

## Gift-PR drafts: selection rationale

See [GIFT-LIST.md](./GIFT-LIST.md) for the full 18-candidate ranking (acceptance likelihood ×
visibility × score impact), the re-verification log, and the rules of engagement. The five
full drafts: linear (mandated; its "one file from certified" gap was fixed upstream, so the
gift became a passing cert report), then the four highest-leverage llms.txt gifts (vllm,
crawl4ai, homebrew, docusaurus). Every URL in every drafted llms.txt was verified HTTP 200 on
2026-09-11; each vendor's `NOTES.md` carries the dated verification log and repo-policy notes
(DCO/CLA/AI-disclosure).

## Disputed-verdict notifications: selection rationale

Vendors were ranked by (a) number of `disputed` cells in `data/*/verdicts.json`, (b) how
consequential the dispute is (headline score or a close race), (c) having a real public channel
(GitHub Discussions confirmed enabled on all five repos). One vendor per arena:

- **gemini-cli** — 13 disputed cells, the most of any product; last place (22.0) in the
  headline ai-coding arena.
- **cloudflare** — 8 disputed cells while ranked #1 in edge-platforms (29.5); disputes cut at
  its core "no lock-in" claim.
- **logseq** — 7 disputed cells in a razor-thin race (21.5 vs 21.2 for the next product).
- **sentry** — 4 disputed cells, all self-hosting/licensing, in the closest race we track
  (32.8 vs 32.7 for new-relic).
- **cockroachdb** — 5 disputed cells including openness-open-license and openness-full-export,
  where dated community reports may no longer reflect the current licensing model — the exact
  case the vendor-response lane exists for.

## Review checklist before sending any notification

1. Confirm every quoted excerpt still matches `data/<arena>/evidence/<product>.json` and every
   rationale quote matches `data/<arena>/verdicts.json` (verdicts move on re-judges).
2. Confirm the disputed cell list and score/rank claims against the current `rankings.json`.
3. Confirm the venue still exists and check for an existing thread on the same topic.
4. Intake links point at `.github/ISSUE_TEMPLATE/vendor-response.yml` and
   `docs/VENDOR-RESPONSES.md` — both exist in this repo; the repo must remain public for the
   links to work.
5. Post from a human account, one vendor at a time; space them out.
