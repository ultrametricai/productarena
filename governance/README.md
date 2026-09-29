# Governance — the policies that bind the records

- `REVIEW_POLICY.md` — the review policy, coverage maturity ladder (draft → demonstration →
  reviewed), and the evidence doctrine: what counts as evidence, churn policy, owner-affiliation
  disclosure and adversarial bias audits.
- `AGENT_POLICY.md` — ground rules for agents consuming or contributing to the corpus.
- `SECURITY.md` — the data-hygiene doctrine (no real company data, no PII, fictional fixtures
  only) complementing the repo-root SECURITY.md vulnerability policy.

## What you can contribute here

- **Clarifications with a failure case** — if a policy was ambiguous enough that a real PR or
  contest went sideways, a PR tightening the wording (with the case linked) is welcome.
- **Maturity-ladder and doctrine proposals** — changes to what `reviewed` requires, what
  evidence tiers admit, or how contests settle. These change how every record is judged, so
  they need explicit maintainer sign-off and land separately from data PRs.

No mechanical gate validates prose here beyond `pnpm test` staying green — the gate is review:
policy changes are the one place a maintainer must agree before merge.
