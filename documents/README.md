# Documents — the open-documents map for founders

A catalog of every openly licensed or freely published legal document a founder can actually
use, as dated records in `registry.json`. Policy: **link, never redistribute** — the documents
themselves are never copied into this repo; each record points at the publisher's live page,
curl-verified on its `checked_on` date. Publishers change asset URLs (YC's SAFE downloads are
content-hashed and rotate), so records link the stable page, and the note says so.

Honesty notes are part of the record: `license_note` states the actual terms as published and
what still requires counsel. A free form is a starting point — none of these substitute for a
lawyer on formation filings, financings, employment in a new state, token sales, or board
actions. Candidates that failed live verification on 2026-09-29 were excluded (seriesseed.com
unreachable; SEC/DOL pages block non-browser fetches; several old Cooley GO and Bonterms
per-form slugs now 404 and are represented by their live successors).

Record shape: `{id, name, publisher, url, license_note, use_case, jurisdiction, format,
checked_on}` with `use_case` ∈ formation | fundraising | hiring | commercial | governance.
Gate: `lib/documents.ts` + `__tests__/documents.test.ts` (unique ids, HTTPS, enums, dated
checks, and this README staying in sync with the registry).

## Formation

| id | Document | Publisher | What counsel still does |
| --- | --- | --- | --- |
| `cooley-incorporation-package-de` | Incorporation Package (Delaware) | Cooley GO | Review before filing; confirm share counts and par value |
| `de-formation-instructions` | How to Form a New Business Entity | Delaware Division of Corporations | Entity choice; certificate customization |
| `irs-form-ss4` | Form SS-4 (EIN application) | IRS | Usually none — the online EIN flow is free |
| `irs-form-15620` | Form 15620 (83(b) election) | IRS | Confirm the election is right; the 30-day window is unforgiving (rule `us-fed.83b-filing-period`) |

## Fundraising

| id | Document | Publisher | What counsel still does |
| --- | --- | --- | --- |
| `yc-postmoney-safe-cap` | Post-Money SAFE — Valuation Cap Only | Y Combinator | Securities filings (Form D, blue sky); side letters |
| `yc-postmoney-safe-discount` | Post-Money SAFE — Discount Only | Y Combinator | Same as above |
| `yc-postmoney-safe-mfn` | Post-Money SAFE — MFN Only | Y Combinator | Same as above |
| `yc-pro-rata-side-letter` | SAFE Pro Rata Side Letter | Y Combinator | Model dilution before granting (see `lib/openstartup/capTable.ts`) |
| `yc-safe-user-guide` | Post-Money SAFE User Guide | Y Combinator | — (explanatory; our cap-table tests replay its examples) |
| `yc-series-a-term-sheet` | Series A Term Sheet Template | Y Combinator | Drafting the definitive documents |
| `nvca-model-legal-documents` | NVCA Model Legal Documents (Series A suite) | NVCA | Everything — these are counsel's starting brackets |
| `cooley-series-seed-package` | Series Seed Equity Financing Package | Cooley GO | Closing mechanics, disclosure schedule |
| `cooley-convertible-note-term-sheet` | Convertible Note Term Sheet | Cooley GO | Note vs SAFE choice; maturity/interest terms |
| `saft-form` | SAFT form and whitepaper | SAFT Project | Mandatory — contested securities-law territory |
| `cooley-cap-table-pro-forma` | Sample Cap Table (financing pro forma) | Cooley GO | — (modeling aid) |
| `cooley-dd-request-list` | Sample VC Due Diligence Request List | Cooley GO | — (data-room checklist) |

## Hiring

| id | Document | Publisher | What counsel still does |
| --- | --- | --- | --- |
| `cooley-offer-letter` | Form of Employee Offer Letter | Cooley GO | State-specific employment law (California especially) |
| `cooley-ciiaa` | Employee CIIAA / PIIA | Cooley GO | State invention-assignment carve-out notices |
| `cooley-advisor-agreement` | Form of Advisor Agreement | Cooley GO | Board approval + 409A-defensible strike for any equity |
| `cooley-consulting-agreement` | Form of Consulting Agreement | Cooley GO | Worker-classification analysis |

## Commercial

| id | Document | Publisher | What counsel still does |
| --- | --- | --- | --- |
| `commonpaper-csa` | Cloud Service Agreement (standard) | Common Paper | Cover-page variables for unusual deals |
| `commonpaper-mutual-nda` | Mutual NDA (standard) | Common Paper | Usually none — sign as-is |
| `commonpaper-dpa` | Data Processing Agreement (standard) | Common Paper | Verify transfer mechanisms for your data flows |
| `onenda` | oneNDA (open standard NDA) | oneNDA | Usually none — the point is not modifying it |
| `bonterms-forms` | Bonterms standard agreements | Bonterms | Enterprise-specific attachments |
| `cooley-mutual-nda` | Mutual NDA (negotiable form) | Cooley GO | When a counterparty rejects fixed standards |

## Governance

| id | Document | Publisher | What counsel still does |
| --- | --- | --- | --- |
| `orrick-tech-studio` | Tech Studio forms library (board/stockholder consents, equity forms) | Orrick | Confirm statutory formalities of board action (see `rules/US-DE`) |
