# EMAIL lane research — 2026-09-23 (launch day)

Founder ask: "we have many 'not yet judged' — get them judged, don't leave any out;
sendgrid, virtualpostmail, do an arena for mail."

## Live roster verification (all curl -L, Mozilla UA, before writing a byte)

### transactional-email candidates
| product | site | docs corpus | llms.txt |
|---|---|---|---|
| sendgrid | sendgrid.com 200 (Twilio property) | twilio.com/docs/sendgrid 200, docs.sendgrid.com 200 | sendgrid.com/llms.txt = HTML catch-all (NEGATIVE); twilio.com/llms.txt = real |
| resend | resend.com 200 | resend.com/docs 200 | resend.com/llms.txt REAL ("email API for developers", agent tools section); mcp.resend.com 200 |
| postmark | postmarkapp.com 200 | postmarkapp.com/developer 200 | postmarkapp.com/llms.txt REAL |
| mailgun | mailgun.com 200 | documentation.mailgun.com 200 | documentation.mailgun.com/llms.txt REAL — lists "Mailgun MCP Server" (.md mirror); mailgun.com/llms.txt 404 |
| amazon-ses | aws.amazon.com/ses 200 | docs.aws.amazon.com/ses/latest/dg 200 + APIReference-V2 200 | n/a (AWS) — clean corpus EXISTS |
| loops | loops.so 200 | loops.so/docs 200 | loops.so/llms.txt REAL ("transactional and marketing email from one API") |

loops: check email-marketing roster before rostering — do not duplicate a tracked product.

### virtual-mailboxes candidates
| product | site | dev surface | llms.txt |
|---|---|---|---|
| stable | usestable.com 200 | docs.usestable.com 200 (real API getting-started) | usestable.com/llms.txt REAL |
| earth-class-mail | earthclassmail.com 200 (LegalZoom-owned; clarip/legalzoom scripts in page) | docs/api-docs/developer subdomains all DEAD (000) | llms.txt = HTML catch-all (NEGATIVE) |
| virtualpostmail | virtualpostmail.com 200 | virtualpostmail.com/developers/ 200 | llms.txt 404 (NEGATIVE) |
| anytime-mailbox | anytimemailbox.com 200 | anytimemailbox.com/developer 403; api.anytimemailbox.com 200 | llms.txt 404 (NEGATIVE) |
| ipostal1 | ipostal1.com 403 (bot-walled) — NOT rostered | — | — |

### gmail (into data/email)
developers.google.com/gmail 200, /gmail/api 200. Scoped sub-product precedent:
google-workspace in sso-identity. Scope: Gmail-the-client + Gmail API surface.

## Roster decisions
- email-apis (roadmap's planned "email-apis" flipped live; name "Transactional Email APIs"):
  sendgrid, resend (YC W23), postmark, mailgun (YC W11), amazon-ses. LOOPS NOT ROSTERED —
  already tracked in email-marketing (don't double-count; email-marketing description updated
  to reference the now-live arena).
- virtual-mailboxes: stable (YC W20), virtualpostmail, earth-class-mail (LegalZoom LZ Virtual
  Mail — feature pages 301 to legalzoom.com, recorded as probe), anytime-mailbox.
  ipostal1 EXCLUDED: site bot-walls keyless crawlers (403 site-wide).
- gmail → data/email as scoped Google sub-product (google-workspace precedent), familyId
  google + product-families subProducts entry. Judged on email's existing 54 stories.

## Pipeline log
- crawl: email-apis 5 products (all pages saved, 0 WARN); virtual-mailboxes + email/gmail
  55 pages, 0 WARN. (First crawl attempt caught earth-class-mail businessModel.summary >240
  chars — shortened to 230.)
- extract x2 (union-merge): sendgrid 19, resend 28, postmark 52, mailgun 31, amazon-ses 31
  evidence items; stable 28, virtualpostmail 16, earth-class-mail 14, anytime-mailbox 15;
  gmail 24.
- collect-community: email-apis sendgrid 12 / resend 14 / postmark 5 / mailgun 17 / ses 20
  items (curated seeds all live-verified via Algolia); virtual-mailboxes HONESTLY EMPTY —
  0 items qualified for stable/vpm/anytime, no sources at all for earth-class-mail (HN has
  no >40pt threads on this category); gmail 3 items (first pass returned 0, one retry).
- probe stage: gmail 2 negative probe items (no llms.txt/openapi at vendor origin).
- logos: all saved (sendgrid, earth-class-mail, gmail via Google favicon fallback).

## Judge + spike log
- judge v3: email-apis 260 cells, virtual-mailboxes 200 cells, gmail 54 cells (then full email
  reassembly at 378). Zero JSON aborts. na-harmonize: email 21 flips, email-apis 15, vm 4.
- probes (PA_RECORD, all passing): email-apis 15 (incl. resend mcp.resend.com initialize ->
  oauth-protected-resource challenge, openapi.json, .well-known/mcp.json + agent-skills,
  postmark pricing.txt, mailgun mcp.md mirror, sendgrid llms.txt HTML catch-all as the honest
  negative), virtual-mailboxes 8 (stable llms.txt x2 + .md mirrors; vpm structured JSON 401
  API challenge + llms 404; ECM 301-to-legalzoom recorded; anytime llms 404), gmail 3
  (keyless $discovery/rest machine spec, structured JSON 401, developers.google.com llms 404).
  EXPECTED_TOTAL_PROBES 933 -> 959.
- spikes, sequential per arena at --budget-urls 20:
  email-apis: sendgrid +15 urls (via twilio.com llms.txt) 12 kept/8 rev; resend +19, 12/12;
  postmark +16, 15/11; mailgun +20, 13/7; amazon-ses +20, 14/12.
  virtual-mailboxes: stable +20 urls 14/4; vpm +0 8/6; ecm +0 2/7; anytime +0 2/10.
  email/gmail: +0 urls (no llms.txt) +9 evidence, 7/6.
- churn policy applied by the engine (flips kept only when citing new evidence ids).

## Process wiring
- VENDOR_ARENA += sendgrid->email-apis, gmail->email, stable/earth_class_mail/virtualpostmail
  ->virtual-mailboxes; allowlist sheds sendgrid, stable, earth_class_mail, virtualpostmail.
- growth_005 n1/n2/n4/n5 optionsArenaId=email-apis (+vendorOptions [sendgrid]); qs_044 n1
  optionsArenaId=virtual-mailboxes; 8 gmail nodes drop extraOptionArenas "email" (email is now
  their covering arena via VENDOR_ARENA — extras must never equal covering).
- map-step-stories full rerun: 866 mappings (705 with stories). audit-human-steps: 0 stale.
- map-step-calls: full rerun 257 entries (+37 incl. growth_005 x sendgrid/resend/postmark/
  mailgun and gmail on 9 send steps; 4 honest-empty re-rolls dropped). One persistent LLM
  correction-loop trap on tax_002:n3/agentmail (annotated method + duplicate oscillation, 4
  runs) fixed by strengthening the correction message in map-step-calls.ts (no prompt-version
  change; initial-attempt prompt untouched).
