# Open documents — the canonical startup documents, mapped

A catalog of every openly licensed or freely published legal document a founder can actually
use, as dated records in `registry.json` (100 records across formation, fundraising,
governance, hiring, commercial, privacy, and open-source). Policy: **link, never
redistribute** — the documents themselves are never copied into this repo; each record points
at the publisher's live page, curl-verified (browser UA) on its `checked_on` date. Publishers
change asset URLs (YC's SAFE downloads are content-hashed and rotate; Bonterms' per-form pages
404), so records link the stable page, and the note says so.

Honesty notes are part of the record: `license_note` states the actual terms as published and
what still requires counsel. A free form is a starting point — none of these substitute for a
lawyer on formation filings, financings, employment in a new state or country, token sales,
data transfers, or board actions.

Record shape: `{id, name, publisher, url, license_note, use_case, jurisdiction, format,
checked_on}` with `use_case` ∈ formation | fundraising | hiring | commercial | governance |
privacy | open-source. The registry states a `review_window_days` (currently 120): every
record's `checked_on` must fall within that window before `updated_on` — the currency
invariant. Gate: `lib/documents.ts` + `__tests__/documents.test.ts` (unique ids, HTTPS, enums,
dated checks, the review window, and this README staying in sync with the registry).

## Exclusions and dead-link corrections (2026-09-30 sweep)

Never a filler or hopeful link — candidates that failed live verification are excluded or
re-homed, with reasons:

- **seriesseed.com** — still unreachable; the canonical live home is the original GitHub repo
  (`series-seed-github`), with Cooley GO's generator as the guided fill.
- **meetair.co (BSA-AIR's original open-source home)** — the domain is squatted (301s to an
  unrelated site); `bsa-air` points at Seedsummit's live page instead.
- **500.co/kiss** — serves a bare logo shell with no document content; `kiss-500-global`
  points at Cooley GO's KISS generator, the live home of 500 Global's open-sourced forms.
- **NVCA model Term Sheet** — no longer offered among NVCA's financing documents (verified on
  the page); the suite is enumerated per document with NVCA's own update dates, and
  `yc-series-a-term-sheet` covers the term-sheet need.
- **HHS sample BAA provisions** — hhs.gov returns 403 to scripted fetches (same class as the
  SEC/DOL exclusions from the first pass); `commonpaper-baa` and `bonterms-baa` are the
  verifiable open BAAs.
- **seedlegals.com/seednote/** — 404; `seedlegals-seednote` links the live resource page.
- **ICO's old IDTA guidance path** — 404; `uk-idta-addendum` links the current home.
- **EC Art. 28 SCC sub-page** — guessable slugs 404; `eu-scc-controller-processor` links the
  stable SCC hub, which hosts both sets.
- **Ungated option plan / stock option grant templates** — no openly published canonical
  exists: Cooley GO doesn't offer one, and Orrick's equity forms sit behind Tech Studio
  registration (covered by `orrick-tech-studio` with that caveat stated). Clerky's materials
  are platform-gated. Honest gap, not a missing link.
- **NVCA PIPE and university-licensing documents** — live on the same page but out of scope
  for a startup registry (public-company PIPEs, TTO licensing); deliberately not cataloged.

## Cross-references (documents ↔ resources ↔ rules)

Documents implement laws and pair with guides already cataloged elsewhere — cite ids, don't
duplicate rows:

- `irs-form-15620` implements the 83(b) election — rule cards `us-fed-83b-filing-period`,
  `us-fed-83b-form-and-copies`, `us-fed-83b-revocation` (rules/US-FED); also a resources row
  (`irs-form-15620` there points at the same form).
- Advisor/option grants (`cooley-advisor-agreement`, `fi-fast-advisor`) sit under the 409A
  rule cards (rules/US-FED) and Delaware option-authorization card (rules/US-DE).
- Equity-compensation context: the Holloway Guide and Index Rewarding Talent are resources
  (`holloway-equity-guide`, `index-rewarding-talent`), not duplicated here.
- The SAFE cap-table arithmetic in `yc-safe-user-guide` is implemented in
  `lib/openstartup/capTable.ts` and replayed in its tests.
- `eu-scc-international-transfers` and `uk-idta-addendum` are the GDPR Art. 46 / UK GDPR
  transfer mechanisms that the DPAs here (`commonpaper-dpa`, `bonterms-dpa`, `onedpa`)
  incorporate by reference.
- Resource-registry umbrella rows (`yc-documents`, `cooleygo-documents`, `nvca-model-docs`,
  `commonpaper-standards`, `bonterms-forms`, `onenda`, `saft-project` in resources/) point at
  the same publishers; this registry enumerates the individual documents.
- "Raise on standard documents; negotiate the numbers, not the boilerplate" — law 21 in
  resources/LAWS.md — is the doctrine behind the fundraising table.

## Formation

| id | Document | Publisher | What counsel still does |
| --- | --- | --- | --- |
| `cooley-incorporation-package-de` | Incorporation Package (Delaware) | Cooley GO | Review before filing; confirm share counts and par value |
| `cooley-incorporation-package-nv` | Incorporation Package (Nevada) | Cooley GO | Confirm the entity-state choice — Nevada ≠ Delaware |
| `cooley-pbc-incorporation-package-de` | PBC Incorporation Package (Delaware) | Cooley GO | Charter-level public-benefit drafting |
| `cooley-subsidiary-incorporation-package` | Wholly Owned Subsidiary Incorporation Package | Cooley GO | Cross-border tax structuring |
| `de-formation-instructions` | How to Form a New Business Entity | Delaware Division of Corporations | Entity choice; certificate customization |
| `irs-form-ss4` | Form SS-4 (EIN application) | IRS | Usually none — the online EIN flow is free |
| `irs-form-15620` | Form 15620 (83(b) election) | IRS | Confirm the election is right; the 30-day window is unforgiving (rule `us-fed.83b-filing-period`) |
| `uk-model-articles` | Model articles of association | UK Government (Companies House) | Bespoke articles at the first priced round |
| `startup-india-templates` | Startup India legal/HR template library | Startup India (DPIIT) | Indian company-law formalities |

## Fundraising

| id | Document | Publisher | What counsel still does |
| --- | --- | --- | --- |
| `yc-postmoney-safe-cap` | Post-Money SAFE — Valuation Cap Only | Y Combinator | Securities filings (Form D, blue sky); side letters |
| `yc-postmoney-safe-discount` | Post-Money SAFE — Discount Only | Y Combinator | Same as above |
| `yc-postmoney-safe-mfn` | Post-Money SAFE — MFN Only | Y Combinator | Same as above |
| `yc-pro-rata-side-letter` | SAFE Pro Rata Side Letter | Y Combinator | Model dilution before granting (see `lib/openstartup/capTable.ts`) |
| `yc-safe-intl-variants` | SAFE variants: Canada, Cayman, Singapore | Y Combinator | Local securities and corporate law |
| `yc-safe-user-guide` | Post-Money SAFE User Guide | Y Combinator | — (explanatory; our cap-table tests replay its examples) |
| `yc-series-a-term-sheet` | Series A Term Sheet Template | Y Combinator | Drafting the definitive documents |
| `cooley-yc-safe-generator-us` | YC SAFE generator (US) | Cooley GO | Wrapper on YC's forms — same counsel items |
| `cooley-yc-safe-generator-uk` | YC SAFE generator (UK) | Cooley GO | SEIS/EIS interaction — compare `seedlegals-seedfast` |
| `cooley-yc-safe-generator-sg` | YC SAFE generator (Singapore) | Cooley GO | Singapore counsel |
| `orrick-safe-financing-toolkit` | SAFE Financing Toolkit (US) | Orrick Tech Studio | Registration may be required; same SAFE counsel items |
| `kiss-500-global` | KISS debt + equity documents | 500 Global (via Cooley GO) | Instrument choice; securities filings |
| `series-seed-github` | Series Seed equity documents (originals) | Series Seed | Closing mechanics, disclosure schedule |
| `cooley-series-seed-package` | Series Seed Equity Financing Package | Cooley GO | Closing mechanics, disclosure schedule |
| `cooley-series-seed-note-package` | Series Seed Convertible Note Package | Cooley GO | Note vs SAFE choice |
| `nvca-certificate-of-incorporation` | NVCA Model Certificate of Incorporation (Oct 2025) | NVCA | Everything — counsel's starting brackets |
| `nvca-stock-purchase-agreement` | NVCA Model Stock Purchase Agreement (Oct 2025) | NVCA | Disclosure schedule; negotiation |
| `nvca-investors-rights-agreement` | NVCA Model Investors' Rights Agreement (Oct 2025) | NVCA | Registration/information-rights brackets |
| `nvca-voting-agreement` | NVCA Model Voting Agreement (Jun 2026) | NVCA | Board composition, drag-along |
| `nvca-rofr-cosale-agreement` | NVCA Model ROFR and Co-Sale Agreement (Apr 2026) | NVCA | Transfer-restriction alignment |
| `nvca-management-rights-letter` | NVCA Model Management Rights Letter (Jul 2020) | NVCA | Explaining what it obliges |
| `nvca-indemnification-agreement` | NVCA Model Indemnification Agreement (Jul 2020) | NVCA | Alignment with charter and D&O policy |
| `nvca-model-legal-opinion` | NVCA Model Legal Opinion | NVCA | This one *is* counsel's document |
| `cooley-nvca-financing-generator` | NVCA Financing Documents Generator | Cooley GO | The negotiation itself |
| `cooley-convertible-note-term-sheet` | Convertible Note Term Sheet | Cooley GO | Note vs SAFE choice; maturity/interest terms |
| `cooley-convertible-note-sg` | Convertible Note + Term Sheet (Singapore) | Cooley GO | Singapore securities formalities |
| `seedlegals-seedfast` | SeedFAST — UK SEIS/EIS ASA | SeedLegals | Platform-generated (not an open download); SEIS/EIS advice |
| `seedlegals-seednote` | SeedNOTE — UK convertible loan note | SeedLegals | Platform-generated; not SEIS/EIS-friendly |
| `bsa-air` | BSA-AIR (France) | Seedsummit (orig. SB Avocats + TheFamily) | French warrant-issuance formalities |
| `100x-isafe` | iSAFE (India) | 100X.VC | CCPS issuance formalities |
| `saft-form` | SAFT form and whitepaper | SAFT Project | Mandatory — contested securities-law territory |
| `cooley-cap-table-pro-forma` | Sample Cap Table (financing pro forma) | Cooley GO | — (modeling aid) |
| `cooley-cap-table-simple` | Sample Cap Table (simple) | Cooley GO | — (record-keeping aid / stock-ledger stand-in) |
| `cooley-accredited-investor-questionnaire` | Accredited Investor Questionnaire | Cooley GO | Exemption strategy (506(b)/506(c), Form D) |
| `cooley-dd-request-list` | Sample VC Due Diligence Request List | Cooley GO | — (data-room checklist) |

## Governance

| id | Document | Publisher | What counsel still does |
| --- | --- | --- | --- |
| `orrick-tech-studio` | Tech Studio forms library (incorporation, financing, equity, consents) | Orrick | Confirm statutory formalities of board action (see `rules/US-DE`); some downloads gated by registration |
| `orrick-incorporation-toolkit` | Incorporation Toolkit — charter, bylaws, board/stockholder consents, founder stock | Orrick | Review before filing; cross-check against the Cooley package |
| `orrick-cap-table-template` | Capitalization Table template | Orrick | Reconcile the ledger with consents and certificates |

## Hiring

| id | Document | Publisher | What counsel still does |
| --- | --- | --- | --- |
| `cooley-offer-letter` | Form of Employee Offer Letter | Cooley GO | State-specific employment law (California especially) |
| `cooley-offer-letter-sg` | Employee Offer Letter (Singapore) | Cooley GO | Singapore Employment Act coverage |
| `cooley-new-employee-package-uk` | Offer Letter + Employment Agreement (UK) | Cooley GO | UK statutory particulars |
| `cooley-ciiaa` | Employee CIIAA / PIIA | Cooley GO | State invention-assignment carve-out notices |
| `cooley-ciiaa-sg` | Employee CIIAA (Singapore) | Cooley GO | Restraint-of-trade enforceability |
| `github-beipa` | Balanced Employee IP Agreement (CC0) | GitHub | Scope choice vs a maximalist CIIAA |
| `cooley-advisor-agreement` | Form of Advisor Agreement | Cooley GO | Board approval + 409A-defensible strike for any equity |
| `cooley-advisor-agreement-sg` | Advisor Agreement (Singapore) | Cooley GO | Singapore corporate approvals |
| `fi-fast-advisor` | FAST advisor agreement + equity matrix | Founder Institute | Board approval; the matrix is convention, not law |
| `cooley-consulting-agreement` | Form of Consulting Agreement | Cooley GO | Worker-classification analysis |
| `cooley-consulting-agreement-sg` | Consulting Agreement (Singapore) | Cooley GO | CPF/classification analysis |
| `cooley-consultancy-agreement-uk` | Consultancy Agreement (UK) | Cooley GO | IR35 / off-payroll analysis |

## Commercial

| id | Document | Publisher | What counsel still does |
| --- | --- | --- | --- |
| `commonpaper-csa` | Cloud Service Agreement (standard) | Common Paper | Cover-page variables for unusual deals |
| `commonpaper-terms-of-service` | Terms of Service (standard) | Common Paper | Consumer-protection overlays per market |
| `commonpaper-sla` | Service Level Agreement (standard) | Common Paper | Uptime/credit variables |
| `commonpaper-psa` | Professional Services Agreement (standard) | Common Paper | Statements of work |
| `commonpaper-design-partner` | Design Partner Agreement (standard) | Common Paper | IP boundaries for early access |
| `commonpaper-pilot` | Pilot Agreement (standard) | Common Paper | Conversion terms to a full CSA |
| `commonpaper-partnership` | Partnership Agreement (standard) | Common Paper | Not an entity formation — commercial only |
| `commonpaper-software-license` | Software License Agreement (standard) | Common Paper | On-prem specifics |
| `commonpaper-mutual-nda` | Mutual NDA (standard) | Common Paper | Usually none — sign as-is |
| `onenda` | oneNDA (open standard NDA) | oneNDA | Usually none — the point is not modifying it |
| `bonterms-cloud-terms` | Bonterms Cloud Terms (CC BY 4.0) | Bonterms | Enterprise-specific attachments |
| `bonterms-mutual-nda` | Bonterms Mutual NDA (CC BY 4.0) | Bonterms | Usually none — sign as-is |
| `bonterms-oneway-nda` | Bonterms One-Way NDA (CC BY 4.0) | Bonterms | Direction-of-disclosure check |
| `bonterms-sla` | Bonterms SLA (CC BY 4.0) | Bonterms | Service-credit calibration |
| `bonterms-psa` | Bonterms Professional Services Agreement (CC BY 4.0) | Bonterms | Statements of work |
| `bonterms-software-license-terms` | Bonterms Software License Terms (CC BY 4.0) | Bonterms | Self-hosted licensing specifics |
| `yc-sales-agreement` | Sales Agreement Template (SaaS) | Y Combinator | Fallback positions for enterprise redlines |
| `cooley-mutual-nda` | Mutual NDA (negotiable form) | Cooley GO | When a counterparty rejects fixed standards |
| `cooley-oneway-nda` | One-Way NDA (US) | Cooley GO | Direction-of-disclosure check |
| `cooley-mutual-nda-uk` | Mutual NDA (UK) | Cooley GO | English-law specifics |
| `cooley-unilateral-nda-uk` | Unilateral NDA (UK) | Cooley GO | English-law specifics |
| `cooley-mutual-nda-sg` | Mutual NDA (Singapore) | Cooley GO | Singapore-law specifics |

## Privacy & data

| id | Document | Publisher | What counsel still does |
| --- | --- | --- | --- |
| `commonpaper-dpa` | Data Processing Agreement (standard) | Common Paper | Verify transfer mechanisms for your data flows |
| `commonpaper-baa` | Business Associate Agreement (standard) | Common Paper | Whether you're a business associate at all |
| `commonpaper-ai-addendum` | AI Addendum (standard) | Common Paper | Training-data and output-rights choices |
| `bonterms-dpa` | Bonterms Data Protection Addendum (CC BY 4.0) | Bonterms | Transfer-mechanism check |
| `bonterms-baa` | Bonterms BAA (CC BY 4.0) | Bonterms | HIPAA applicability |
| `bonterms-ai-addendum` | Bonterms AI Addendum (CC BY 4.0) | Bonterms | AI-feature term choices |
| `onedpa` | oneDPA (open standard DPA) | oneNDA (Claustack) | Annexes must match actual data flows |
| `eu-scc-international-transfers` | EU SCCs for international transfers (2021/914) | European Commission | Transfer impact assessments; module selection |
| `eu-scc-controller-processor` | EU SCC hub incl. Art. 28 controller–processor clauses | European Commission | Art. 28 vs transfer-SCC scoping |
| `uk-idta-addendum` | UK IDTA + UK Addendum to the EU SCCs | ICO | UK transfer risk assessments |

## Open source & IP

| id | Document | Publisher | What counsel still does |
| --- | --- | --- | --- |
| `apache-icla` | Apache Individual CLA | Apache Software Foundation | Adapting the named beneficiary |
| `apache-ccla` | Apache Corporate CLA | Apache Software Foundation | Corporate-contribution policy |
| `harmony-cla-templates` | Harmony CLA/CAA templates | Project Harmony | License-grant option selection |
| `linux-dco` | Developer Certificate of Origin 1.1 | Linux Foundation | DCO-vs-CLA IP strategy |
| `choosealicense` | Choose a License | GitHub | License fit with commercial strategy |
| `osi-approved-licenses` | OSI Approved Licenses list | Open Source Initiative | Honest labeling of source-available terms |
| `spdx-license-list` | SPDX License List | Linux Foundation (SPDX) | Metadata/LICENSE consistency |
| `contributor-covenant` | Contributor Covenant | Organization for Ethical Source | Enforcement process you'll actually run |
| `cc-license-chooser` | Creative Commons licenses + chooser | Creative Commons | Content vs code licensing boundaries |
