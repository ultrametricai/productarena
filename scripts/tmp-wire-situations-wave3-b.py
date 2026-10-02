#!/usr/bin/env python3
"""Situations wave 3, pair B (founder boost 2026-10-02): sit_015 data-subject access request
(the GDPR one-month clock rule-carded against the EUR-Lex primary source — the founder's
explicit ask — plus the CCPA's 45 days cited on the California AG's page) and sit_016
app-store rejection/removal (Apple's and Google's PUBLISHED review/appeal processes, every
URL curl-verified 200 on 2026-10-02). Adds the EU jurisdiction to jurisdictions/registry.json
(rule cards require a registered jurisdiction), the GDPR source + rule card, and the usual
totality data: audit entries, conservative step-story mappings."""
import json
import os


def load(p):
    with open(p) as f:
        return json.load(f)


def dump(p, data):
    with open(p, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')


def edges(n):
    return [{"from": f"n{i}", "to": f"n{i+1}"} for i in range(1, n)]


RECORDS = [
  {
    "id": "sit_015",
    "title": "Answer a data-subject access request",
    "description": "A DSAR is a legal letter wearing an email's clothes. Under GDPR you must respond without undue delay and within ONE MONTH of receipt — extendable by two further months for complex or numerous requests only if you tell the requester within the first month (Art. 12(3), rule card eu.gdpr-dsar-response-deadline, EUR-Lex cited); the CCPA's clock is 45 days, on the California AG's own page. Verify identity proportionately, inventory honestly (product DB, analytics, support desk, email tools, processor), and let counsel check the exemptions before anything ships — a delivered over-disclosure cannot be unsent, which is why that step is the irreversible one. Educational guidance, not legal advice; the controlling clock is the statute's, verified at the primary source.",
    "phase": "compliance",
    "kind": "situation",
    "trigger": "Someone exercises their data rights — a GDPR subject access request or CCPA request to know/delete lands in any inbox.",
    "urgency": "weeks",
    "cadence": "event-driven",
    "geoScope": "global",
    "complexity": "moderate",
    "reversibility": "painful",
    "category": "privacy",
    "supportLevel": "partial",
    "supportReason": "The data inventory and the export assembly are agent work across your own systems; identity verification judgment, the exemptions review, and the decision to send are human — counsel's where it's close.",
    "vendors": [],
    "geoNotes": [
      {"country": "UK", "kind": "analog", "summary": "UK GDPR's subject access request runs on the same one-month clock with the same two-month extension — the ICO's right-of-access guidance is the canonical employer-side playbook, including the identity-check and exemptions reality.", "actionUrl": "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-of-access/", "actionLabel": "ICO: right of access (SARs)"}
    ],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Log the request and start the clock: one month under GDPR Art. 12(3), 45 days under CCPA — the extension needs notice inside month one", "route": "person", "reversibility": "reversible", "riskLevel": "high", "actionUrl": "https://eur-lex.europa.eu/eli/reg/2016/679/oj", "actionLabel": "GDPR (EUR-Lex, Art. 12)", "estimatedMinutes": 20},
        {"id": "n2", "label": "Verify the requester's identity proportionately — enough to stop impersonation, never a data grab of its own", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 30},
        {"id": "n3", "label": "Inventory where this person's data lives: product DB, analytics, support desk, email tools, payment processor", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 60},
        {"id": "n4", "label": "Assemble the export and draft the response: what you hold, purposes, recipients, retention, sources", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 90},
        {"id": "n5", "label": "Review the exemptions with privacy counsel where it's close: third-party data, privilege, trade secrets", "route": "person", "reversibility": "reversible", "riskLevel": "high", "optionsArenaId": "startup-law-firms", "vendorOptions": ["cooley", "orrick", "fenwick", "gunderson_dettmer"], "estimatedMinutes": 60},
        {"id": "n6", "label": "Deliver securely by the deadline and record what was sent (or send the extension notice inside month one)", "route": "form", "reversibility": "irreversible", "riskLevel": "high", "actionUrl": "https://oag.ca.gov/privacy/ccpa", "actionLabel": "California AG: CCPA (45-day clock)", "estimatedMinutes": 30},
        {"id": "n7", "label": "Fix the intake: a records-of-processing map and a standing DSAR runbook so the next one is routine", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 45}
      ],
      "edges": edges(7),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the request itself and the date it was received (the clock runs from receipt)", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "where personal data lives: your systems and processors", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "privacy", "gdpr", "ccpa", "dsar"],
    "activeMinutes": 335, "totalEstimatedMinutes": 335, "hasAsyncSteps": False,
    "annoyance": 3, "risk": 4, "growthImpact": 1,
    "produces": [], "requires": [],
  },
  {
    "id": "sit_016",
    "title": "Recover from an app-store rejection or removal",
    "description": "A rejection names its guideline; a removal names its policy — the recovery starts by reading WHICH one, calmly. Apple's App Review publishes its guidelines and a real appeal path (disagreements go to the App Review Board through the published contact flow); Google Play publishes its removal reasons and appeal process in the Play Console help. The honest fork: fix-and-resubmit beats contesting unless the reviewer is genuinely wrong about your app. If store revenue is material, say something honest to users while the review runs — the review clock is the stores', modeled here as the wait it is.",
    "phase": "product",
    "kind": "situation",
    "trigger": "Your app is rejected in review — or pulled from the App Store or Google Play with a policy notice.",
    "urgency": "days",
    "cadence": "event-driven",
    "geoScope": "global",
    "complexity": "moderate",
    "reversibility": "reversible",
    "category": "mobile",
    "supportLevel": "manual_guide",
    "supportReason": "Review and appeals run inside Apple's and Google's own consoles on their own judgment — an agent can diff your build against the cited guideline and assemble the evidence; the appeal and the resubmission decisions are yours.",
    "vendors": [],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Read the rejection/removal notice: which guideline or policy is cited, and what exactly the reviewer saw", "route": "person", "reversibility": "reversible", "actionUrl": "https://developer.apple.com/app-store/review/guidelines/", "actionLabel": "App Store Review Guidelines", "estimatedMinutes": 30},
        {"id": "n2", "label": "Diff your build and metadata against the cited guideline and assemble the evidence: screens, flows, policy docs", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 60},
        {"id": "n3", "label": "Decide the fork: fix and resubmit, or contest — contest only when the reviewer is genuinely wrong about your app", "route": "person", "reversibility": "reversible", "riskLevel": "medium", "estimatedMinutes": 30},
        {"id": "n4", "label": "Apple path: resubmit the fixed build, or appeal to the App Review Board through the published flow", "route": "form", "reversibility": "reversible", "riskLevel": "high", "actionUrl": "https://developer.apple.com/contact/app-store/?topic=appeal", "actionLabel": "Apple: appeal an App Review decision", "estimatedMinutes": 45},
        {"id": "n5", "label": "Google Play path: follow the published removal/appeal flow in the Play Console help", "route": "form", "reversibility": "reversible", "riskLevel": "high", "actionUrl": "https://support.google.com/googleplay/android-developer/answer/2477981", "actionLabel": "Play Console: app removals & appeals", "estimatedMinutes": 30},
        {"id": "n6", "label": "If store revenue is material, tell users honestly what's happening and what still works", "route": "person", "reversibility": "painful", "estimatedMinutes": 30},
        {"id": "n7", "label": "Wait for the review decision — the clock is the stores'", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 4320}
      ],
      "edges": edges(7),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the rejection/removal notice (guideline or policy cited)", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "how much of your revenue and install base rides the affected store", "tier": "user_input", "required": False}
    ],
    "tags": ["situation", "mobile", "app-store", "rejection", "appeal"],
    "activeMinutes": 225, "totalEstimatedMinutes": 4545, "hasAsyncSteps": True,
    "annoyance": 4, "risk": 3, "growthImpact": 3,
    "produces": [], "requires": [],
  },
]

AUDIT = [
  # sit_015
  ("sit_015", "n1", "person", "The clock runs from receipt wherever the request landed — recognizing an informal email AS a DSAR and logging the date is the step founders miss.", "assist", "An agent can watch intake channels and flag likely requests with the received date; confirming it IS one is a human read."),
  ("sit_015", "n2", "person", "Proportionate identity verification is a judgment: too little enables impersonation, too much is itself a data grab regulators call out.", "assist", "An agent can run the match against existing account signals; deciding what proof to demand is human."),
  ("sit_015", "n5", "person", "Exemptions (third-party data, privilege, trade secrets) are legal judgment with real downside both ways — over-disclosure and under-disclosure both bite.", "assist", "An agent can flag entries that touch third parties or privileged threads; the keep/redact calls are counsel's."),
  ("sit_015", "n6", "form", "The delivery is a legal response on a statutory clock — sent means sent, and the record of what went out is your defense.", "assist", "An agent can package and send through the secure channel once a human approves the final contents."),
  # sit_016
  ("sit_016", "n1", "person", "Which guideline is cited decides everything — a metadata nit and a business-model objection look identical in a rejection email until read carefully.", "assist", "An agent can parse the notice and pull the cited guideline text alongside; the severity read is the founder's."),
  ("sit_016", "n3", "person", "Fix-vs-contest is a judgment about whether the reviewer is wrong or your app is — contesting a correct rejection burns weeks.", "no-screen", "The decision forms over the evidence an agent assembled; there is no screen to drive."),
  ("sit_016", "n4", "form", "Apple's appeal goes through the published App Review contact flow with your reasoning attached — reviewed by their humans on their clock.", "assist", "A browser agent can file the appeal form with the prepared argument; what gets argued is the founder's call."),
  ("sit_016", "n5", "form", "Play's appeal runs through the Console's published flow — policy enforcement decisions are Google's to revisit.", "assist", "A browser agent can drive the Console appeal form; the policy-compliance assertions are human-owned."),
  ("sit_016", "n6", "person", "Users hear a store removal from you before the press or the broken install button — honesty is the retention play.", "no-screen", "Drafting help aside, the telling is human."),
  ("sit_016", "n7", "person", "App review and appeal decisions run on Apple's and Google's clocks — days, with nothing on your side to advance.", "third-party-wait", "Nothing to drive; a status check when the verdict lands is the whole automation."),
]

STORIES = [
  # function mappings
  ("sit_015", "n5", "function", "startup-law-firms", ["gdpr-ccpa-counsel"]),
  # computer-use mappings — x2 per manual (non-agent, non-signature) node; [] = honest none.
  ("sit_015", "n1", "computer-use", "ai-assistants", []),
  ("sit_015", "n1", "computer-use", "browser-agents", []),
  ("sit_015", "n2", "computer-use", "ai-assistants", []),
  ("sit_015", "n2", "computer-use", "browser-agents", []),
  ("sit_015", "n5", "computer-use", "ai-assistants", []),
  ("sit_015", "n5", "computer-use", "browser-agents", []),
  ("sit_015", "n6", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_015", "n6", "computer-use", "browser-agents", ["dom-action-primitives", "file-download-upload"]),
  ("sit_016", "n1", "computer-use", "ai-assistants", []),
  ("sit_016", "n1", "computer-use", "browser-agents", []),
  ("sit_016", "n3", "computer-use", "ai-assistants", []),
  ("sit_016", "n3", "computer-use", "browser-agents", []),
  ("sit_016", "n4", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_016", "n4", "computer-use", "browser-agents", ["dom-action-primitives"]),
  ("sit_016", "n5", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_016", "n5", "computer-use", "browser-agents", ["dom-action-primitives"]),
  ("sit_016", "n6", "computer-use", "ai-assistants", []),
  ("sit_016", "n6", "computer-use", "browser-agents", []),
  ("sit_016", "n7", "computer-use", "ai-assistants", []),
  ("sit_016", "n7", "computer-use", "browser-agents", []),
]

# --- The GDPR deadline, rule-carded against the primary source (founder: "rule-card the
# --- GDPR Art. 12 deadline with the primary source"). Requires the EU jurisdiction entry.
EU_JURISDICTION = {
  "code": "EU",
  "name": "European Union",
  "level": "supranational",
  "scope": "Only the specific sourced GDPR data-subject-rights deadline in listed situations",
  "coverage": "partial-example",
}

GDPR_SOURCE = {
  "id": "eur-lex-gdpr-regulation",
  "publisher": "Publications Office of the European Union (EUR-Lex)",
  "title": "Regulation (EU) 2016/679 (General Data Protection Regulation)",
  "kind": "primary-statute",
  "url": "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
  "locator": "Article 12(3): information provided 'without undue delay and in any event within one month of receipt of the request', extendable 'by two further months where necessary' with notice to the data subject 'within one month of receipt of the request'",
  "issued_on": "2016-04-27",
  "checked_on": "2026-10-02",
  "jurisdiction": "EU",
  "note": "The consolidated official EUR-Lex publication, fetched live 2026-10-02 (the Article 12(3) one-month and two-further-months text verified). Member-state law and EDPB guidance refine the edges; recheck the live text before relying.",
}

GDPR_RULE = {
  "id": "eu.gdpr-dsar-response-deadline",
  "kind": "legal",
  "statement": "A controller must act on a data subject's request and provide information without undue delay and in any event within one month of receipt; the period may be extended by two further months where necessary for complex or numerous requests, provided the data subject is informed of the extension and its reasons within one month of receipt (GDPR Article 12(3)).",
  "source_ids": ["eur-lex-gdpr-regulation"],
  "caveat": "The clock runs from receipt of the request wherever it lands, identity verification can pause but not casually restart it, member-state law and EDPB guidance refine the edges, and manifestly unfounded/excessive requests have their own Article 12(5) regime. This repo does not calculate or extend the deadline.",
  "jurisdiction": "EU",
  "version": "0.1.0",
  "status": "demonstration",
  "reviewed_on": "2026-10-02",
  "review_due": "2027-01-02",
  "reviewer": "Lane editorial review (situations wave 3, 2026-10-02); independent domain expert review pending",
  "valid_from": None,
  "valid_until": None,
}


def main():
    corpus = load('processes/corpus.json')
    have = {t['id'] for t in corpus}
    for rec in RECORDS:
        assert rec['id'] not in have, rec['id']
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

    registry = load('jurisdictions/registry.json')
    assert all(j['code'] != 'EU' for j in registry['jurisdictions'])
    registry['jurisdictions'].append(EU_JURISDICTION)
    registry['updated_on'] = '2026-10-02'
    dump('jurisdictions/registry.json', registry)

    sources = load('sources/registry.json')
    assert all(s['id'] != GDPR_SOURCE['id'] for s in sources['sources'])
    sources['sources'].append(GDPR_SOURCE)
    sources['updated_on'] = '2026-10-02'
    dump('sources/registry.json', sources)

    os.makedirs('rules/EU', exist_ok=True)
    dump('rules/EU/eu-gdpr-dsar-response-deadline.json', GDPR_RULE)
    print('wired sit_015, sit_016 + the EU GDPR rule card')


if __name__ == '__main__':
    main()
