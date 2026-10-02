#!/usr/bin/env python3
"""Wire the curated SITUATIONS set (founder ask 2026-10-01) — the ten records beyond the two
founder examples — into the corpus and its totality data: records, fraud-prevention registry
mappings, human-step-audit entries for every non-agent node, and the conservative
computer-use/function step-story mappings. Same pattern as tmp-wire-situations-founder-pair.py."""
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, data):
    ascii_out = p.endswith('corpus.json')
    with open(p, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=ascii_out)
        f.write('\n')

def edges(n):
    return [{"from": f"n{i}", "to": f"n{i+1}"} for i in range(1, n)]

RECORDS = [
  {
    "id": "sit_003",
    "title": "Respond to a data breach",
    "description": "The first hours are containment and preservation; the first days are counsel and clocks. Every US state has its own breach-notification statute (the NCSL survey is the map), and some clocks run in days — which statutes apply depends on where the affected people live, not where you are. Notifications to regulators and to the people affected cannot be unsent, so scope honestly first, then notify per the controlling statutes with counsel. The geo notes carry the honest non-US analogs: UK GDPR's 72-hour ICO clock, Germany's Art. 33 state authorities, India's six-hour CERT-In directions. Educational guidance, not legal advice — the deadline clocks here are statutes; verify each one against its state's law with counsel.",
    "phase": "compliance",
    "kind": "situation",
    "trigger": "You discover unauthorized access to customer or company data — a breach is live or just happened.",
    "urgency": "hours",
    "cadence": "event-driven",
    "region": "us",
    "geoScope": "us-state",
    "complexity": "very_complex",
    "reversibility": "irreversible",
    "category": "security",
    "supportLevel": "manual_guide",
    "supportReason": "Containment calls, counsel, statute mapping, and the notifications themselves are human judgment with legal weight. An agent can preserve the forensic evidence and assemble the incident timeline; it cannot decide who must be told what, where.",
    "vendors": [],
    "geoNotes": [
      {"country": "UK", "summary": "Under UK GDPR a notifiable personal-data breach must be reported to the ICO without undue delay and within 72 hours of awareness — the ICO's self-assessment and reporting flow is the canonical route.", "actionUrl": "https://ico.org.uk/for-organisations/report-a-breach/", "actionLabel": "ICO: report a breach"},
      {"country": "DE", "summary": "In Germany GDPR Article 33 applies — report to the competent state data-protection authority within 72 hours of awareness; the federal BfDI fronts the supervisory landscape and routes to the Länder authorities.", "actionUrl": "https://www.bfdi.bund.de/EN/Home/home_node.html", "actionLabel": "BfDI (German data-protection authorities)"},
      {"country": "IN", "summary": "India's CERT-In directions require reporting covered cyber incidents within six hours of noticing — far tighter than any US state clock — and the DPDP Act adds personal-data-breach duties toward the Data Protection Board.", "actionUrl": "https://www.cert-in.org.in/", "actionLabel": "CERT-In (India incident reporting)"}
    ],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Contain the breach: revoke compromised credentials, rotate keys, isolate affected systems", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 120},
        {"id": "n2", "label": "Preserve the forensic evidence: logs, disk images, access records — nothing gets wiped", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 60},
        {"id": "n3", "label": "Assemble the incident timeline and scope: what data, whose, how many records", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 90},
        {"id": "n4", "label": "Engage breach counsel (and your cyber-insurance carrier's hotline if you're covered)", "route": "person", "reversibility": "reversible", "optionsArenaId": "startup-law-firms", "vendorOptions": ["cooley", "orrick", "fenwick", "gunderson_dettmer"], "estimatedMinutes": 60},
        {"id": "n5", "label": "Map the notification clocks: every US state where affected residents live has its own breach statute — some clocks run in days", "route": "person", "reversibility": "reversible", "actionUrl": "https://www.ncsl.org/technology-and-communication/security-breach-notification-laws", "actionLabel": "NCSL: state security-breach notification laws", "estimatedMinutes": 90},
        {"id": "n6", "label": "File the regulator notifications the statutes require (state attorneys general — e.g. California's portal)", "route": "form", "reversibility": "irreversible", "riskLevel": "high", "actionUrl": "https://oag.ca.gov/privacy/databreach/reporting", "actionLabel": "California AG: data breach reporting", "estimatedMinutes": 90},
        {"id": "n7", "label": "Notify the affected individuals per the controlling statutes (content requirements differ by state)", "route": "person", "reversibility": "irreversible", "riskLevel": "high", "actionUrl": "https://www.ftc.gov/business-guidance/resources/data-breach-response-guide-business", "actionLabel": "FTC: data breach response guide", "estimatedMinutes": 120},
        {"id": "n8", "label": "Run the post-incident review and the remediation plan", "route": "person", "reversibility": "reversible", "estimatedMinutes": 90}
      ],
      "edges": edges(8),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "what systems and data were touched, and when", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "where your affected users live (states/countries)", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "security", "breach", "notification", "incident"],
    "activeMinutes": 720, "totalEstimatedMinutes": 720, "hasAsyncSteps": False,
    "annoyance": 5, "risk": 5, "growthImpact": 1,
  },
  {
    "id": "sit_004",
    "title": "Answer an IRS or state tax notice",
    "description": "Most tax notices are one specific mismatch with a response window printed on the first page — not an audit. Read the notice code, pull the period's records, recompute what the notice asserts, and respond by ITS deadline: agree and pay, or contest with documentation (the IRS document upload tool covers many notice types). Where the response requires a signed statement it is the founder's signature, sometimes under penalty of perjury. Educational guidance, not legal advice — the deadline is the one printed on your notice; verify it there.",
    "phase": "compliance",
    "kind": "situation",
    "trigger": "An IRS or state tax notice arrives claiming a discrepancy, a balance due, or a missing filing.",
    "urgency": "weeks",
    "cadence": "event-driven",
    "region": "us",
    "geoScope": "us",
    "complexity": "moderate",
    "reversibility": "painful",
    "category": "tax",
    "supportLevel": "manual_guide",
    "supportReason": "An agent can pull the period's books and recompute the asserted mismatch; reading the notice, the CPA judgment call, the signed response, and the IRS's processing clock are human.",
    "vendors": [],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Read the notice: the notice code (CP/LTR), tax period, amount claimed, and its printed response deadline", "route": "person", "reversibility": "reversible", "actionUrl": "https://www.irs.gov/individuals/understanding-your-irs-notice-or-letter", "actionLabel": "IRS: understanding your notice or letter", "estimatedMinutes": 20},
        {"id": "n2", "label": "Pull the period's records from your books: the filed return, payroll filings, ledger detail", "route": "agent", "reversibility": "reversible", "optionsArenaId": "accounting", "vendorOptions": ["quickbooks", "xero"], "estimatedMinutes": 45},
        {"id": "n3", "label": "Recompute what the notice asserts against what you filed — most notices are one specific mismatch", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 60},
        {"id": "n4", "label": "Engage your CPA (or tax counsel if the amount or issue is material)", "route": "person", "reversibility": "reversible", "estimatedMinutes": 45},
        {"id": "n5", "label": "Respond by the notice's deadline: agree and pay, or contest with documentation", "route": "form", "reversibility": "painful", "riskLevel": "high", "actionUrl": "https://www.irs.gov/help/irs-document-upload-tool", "actionLabel": "IRS document upload tool", "estimatedMinutes": 60},
        {"id": "n6", "label": "Sign the response where the notice requires a signed statement (some are made under penalty of perjury)", "route": "person", "legalSignature": True, "reversibility": "painful", "estimatedMinutes": 10},
        {"id": "n7", "label": "If you disagree with the outcome, weigh an appeal with your CPA", "route": "person", "reversibility": "reversible", "actionUrl": "https://www.irs.gov/appeals", "actionLabel": "IRS Independent Office of Appeals", "estimatedMinutes": 30},
        {"id": "n8", "label": "Wait for the IRS or state to process the response", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 43200}
      ],
      "edges": edges(8),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the notice itself (code, period, amount, deadline)", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "tax", "irs", "notice", "compliance"],
    "activeMinutes": 270, "totalEstimatedMinutes": 43470, "hasAsyncSteps": True,
    "annoyance": 4, "risk": 4, "growthImpact": 1,
  },
  {
    "id": "sit_005",
    "title": "Recover from a frozen bank account or bank failure",
    "description": "Whether it's a compliance freeze or your bank on the FDIC failed-bank list, the clock is payroll: the first hours are confirming what happened, sizing exposure against the FDIC insurance limit ($250,000 per depositor, per bank, per ownership category), and getting a second operating account live so the payments that cannot bounce don't. Then the honest fork: a compliance freeze is a KYC/UBO documents conversation with the bank; a failure is an FDIC receivership you track and claim against for uninsured balances. Re-pointing banking rails mid-crisis is undoable only at real cost — that's the painful part, stated.",
    "phase": "finance",
    "kind": "situation",
    "trigger": "Your operating account is frozen by the bank's compliance review — or the bank itself fails.",
    "urgency": "hours",
    "cadence": "event-driven",
    "region": "us",
    "geoScope": "us",
    "complexity": "complex",
    "reversibility": "painful",
    "category": "finance",
    "supportLevel": "manual_guide",
    "supportReason": "Opening the backup account is KYC-gated, the freeze conversation is with the bank's compliance team, and the FDIC claim is theirs to process. An agent can size the insurance exposure from your balances; it cannot unfreeze an account.",
    "vendors": [],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Confirm what happened: a compliance freeze notice from the bank, or the bank on the FDIC failed-bank list", "route": "person", "reversibility": "reversible", "actionUrl": "https://www.fdic.gov/bank-failures/failed-bank-list", "actionLabel": "FDIC failed bank list", "estimatedMinutes": 30},
        {"id": "n2", "label": "Size the exposure: balances against the FDIC insurance limit ($250,000 per depositor, per bank, per ownership category)", "route": "agent", "reversibility": "reversible", "actionUrl": "https://www.fdic.gov/deposit-insurance", "actionLabel": "FDIC deposit insurance", "estimatedMinutes": 20},
        {"id": "n3", "label": "Triage the next payroll run and the payments that cannot bounce", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 45},
        {"id": "n4", "label": "Open a backup operating account at a second bank", "route": "form", "reversibility": "reversible", "optionsArenaId": "startup-banking", "vendorOptions": ["mercury", "brex", "relay"], "estimatedMinutes": 60},
        {"id": "n5", "label": "Re-point the rails: processor payouts in, payroll and vendor payments out", "route": "person", "reversibility": "painful", "riskLevel": "high", "estimatedMinutes": 90},
        {"id": "n6", "label": "If it's a compliance freeze: ask what triggered the review and supply the KYC/UBO documents the bank asks for", "route": "person", "reversibility": "reversible", "estimatedMinutes": 60},
        {"id": "n7", "label": "If the bank failed: track the FDIC receivership and file the claim for uninsured balances", "route": "form", "reversibility": "reversible", "estimatedMinutes": 45},
        {"id": "n8", "label": "Wait for the freeze review or the receivership distributions", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 10080}
      ],
      "edges": edges(8),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "which bank, which accounts, and current balances", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "the next payroll date and critical payment schedule", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "finance", "banking", "fdic", "freeze"],
    "activeMinutes": 350, "totalEstimatedMinutes": 10430, "hasAsyncSteps": True,
    "annoyance": 5, "risk": 5, "growthImpact": 1,
  },
  {
    "id": "sit_006",
    "title": "Contain a chargeback or fraud spike",
    "description": "A dispute spike is a loop you can mostly run through the processor's own APIs: quantify the pattern, tighten the fraud rules, contest the disputes worth contesting (dispute responses are per-network and deadline-bound), and refund clear fraud before it becomes a chargeback — a refund costs less than a lost dispute, and a sent refund is irreversible, so it sits behind an approval gate. The card networks' monitoring programs have thresholds with real consequences; watching them with your processor is the human judgment in the loop.",
    "phase": "finance",
    "kind": "situation",
    "trigger": "Your dispute rate jumps — a chargeback wave or a card-testing/fraud spike is hitting your payments.",
    "urgency": "days",
    "cadence": "event-driven",
    "region": None,
    "geoScope": "global",
    "complexity": "moderate",
    "reversibility": "reversible",
    "category": "payments",
    "supportLevel": "partial",
    "supportReason": "Dispute data, fraud rules, evidence submission, and refunds are real API surfaces on the judged processors — an agent can run most of the loop. Pausing a product surface and the monitoring-program judgment stay human.",
    "vendors": ["stripe"],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Quantify the spike: dispute rate, affected charges, and the common pattern (BIN, geography, velocity)", "route": "agent", "reversibility": "reversible", "vendor": "stripe", "functionCalls": [{"method": "GET /v1/disputes", "type": "rest"}], "actionUrl": "https://docs.stripe.com/disputes", "actionLabel": "Stripe: disputes & fraud", "estimatedMinutes": 45},
        {"id": "n2", "label": "Tighten the fraud rules: raise risk thresholds, require 3DS where it applies", "route": "agent", "reversibility": "reversible", "optionsArenaId": "fraud-prevention", "vendorOptions": ["stripe_radar", "sift"], "estimatedMinutes": 30},
        {"id": "n3", "label": "Pause the leaking surface if the pattern demands it (a SKU, a geo, a payment method)", "route": "person", "reversibility": "reversible", "riskLevel": "medium", "estimatedMinutes": 30},
        {"id": "n4", "label": "Submit evidence on the disputes worth contesting — responses are per-network and deadline-bound", "route": "agent", "reversibility": "reversible", "vendor": "stripe", "functionCalls": [{"method": "POST /v1/disputes/{dispute}", "type": "rest"}], "estimatedMinutes": 90},
        {"id": "n5", "label": "Refund clear fraud before it becomes a chargeback — a refund costs less than a lost dispute", "route": "agent", "reversibility": "irreversible", "approvalRequired": True, "riskLevel": "medium", "vendor": "stripe", "functionCalls": [{"method": "POST /v1/refunds", "type": "rest"}], "estimatedMinutes": 30},
        {"id": "n6", "label": "Watch the card networks' monitoring-program thresholds with your processor", "route": "person", "reversibility": "reversible", "estimatedMinutes": 30},
        {"id": "n7", "label": "Wait for the dispute outcomes and re-read the rate weekly", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 20160}
      ],
      "edges": edges(7),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "processor account access and the dispute window to analyze", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "payments", "chargebacks", "fraud", "disputes"],
    "activeMinutes": 255, "totalEstimatedMinutes": 20415, "hasAsyncSteps": True,
    "annoyance": 4, "risk": 4, "growthImpact": 2,
  },
  {
    "id": "sit_007",
    "title": "Handle a co-founder departure",
    "description": "The mechanics that protect the company are vesting math, a board consent, and a window that lapses: shares vested vs unvested at the departure date, the board accepting the resignation and authorizing the unvested-share repurchase, and the repurchase exercised inside the window your stock agreement sets (often 90 days from termination — read YOUR agreement). Confirm the signed IP assignment is on file, revoke access the same day, update the cap table, and tell the team one honest message. Separation agreements and releases are employment-counsel work. The executed repurchase and the board consent are irreversible — that's why this situation exists. Educational guidance, not legal advice.",
    "phase": "hr",
    "kind": "situation",
    "trigger": "A co-founder is leaving — resignation or a split — and the vesting, IP, and access mechanics start now.",
    "urgency": "days",
    "cadence": "event-driven",
    "region": "us",
    "geoScope": "us",
    "complexity": "complex",
    "reversibility": "irreversible",
    "category": "equity",
    "supportLevel": "manual_guide",
    "supportReason": "The board consent and the repurchase are signature acts with closing windows, and the departure terms are negotiated between people. An agent can run the vesting math, the access revocation, and the cap-table update.",
    "vendors": ["carta"],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Agree the departure date and terms in writing", "route": "person", "reversibility": "painful", "estimatedMinutes": 60},
        {"id": "n2", "label": "Run the vesting math: shares vested vs unvested at the departure date", "route": "agent", "reversibility": "reversible", "optionsArenaId": "equity-management", "vendorOptions": ["carta"], "estimatedMinutes": 30},
        {"id": "n3", "label": "Board consent: accept the resignation, remove officer roles, authorize the unvested-share repurchase", "route": "person", "legalSignature": True, "reversibility": "irreversible", "riskLevel": "high", "estimatedMinutes": 45},
        {"id": "n4", "label": "Exercise the repurchase inside the stock-agreement window (often 90 days from termination — the window lapses)", "route": "person", "reversibility": "irreversible", "riskLevel": "high", "estimatedMinutes": 60},
        {"id": "n5", "label": "Confirm the IP position: the signed PIIA is on file and the departing founder's work is assigned", "route": "person", "reversibility": "reversible", "estimatedMinutes": 45},
        {"id": "n6", "label": "Revoke access the same day: workspace, repos, bank, infra — the offboarding checklist", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 30},
        {"id": "n7", "label": "Update the cap table and the stakeholder records", "route": "agent", "reversibility": "reversible", "vendor": "carta", "estimatedMinutes": 20},
        {"id": "n8", "label": "Tell the team (and investors where material) — one honest message", "route": "person", "reversibility": "painful", "estimatedMinutes": 30}
      ],
      "edges": edges(8),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the stock purchase agreement (vesting schedule, repurchase window)", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "departure date and agreed terms", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "equity", "cofounder", "vesting", "offboarding"],
    "activeMinutes": 320, "totalEstimatedMinutes": 320, "hasAsyncSteps": False,
    "annoyance": 4, "risk": 5, "growthImpact": 1,
  },
  {
    "id": "sit_008",
    "title": "Respond to a lawsuit",
    "description": "Being served starts a real clock: in federal court the answer is due 21 days after service (FRCP 12(a)(1)(A)(i) — rule card us-fed.frcp-answer-deadline); state courts differ and the summons states yours. The first week is mechanics: record exactly how you were served, calendar the deadline, issue the litigation hold (spoliation is sanctionable), notify the insurers who may owe you a defense, and get litigation counsel engaged. The response itself — answer, motion, or negotiate — is counsel's craft, filed under FRCP 11's signature rule. Educational guidance, not legal advice; the deadline math has exceptions (waived service, the United States as a party), so verify with counsel against the rule.",
    "phase": "legal",
    "kind": "situation",
    "trigger": "You've been served — a process server hands you a summons and complaint naming the company.",
    "urgency": "days",
    "cadence": "event-driven",
    "region": "us",
    "geoScope": "us",
    "complexity": "very_complex",
    "reversibility": "painful",
    "category": "legal",
    "supportLevel": "manual_guide",
    "supportReason": "Litigation strategy, the insurer conversations, and the signed, filed pleadings are counsel work under court rules. An agent can stand up the litigation hold across your systems; it cannot answer a complaint.",
    "vendors": [],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Record exactly when and how you were served — the answer clock starts at service", "route": "person", "reversibility": "reversible", "estimatedMinutes": 15},
        {"id": "n2", "label": "Calendar the answer deadline: 21 days in federal court (FRCP 12(a)(1)(A)(i)); state courts differ — the summons states yours", "route": "person", "reversibility": "reversible", "riskLevel": "high", "actionUrl": "https://www.uscourts.gov/rules-policies/current-rules-practice-procedure/federal-rules-civil-procedure", "actionLabel": "Federal Rules of Civil Procedure", "estimatedMinutes": 15},
        {"id": "n3", "label": "Issue the litigation hold: preserve documents, chat, email — spoliation is sanctionable", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 45},
        {"id": "n4", "label": "Notify your insurers — D&O, E&O, or CGL may owe you a defense", "route": "person", "reversibility": "reversible", "estimatedMinutes": 30},
        {"id": "n5", "label": "Choose litigation counsel", "route": "person", "reversibility": "reversible", "optionsArenaId": "startup-law-firms", "vendorOptions": ["cooley", "orrick", "fenwick", "gunderson_dettmer"], "estimatedMinutes": 60},
        {"id": "n6", "label": "Sign the counsel engagement letter", "route": "person", "legalSignature": True, "reversibility": "painful", "estimatedMinutes": 15},
        {"id": "n7", "label": "Decide the response with counsel: answer, motion, or negotiate", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 90},
        {"id": "n8", "label": "Counsel files the response before the deadline (every pleading is signed — FRCP 11)", "route": "person", "reversibility": "painful", "riskLevel": "high", "estimatedMinutes": 60},
        {"id": "n9", "label": "Wait for the next docket event", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 20160}
      ],
      "edges": edges(9),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the summons and complaint, and the date/manner of service", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "your insurance policies (D&O, E&O, CGL)", "tier": "user_input", "required": False}
    ],
    "tags": ["situation", "legal", "lawsuit", "litigation", "service-of-process"],
    "activeMinutes": 330, "totalEstimatedMinutes": 20490, "hasAsyncSteps": True,
    "annoyance": 5, "risk": 5, "growthImpact": 1,
  },
  {
    "id": "sit_009",
    "title": "Respond to a trademark office action",
    "description": "An office action is the USPTO examiner's letter, not a rejection of your company: substantive refusals (likelihood of confusion, descriptiveness) and procedural requirements each need an answer. The clock is three months from the issue date with one three-month paid extension — Madrid Section 66(a) filings get six months and no extension (rule card us-fed.trademark-office-action-response, USPTO guidance cited); miss it and the application abandons. Pull the cited marks on TSDR, decide argue/amend/counsel, and file the signed response in TEAS. Complements 'File trademark' — this is what happens when that filing comes back with questions. Educational guidance, not legal advice.",
    "phase": "legal",
    "kind": "situation",
    "trigger": "The USPTO examiner issues an office action against your trademark application — refusals or requirements with a response clock.",
    "urgency": "weeks",
    "cadence": "event-driven",
    "region": "us",
    "geoScope": "us",
    "complexity": "moderate",
    "reversibility": "painful",
    "category": "legal",
    "supportLevel": "manual_guide",
    "supportReason": "Likelihood-of-confusion arguments are legal craft and the TEAS filing carries the applicant's or attorney's signature. An agent can pull the cited marks' TSDR records; the response is human work.",
    "vendors": [],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Read the office action: substantive refusals (likelihood of confusion, descriptiveness) vs procedural requirements", "route": "person", "reversibility": "reversible", "actionUrl": "https://www.uspto.gov/trademarks/maintain/responding-office-actions", "actionLabel": "USPTO: responding to office actions", "estimatedMinutes": 45},
        {"id": "n2", "label": "Calendar the deadline: 3 months from the issue date, one 3-month paid extension (Madrid §66(a): 6 months, no extension)", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 10},
        {"id": "n3", "label": "Pull the examiner's cited marks on TSDR and check their live status", "route": "agent", "reversibility": "reversible", "actionUrl": "https://tsdr.uspto.gov/", "actionLabel": "USPTO TSDR status lookup", "estimatedMinutes": 45},
        {"id": "n4", "label": "Decide the response: argue, amend the application, or bring in trademark counsel", "route": "person", "reversibility": "reversible", "optionsArenaId": "startup-law-firms", "vendorOptions": ["cooley", "orrick", "fenwick", "gunderson_dettmer"], "estimatedMinutes": 60},
        {"id": "n5", "label": "Draft the response and its evidence", "route": "person", "reversibility": "reversible", "estimatedMinutes": 90},
        {"id": "n6", "label": "Sign and file the response in TEAS before the deadline", "route": "person", "legalSignature": True, "reversibility": "painful", "riskLevel": "medium", "actionUrl": "https://teas.uspto.gov/", "actionLabel": "USPTO TEAS filing portal", "estimatedMinutes": 20},
        {"id": "n7", "label": "Wait for the examiner: approval, a final action, or new issues", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 43200}
      ],
      "edges": edges(7),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the office action (serial number, issue date, refusal grounds)", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "legal", "trademark", "uspto", "office-action"],
    "activeMinutes": 270, "totalEstimatedMinutes": 43470, "hasAsyncSteps": True,
    "annoyance": 3, "risk": 3, "growthImpact": 1,
  },
  {
    "id": "sit_010",
    "title": "Cure a Delaware franchise tax delinquency",
    "description": "The missed March 1 annual report and franchise tax (rule card us-de.franchise-tax-annual-report, 8 Del. C. §§ 502, 504) brings a $200 penalty, 1.5% monthly interest, and 'not in good standing' — which blocks fundraising diligence and good-standing certificates until cured. The cure is mechanical: recompute with the assumed-par-value method before panicking at the authorized-shares bill, file the overdue report, pay online, confirm standing is restored, and fix the calendar so it doesn't recur. Deadline and amounts are the statute's — verify on the state's own pages.",
    "phase": "compliance",
    "kind": "situation",
    "trigger": "A Delaware delinquency notice arrives — the March 1 annual report/franchise tax was missed and good standing is gone or going.",
    "urgency": "weeks",
    "cadence": "event-driven",
    "region": "us",
    "geoScope": "us-state",
    "complexity": "simple",
    "reversibility": "reversible",
    "category": "compliance",
    "supportLevel": "manual_guide",
    "supportReason": "Delaware's filing and payment run through the state's own portal (no public filing API); an agent can recompute the assumed-par-value math and fix the reminder calendar.",
    "vendors": [],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Read the notice: the missed March 1 filing brings a $200 penalty, 1.5%/month interest, and loss of good standing", "route": "person", "reversibility": "reversible", "actionUrl": "https://corp.delaware.gov/frtax/", "actionLabel": "Delaware franchise tax", "estimatedMinutes": 15},
        {"id": "n2", "label": "Recompute the tax with the assumed-par-value method before panicking at the authorized-shares number", "route": "agent", "reversibility": "reversible", "actionUrl": "https://corp.delaware.gov/frtaxcalc/", "actionLabel": "Delaware franchise tax calculator", "estimatedMinutes": 20},
        {"id": "n3", "label": "File the overdue annual report and pay online", "route": "form", "reversibility": "reversible", "riskLevel": "medium", "actionUrl": "https://corp.delaware.gov/paytaxes/", "actionLabel": "Delaware: pay franchise tax", "estimatedMinutes": 30},
        {"id": "n4", "label": "Confirm good standing is restored on the state's entity search", "route": "form", "reversibility": "reversible", "actionUrl": "https://icis.corp.delaware.gov/ecorp2/services/t/getcompanystatus", "actionLabel": "Delaware entity status search", "estimatedMinutes": 10},
        {"id": "n5", "label": "Fix the root cause: calendar March 1 and confirm your registered agent's reminders reach you", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 15}
      ],
      "edges": edges(5),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the delinquency notice and your file number", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "issued and authorized share counts + gross assets (for the recompute)", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "compliance", "delaware", "franchise-tax", "good-standing"],
    "activeMinutes": 90, "totalEstimatedMinutes": 90, "hasAsyncSteps": False,
    "annoyance": 3, "risk": 4, "growthImpact": 1,
  },
  {
    "id": "sit_011",
    "title": "Survive a DDoS attack or major outage",
    "description": "The first minutes decide the day: one incident commander, one channel, then identify what you're actually in — a volumetric L3/4 flood, an L7 application attack, or a self-inflicted outage wearing an attack's clothes. Edge mitigation and WAF rules are genuinely agent-drivable on the judged edge platforms; the honest human work is the judgment call on what to block, the customer communication, and the postmortem (its own process: 'Run an incident postmortem'). Status-page honesty beats silence every time an attack is live.",
    "phase": "product",
    "kind": "situation",
    "trigger": "Traffic spikes take the product down — a DDoS attack is live, or a major outage looks like one.",
    "urgency": "hours",
    "cadence": "event-driven",
    "region": None,
    "geoScope": "global",
    "complexity": "complex",
    "reversibility": "reversible",
    "category": "infrastructure",
    "supportLevel": "partial",
    "supportReason": "Edge mitigation, WAF rules, and status updates are real API surfaces on the judged edge platforms — an agent can drive them. Incident command, the block-what judgment, and customer communication stay human.",
    "vendors": ["cloudflare"],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Declare the incident: one commander, one channel, sev1 rules", "route": "person", "reversibility": "reversible", "estimatedMinutes": 15},
        {"id": "n2", "label": "Identify what you're in: a volumetric L3/4 flood, an L7 application attack, or a self-inflicted outage", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 30},
        {"id": "n3", "label": "Turn on the edge's DDoS mitigation / under-attack mode", "route": "agent", "reversibility": "reversible", "vendor": "cloudflare", "optionsArenaId": "edge-platforms", "vendorOptions": ["cloudflare", "vercel"], "functionCalls": [{"method": "PATCH /zones/{zone_id}/settings/security_level", "type": "rest"}], "actionUrl": "https://www.cloudflare.com/under-attack-hotline/", "actionLabel": "Cloudflare under-attack hotline", "estimatedMinutes": 20},
        {"id": "n4", "label": "Rate-limit and block the attack signatures (WAF rules, geo blocks, bot rules)", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 45},
        {"id": "n5", "label": "Post the status page update — early, honest, updated often", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 15},
        {"id": "n6", "label": "Tell the affected customers: support channels, and the key accounts directly", "route": "person", "reversibility": "reversible", "estimatedMinutes": 45},
        {"id": "n7", "label": "Stand down and run the postmortem (its own process: 'Run an incident postmortem')", "route": "person", "reversibility": "reversible", "estimatedMinutes": 60}
      ],
      "edges": edges(7),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "edge/DNS provider account and current traffic picture", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "infrastructure", "ddos", "outage", "incident"],
    "activeMinutes": 230, "totalEstimatedMinutes": 230, "hasAsyncSteps": False,
    "annoyance": 4, "risk": 4, "growthImpact": 2,
  },
  {
    "id": "sit_012",
    "title": "Migrate off a shutting-down vendor",
    "description": "A vendor sunset is a deadline you didn't choose: the end-of-service date and the (usually shorter) data-export window are in the notice, and the export is the step that cannot wait — do it before the deadline crunch, whatever else slips. Then it's a normal migration run under pressure: choose the replacement from the live market, stand it up, run old and new in parallel through one business cycle, cut over, and only then cancel — getting the data deletion confirmed in writing (that confirmation is the irreversible step, deliberately last).",
    "phase": "operations",
    "kind": "situation",
    "trigger": "A vendor you depend on announces a shutdown or sunsets the product you're built on.",
    "urgency": "weeks",
    "cadence": "event-driven",
    "region": None,
    "geoScope": "global",
    "complexity": "moderate",
    "reversibility": "painful",
    "category": "operations",
    "supportLevel": "partial",
    "supportReason": "Exports, imports, and integration re-pointing are agent-drivable where the APIs exist; the replacement choice, the parallel-run judgment, and the cutover call are the founder's.",
    "vendors": [],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Read the shutdown notice: the end-of-service date, the data-export window, and what your contract promises", "route": "person", "reversibility": "reversible", "estimatedMinutes": 30},
        {"id": "n2", "label": "Export your data now — not in the deadline crunch", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 45},
        {"id": "n3", "label": "Choose the replacement from the live market", "route": "person", "reversibility": "reversible", "estimatedMinutes": 60},
        {"id": "n4", "label": "Migrate: stand up the replacement, import the data, re-point the integrations", "route": "agent", "reversibility": "reversible", "riskLevel": "medium", "estimatedMinutes": 180},
        {"id": "n5", "label": "Run old and new in parallel through one business cycle, then cut over", "route": "person", "reversibility": "painful", "estimatedMinutes": 90},
        {"id": "n6", "label": "Cancel the old contract and get the data deletion confirmed in writing", "route": "form", "reversibility": "irreversible", "riskLevel": "medium", "estimatedMinutes": 30},
        {"id": "n7", "label": "Wait out the parallel-run window", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 10080}
      ],
      "edges": edges(7),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the shutdown notice (dates, export window) and what depends on the vendor", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "operations", "vendor", "migration", "shutdown"],
    "activeMinutes": 435, "totalEstimatedMinutes": 10515, "hasAsyncSteps": True,
    "annoyance": 4, "risk": 3, "growthImpact": 1,
  },
]

AUDIT = [
  # sit_003
  ("sit_003", "n1", "person", "Containment is live operational triage — which credentials to kill and which systems to isolate is an engineering judgment made under fire.", "assist", "An agent can rotate keys and disable accounts on command, but choosing what to cut without breaking the business is the responder's call."),
  ("sit_003", "n4", "person", "Breach counsel engagement puts the investigation under privilege and the insurer on notice — relationship and judgment work, not a form.", "no-screen", "The engagement happens on the phone and in privileged conversation; there is no portal whose driving would be the step."),
  ("sit_003", "n5", "person", "Which breach statutes apply turns on where the affected people live and what was exposed — a legal determination made with counsel against 50+ statutes.", "assist", "An agent can cross-reference the resident states against the NCSL survey; the applicability call and its consequences belong to counsel."),
  ("sit_003", "n6", "form", "Regulator notifications are filed on state portals (e.g. the California AG's form) with legally weighted content — manual filings that cannot be unsent.", "assist", "A browser agent can fill the portal forms from the approved notification text; counsel approves every field before anything is submitted."),
  ("sit_003", "n7", "person", "Notifying affected people is a statutory act with per-state content requirements and permanent consequences — counsel-approved words, human-owned send.", "assist", "An agent can mail-merge and dispatch the approved notice at scale; the content and the decision to send are legal acts owned by humans."),
  ("sit_003", "n8", "person", "The post-incident review assigns causes and remediations across people and systems — a discussion, not a procedure.", "no-screen", "The review is a meeting over the assembled timeline; an agent contributes the timeline, not the reckoning."),
  # sit_004
  ("sit_004", "n1", "person", "The notice's code, period, and printed deadline define the whole response — misreading it is how founders answer the wrong question late.", "assist", "An agent can extract the code and deadline and look up what the notice type means; the founder confirms what is actually being claimed."),
  ("sit_004", "n4", "person", "Whether to concede, contest, or escalate a tax notice is a materiality judgment made with your CPA — advice, not data entry.", "no-screen", "The CPA conversation is the step; there is no screen to drive."),
  ("sit_004", "n5", "form", "The response goes through IRS channels — the document upload tool or mail — with the notice's stub and your documentation; a manual government submission.", "assist", "A browser agent can drive the IRS upload tool with the prepared documents; the founder or CPA gates what is actually asserted."),
  ("sit_004", "n6", "person", "Some notice responses require a signed statement, occasionally under penalty of perjury — the signature is legally the founder's own act.", "policy-gate", "Nothing to automate: the law wants the taxpayer's signature, not a faster pen."),
  ("sit_004", "n7", "person", "Appealing is a cost-benefit judgment on the merits, made with the CPA against the IRS's stated position.", "no-screen", "The weighing happens in conversation; the Appeals request itself only exists after the decision."),
  ("sit_004", "n8", "person", "IRS and state processing runs on the agency's clock — weeks to months with nothing for you to advance.", "third-party-wait", "There is no screen to drive while the agency processes; a calendar nudge to re-check is the whole automation."),
  # sit_005
  ("sit_005", "n1", "person", "Whether this is a compliance freeze or a bank failure decides everything downstream — read the notice, check the FDIC list, call the bank.", "assist", "An agent can check the FDIC failed-bank list and summarize the freeze notice; confirming with the bank is a human call."),
  ("sit_005", "n3", "person", "Deciding which payments can slip and which cannot (payroll never) is a cash-priority judgment only the founder can own.", "no-screen", "The triage is a decision over a payment list an agent can prepare; the choosing is the step."),
  ("sit_005", "n4", "form", "Opening a business bank account is KYC/identity-gated by design — beneficial-owner verification wants the humans.", "policy-gate", "Bank onboarding deliberately verifies the human applicants; an agent pre-filling forms does not change who must pass KYC."),
  ("sit_005", "n5", "person", "Re-pointing payout and payment rails touches payroll providers, processors, and vendors at once — sequencing it wrong bounces real payments.", "assist", "An agent can update payout destinations in dashboards one by one, but the cutover order and timing are the founder's risk call."),
  ("sit_005", "n6", "person", "A compliance freeze lifts on the bank's questions being answered — document requests and explanations negotiated with their team.", "assist", "An agent can assemble the KYC/UBO document pack; the conversation with the bank's compliance team is human."),
  ("sit_005", "n7", "form", "FDIC receivership claims run on the FDIC's own claims process — forms and deadlines on their portal.", "assist", "A browser agent can file the claim form from your records; the receivership itself moves on the FDIC's clock."),
  ("sit_005", "n8", "person", "Freeze reviews and receivership distributions happen on the bank's or FDIC's schedule — a wait, honestly modeled.", "third-party-wait", "Nothing to drive; the step ends when the bank or the receiver acts."),
  # sit_006
  ("sit_006", "n3", "person", "Pausing a SKU, geo, or payment method trades fraud losses against real revenue — a product call, not a rule change.", "no-screen", "The pause itself is a toggle an agent could flip; the decision to take revenue offline is the step, and it is human."),
  ("sit_006", "n6", "person", "The card networks' monitoring programs (thresholds, fines, exit paths) are navigated with your processor's risk team — judgment and relationship.", "assist", "An agent can chart your dispute rate against the published thresholds; the processor conversation is human."),
  ("sit_006", "n7", "person", "Dispute outcomes arrive on the networks' timelines — weeks out, nothing on your side advances them.", "third-party-wait", "The wait belongs to the card networks; re-reading the rate weekly is the only screen touch."),
  # sit_007
  ("sit_007", "n1", "person", "Departure terms are negotiated between the people leaving and staying — timing, title, narrative, and sometimes consideration.", "no-screen", "This is a conversation (often several); an agent can only take notes."),
  ("sit_007", "n3", "person", "Board consents are signature acts — directors accepting the resignation and authorizing the repurchase are legally required human approvals.", "policy-gate", "The consent exists only as the directors' signatures; e-signature tooling moves the paper, not the authority."),
  ("sit_007", "n4", "person", "Exercising the repurchase is a deliberate corporate act with payment inside a lapsing contractual window — missed means the equity stays out.", "assist", "An agent can calendar the window and prepare the notice and payment; the exercise decision and signature are the company's human act."),
  ("sit_007", "n5", "person", "Confirming the IP chain — the signed PIIA and what it actually covers — is document review with legal consequence, usually with counsel.", "assist", "An agent can locate the signed agreements and surface their assignment clauses; the sufficiency call is counsel's."),
  ("sit_007", "n8", "person", "The team and investors hear this from a founder, in the founder's words — trust is the medium.", "no-screen", "Drafting help aside, the telling is human; there is no screen between a founder and the team here."),
  # sit_008
  ("sit_008", "n1", "person", "How and when you were served fixes the deadline math and possible service defenses — a fact only the person served can attest.", "no-screen", "The record is the founder's own recollection and the papers in hand; nothing to drive."),
  ("sit_008", "n2", "person", "The answer deadline is jurisdiction-specific law (21 days federal, states differ) — calendaring it wrong defaults the case.", "assist", "An agent can compute the nominal date from the rule and set the reminders; counsel confirms the controlling deadline."),
  ("sit_008", "n4", "person", "Insurance tenders are notice-sensitive (late notice can forfeit coverage) and policy language is argued — broker and counsel territory.", "assist", "An agent can pull the policies and draft the tender letters; whether and how to tender is decided with the broker and counsel."),
  ("sit_008", "n5", "person", "Choosing litigation counsel is fit, conflicts, and budget — decided in calls after the market row surfaces the judged firms.", "assist", "An agent can shortlist from the judged startup-law-firms arena; the engagement choice is the founder's."),
  ("sit_008", "n6", "person", "The firm requires the client's own signature on the engagement letter — a counterparty-required signature act.", "policy-gate", "The signature is the legally meaningful act and it must be the founder's own."),
  ("sit_008", "n7", "person", "Answer, Rule 12 motion, or settle is litigation strategy — privileged counsel judgment over the complaint's merits.", "no-screen", "Strategy forms in privileged discussion; an agent summarizing the complaint doesn't make the call."),
  ("sit_008", "n8", "person", "Pleadings are counsel's work product, signed under FRCP 11 and filed on the court's systems by admitted attorneys.", "policy-gate", "Court filing systems and Rule 11 signatures belong to admitted counsel; this step is theirs by law."),
  ("sit_008", "n9", "person", "The docket moves on the court's and opposing counsel's schedule — a wait with hearings at the end of it.", "third-party-wait", "Nothing to drive between docket events; counsel's calendar watches it."),
  # sit_009
  ("sit_009", "n1", "person", "Telling substantive refusals from procedural requirements decides whether this is an argument or a checkbox — a legal read.", "assist", "An agent can parse the office action and label the grounds cited; the severity read is the applicant's or counsel's."),
  ("sit_009", "n2", "person", "The three-month clock (extendable once) runs from the issue date and abandonment is the penalty — the calendaring must be right.", "assist", "An agent can compute the nominal dates and set reminders; the controlling deadline is confirmed against the office action itself."),
  ("sit_009", "n4", "person", "Argue, amend, or lawyer-up is a strategy call weighing the mark's value against the refusal's strength.", "assist", "An agent can assemble the cited-mark evidence either way; the strategy is human."),
  ("sit_009", "n5", "person", "Response arguments — likelihood of confusion, acquired distinctiveness — are legal craft, drafted by the applicant or counsel.", "assist", "An agent can organize evidence and precedent for the draft; the arguments are human (usually counsel) work."),
  ("sit_009", "n6", "person", "TEAS filings carry the applicant's or attorney's signature under USPTO rules — the signature act is legally human.", "policy-gate", "An agent can stage the TEAS form, but the signature the USPTO requires is a human's."),
  ("sit_009", "n7", "person", "The examiner answers on the USPTO's clock — months out, with approval, a final action, or new issues at the end.", "third-party-wait", "Nothing to drive while the examiner works; TSDR shows the state when it changes."),
  # sit_010
  ("sit_010", "n1", "person", "The notice states what was missed and what it now costs — a short read with a real decision (cure now vs compounding interest).", "assist", "An agent can summarize the notice and the statute's penalty math; the founder decides when to pay."),
  ("sit_010", "n3", "form", "Delaware's annual report + franchise tax filing runs through the state's own portal — no public filing API exists.", "drivable", "The portal is a straightforward web flow a browser agent can drive end to end; payment approval stays with the founder."),
  ("sit_010", "n4", "form", "Good-standing confirmation is a lookup on the state's entity search — manual portal work, seconds of it.", "drivable", "The entity-status search is a public form a browser agent can drive and read back."),
  # sit_011
  ("sit_011", "n1", "person", "Declaring sev1 and naming one commander is the incident discipline that makes everything else work — an organizational act.", "no-screen", "The declaration is a human call in the team channel; tooling can page, not decide."),
  ("sit_011", "n2", "person", "L3/4 flood vs L7 attack vs your own bad deploy have different fixes — misdiagnosis burns the first hour.", "assist", "An agent can lay out traffic graphs and error signatures side by side; the diagnosis under pressure is the responder's."),
  ("sit_011", "n6", "person", "Customers and key accounts hear it from people — support macros help, the account calls don't automate.", "assist", "An agent can draft the updates and queue the support replies; the key-account conversations are human."),
  ("sit_011", "n7", "person", "The postmortem assigns causes and actions blamelessly — a discussion with the humans who were there.", "no-screen", "The meeting is the step; the timeline an agent assembles is its input, not its substitute."),
  # sit_012
  ("sit_012", "n1", "person", "The notice's dates and your contract's export/deletion promises define the whole runway — read both before planning.", "assist", "An agent can extract the dates and the contract clauses; what the business actually depends on is the founder's knowledge."),
  ("sit_012", "n3", "person", "Choosing the replacement is a requirements-vs-market judgment — the live arenas rank the candidates, the pick is yours.", "assist", "An agent can shortlist against your requirements from the judged arenas; the commitment is the founder's."),
  ("sit_012", "n5", "person", "The parallel run and the cutover call are operational judgment — when the new system has earned production trust.", "assist", "An agent can diff outputs between old and new through the cycle; calling the cutover is human."),
  ("sit_012", "n6", "form", "Cancellation and written deletion confirmation run through the vendor's account portal and support — manual, and the confirmation matters legally.", "assist", "A browser agent can drive the cancellation flow; the deletion confirmation is chased with the vendor's humans."),
  ("sit_012", "n7", "person", "The parallel-run window is deliberate waiting — one business cycle of evidence before the cutover.", "third-party-wait", "The time itself is the step; monitoring diffs during it is already modeled in the migration."),
]

STORIES = [
  # function mappings (covering arena per node)
  ("sit_003", "n4", "function", "startup-law-firms", ["breach-response-counsel", "gdpr-ccpa-counsel"]),
  ("sit_004", "n2", "function", "accounting", ["full-gl-export-via-api", "complete-audit-trail"]),
  ("sit_005", "n4", "function", "startup-banking", ["fast-onboarding-switch", "application-status-tracking"]),
  ("sit_006", "n1", "function", "payments", []),
  ("sit_006", "n2", "function", "fraud-prevention", ["agent-drives-rules", "score-thresholds-actions", "custom-rules-authoring"]),
  ("sit_006", "n4", "function", "payments", ["respond-to-disputes-evidence", "agent-handles-dispute-end-to-end"]),
  ("sit_006", "n5", "function", "payments", ["refunds-full-partial"]),
  ("sit_007", "n2", "function", "equity-management", ["custom-vesting-schedules", "cap-table-single-source"]),
  ("sit_007", "n7", "function", "equity-management", ["agent-reconciles-ownership"]),
  ("sit_008", "n5", "function", "startup-law-firms", ["stated-engagement-model"]),
  ("sit_009", "n4", "function", "startup-law-firms", ["trademark-clearance-registration"]),
  ("sit_011", "n3", "function", "edge-platforms", ["default-ddos-waf", "invisible-bot-protection"]),
  # computer-use mappings — x2 per manual (non-agent, non-signature) node; [] = honest none.
  ("sit_003", "n1", "computer-use", "ai-assistants", []),
  ("sit_003", "n1", "computer-use", "browser-agents", []),
  ("sit_003", "n4", "computer-use", "ai-assistants", []),
  ("sit_003", "n4", "computer-use", "browser-agents", []),
  ("sit_003", "n5", "computer-use", "ai-assistants", []),
  ("sit_003", "n5", "computer-use", "browser-agents", []),
  ("sit_003", "n6", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_003", "n6", "computer-use", "browser-agents", ["dom-action-primitives", "nl-task-to-completion"]),
  ("sit_003", "n7", "computer-use", "ai-assistants", []),
  ("sit_003", "n7", "computer-use", "browser-agents", []),
  ("sit_003", "n8", "computer-use", "ai-assistants", []),
  ("sit_003", "n8", "computer-use", "browser-agents", []),
  ("sit_004", "n1", "computer-use", "ai-assistants", []),
  ("sit_004", "n1", "computer-use", "browser-agents", []),
  ("sit_004", "n4", "computer-use", "ai-assistants", []),
  ("sit_004", "n4", "computer-use", "browser-agents", []),
  ("sit_004", "n5", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_004", "n5", "computer-use", "browser-agents", ["dom-action-primitives", "file-download-upload"]),
  ("sit_004", "n7", "computer-use", "ai-assistants", []),
  ("sit_004", "n7", "computer-use", "browser-agents", []),
  ("sit_004", "n8", "computer-use", "ai-assistants", []),
  ("sit_004", "n8", "computer-use", "browser-agents", []),
  ("sit_005", "n1", "computer-use", "ai-assistants", []),
  ("sit_005", "n1", "computer-use", "browser-agents", []),
  ("sit_005", "n3", "computer-use", "ai-assistants", []),
  ("sit_005", "n3", "computer-use", "browser-agents", []),
  ("sit_005", "n4", "computer-use", "ai-assistants", []),
  ("sit_005", "n4", "computer-use", "browser-agents", []),
  ("sit_005", "n5", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_005", "n5", "computer-use", "browser-agents", ["dom-action-primitives"]),
  ("sit_005", "n6", "computer-use", "ai-assistants", []),
  ("sit_005", "n6", "computer-use", "browser-agents", []),
  ("sit_005", "n7", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_005", "n7", "computer-use", "browser-agents", ["dom-action-primitives"]),
  ("sit_005", "n8", "computer-use", "ai-assistants", []),
  ("sit_005", "n8", "computer-use", "browser-agents", []),
  ("sit_006", "n3", "computer-use", "ai-assistants", []),
  ("sit_006", "n3", "computer-use", "browser-agents", []),
  ("sit_006", "n6", "computer-use", "ai-assistants", []),
  ("sit_006", "n6", "computer-use", "browser-agents", []),
  ("sit_006", "n7", "computer-use", "ai-assistants", []),
  ("sit_006", "n7", "computer-use", "browser-agents", []),
  ("sit_007", "n1", "computer-use", "ai-assistants", []),
  ("sit_007", "n1", "computer-use", "browser-agents", []),
  ("sit_007", "n4", "computer-use", "ai-assistants", []),
  ("sit_007", "n4", "computer-use", "browser-agents", []),
  ("sit_007", "n5", "computer-use", "ai-assistants", []),
  ("sit_007", "n5", "computer-use", "browser-agents", []),
  ("sit_007", "n8", "computer-use", "ai-assistants", []),
  ("sit_007", "n8", "computer-use", "browser-agents", []),
  ("sit_008", "n1", "computer-use", "ai-assistants", []),
  ("sit_008", "n1", "computer-use", "browser-agents", []),
  ("sit_008", "n2", "computer-use", "ai-assistants", ["computer-use-desktop"]),
  ("sit_008", "n2", "computer-use", "browser-agents", []),
  ("sit_008", "n4", "computer-use", "ai-assistants", []),
  ("sit_008", "n4", "computer-use", "browser-agents", []),
  ("sit_008", "n5", "computer-use", "ai-assistants", []),
  ("sit_008", "n5", "computer-use", "browser-agents", []),
  ("sit_008", "n7", "computer-use", "ai-assistants", []),
  ("sit_008", "n7", "computer-use", "browser-agents", []),
  ("sit_008", "n8", "computer-use", "ai-assistants", []),
  ("sit_008", "n8", "computer-use", "browser-agents", []),
  ("sit_008", "n9", "computer-use", "ai-assistants", []),
  ("sit_008", "n9", "computer-use", "browser-agents", []),
  ("sit_009", "n1", "computer-use", "ai-assistants", []),
  ("sit_009", "n1", "computer-use", "browser-agents", []),
  ("sit_009", "n2", "computer-use", "ai-assistants", ["computer-use-desktop"]),
  ("sit_009", "n2", "computer-use", "browser-agents", []),
  ("sit_009", "n4", "computer-use", "ai-assistants", []),
  ("sit_009", "n4", "computer-use", "browser-agents", []),
  ("sit_009", "n5", "computer-use", "ai-assistants", []),
  ("sit_009", "n5", "computer-use", "browser-agents", []),
  ("sit_009", "n7", "computer-use", "ai-assistants", []),
  ("sit_009", "n7", "computer-use", "browser-agents", []),
  ("sit_010", "n1", "computer-use", "ai-assistants", []),
  ("sit_010", "n1", "computer-use", "browser-agents", []),
  ("sit_010", "n3", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_010", "n3", "computer-use", "browser-agents", ["dom-action-primitives", "nl-task-to-completion"]),
  ("sit_010", "n4", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_010", "n4", "computer-use", "browser-agents", ["dom-action-primitives"]),
  ("sit_011", "n1", "computer-use", "ai-assistants", []),
  ("sit_011", "n1", "computer-use", "browser-agents", []),
  ("sit_011", "n2", "computer-use", "ai-assistants", []),
  ("sit_011", "n2", "computer-use", "browser-agents", []),
  ("sit_011", "n6", "computer-use", "ai-assistants", []),
  ("sit_011", "n6", "computer-use", "browser-agents", []),
  ("sit_011", "n7", "computer-use", "ai-assistants", []),
  ("sit_011", "n7", "computer-use", "browser-agents", []),
  ("sit_012", "n1", "computer-use", "ai-assistants", []),
  ("sit_012", "n1", "computer-use", "browser-agents", []),
  ("sit_012", "n3", "computer-use", "ai-assistants", []),
  ("sit_012", "n3", "computer-use", "browser-agents", []),
  ("sit_012", "n5", "computer-use", "ai-assistants", []),
  ("sit_012", "n5", "computer-use", "browser-agents", []),
  ("sit_012", "n6", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_012", "n6", "computer-use", "browser-agents", ["dom-action-primitives"]),
  ("sit_012", "n7", "computer-use", "ai-assistants", []),
  ("sit_012", "n7", "computer-use", "browser-agents", []),
]

REGISTRY = {
  # Fraud-prevention market the chargeback situation's rules step derives from; URLs
  # curl-verified 200 (stripe.com/radar, sift.com).
  "stripe_radar": {"label": "Stripe Radar", "arenaId": "fraud-prevention", "signupUrl": "https://stripe.com/radar"},
  "sift": {"arenaId": "fraud-prevention", "signupUrl": "https://sift.com/"},
}


def main():
    corpus = load('processes/corpus.json')
    have = {t['id'] for t in corpus}
    for rec in RECORDS:
        assert rec['id'] not in have, rec['id']
        if rec.get('region') is None:
            rec.pop('region', None)
        nodes = rec['dag']['nodes']
        active = sum(n['estimatedMinutes'] for n in nodes if not n.get('async'))
        total = sum(n['estimatedMinutes'] for n in nodes)
        assert rec['activeMinutes'] == active, (rec['id'], rec['activeMinutes'], active)
        assert rec['totalEstimatedMinutes'] == total, (rec['id'], rec['totalEstimatedMinutes'], total)
        assert rec['hasAsyncSteps'] == any(n.get('async') for n in nodes), rec['id']
        corpus.append(rec)
    dump('processes/corpus.json', corpus)

    audit = load('data/human-step-audit.json')
    audit += [dict(zip(('taskId', 'nodeId', 'route', 'why', 'computerUse', 'computerUseWhy'), e)) for e in AUDIT]
    dump('data/human-step-audit.json', audit)

    stories = load('data/process-step-stories.json')
    stories += [dict(zip(('taskId', 'nodeId', 'kind', 'arenaId', 'storyIds'), e)) for e in STORIES]
    dump('data/process-step-stories.json', stories)

    reg = load('processes/vendor-registry.json')
    for k, v in REGISTRY.items():
        assert k not in reg['vendors'], k
        reg['vendors'][k] = v
    reg['vendors'] = dict(sorted(reg['vendors'].items()))
    dump('processes/vendor-registry.json', reg)
    print('wired sit_003..sit_012')


if __name__ == '__main__':
    main()
