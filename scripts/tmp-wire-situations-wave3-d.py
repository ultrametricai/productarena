#!/usr/bin/env python3
"""Situations wave 3, pair D (founder boost 2026-10-02): sit_019 key-employee resignation
(distinct from sit_007's co-founder mechanics — notice handling, knowledge transfer, and the
post-termination exercise window with the ISO 3-month rule cited on IRS Topic 427; US-scoped
per the scope-audit test — the exercise-window/at-will machinery is US stock-plan practice —
with the four statutory-notice analogs as country notes) and sit_020 the pulled term sheet
(editorial+sourced as briefed: NVCA model docs for the no-shop reality, YC's published SAFE
documents for the bridge path, runway triage through the judged accounting arena). URLs
curl-verified 200 on 2026-10-02."""
import json


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
    "id": "sit_019",
    "title": "Handle a key employee's resignation",
    "description": "Not the co-founder split (that's its own situation) — the senior engineer or first AE handing in notice. The company-protecting mechanics: take the conversation properly (counter or clean exit, decided honestly), confirm what the offer letter and handbook actually say about notice (US baseline is at-will — the real lever is goodwill and the transition plan), run the equity math, and put the post-termination exercise window IN WRITING to the departing employee — plans commonly give 90 days, and ISOs lose ISO tax treatment if exercised more than 3 months after employment ends (IRS Topic 427 cited); a missed window is the classic post-exit dispute. Then knowledge transfer with named successors, same-day offboarding on the last day, the exit interview that tells you why people actually leave, and the cap-table/rotation updates. Educational guidance, not legal or tax advice.",
    "phase": "hr",
    "kind": "situation",
    "trigger": "A key employee resigns — notice is in hand and the transition clock starts.",
    "urgency": "days",
    "cadence": "event-driven",
    "region": "us",
    "geoScope": "us",
    "complexity": "moderate",
    "reversibility": "painful",
    "category": "hr",
    "supportLevel": "manual_guide",
    "supportReason": "The conversations — resignation, transition, exit interview — are irreducibly human; an agent can run the vesting math, draft the exercise-window notice, and execute the last-day offboarding checklist.",
    "vendors": ["carta"],
    "geoNotes": [
      {"country": "UK", "kind": "analog", "summary": "Notice is statutory and contractual: a week's statutory minimum after a month's service, with contracts usually setting more — ACAS's notice-period guidance is the reference — and EMI options carry their own post-cessation tax rules, so the written-window step matters just as much.", "actionUrl": "https://www.acas.org.uk/notice-periods", "actionLabel": "ACAS: notice periods"},
      {"country": "DE", "kind": "analog", "summary": "Kündigungsfristen are statutory — §622 BGB sets four weeks to the 15th or month-end as the baseline, lengthening with tenure — and termination/resignation requires wet-ink written form (§623 BGB), so the paper is law, not courtesy.", "actionUrl": "https://www.gesetze-im-internet.de/bgb/__622.html", "actionLabel": "BGB §622 — notice periods"},
      {"country": "FR", "kind": "analog", "summary": "The préavis comes from the convention collective more than the Code du travail — check your branch agreement — and the exit paperwork is mandatory: solde de tout compte, certificat de travail, and the attestation France Travail.", "actionUrl": "https://www.service-public.fr/particuliers/vosdroits/F2883", "actionLabel": "service-public — démission"},
      {"country": "IN", "kind": "analog", "summary": "Notice runs off the employment contract and the state's Shops & Establishments Act; the full-and-final settlement timeline and gratuity after five years' service are the statutory tail — the labour ministry is the canonical starting point.", "actionUrl": "https://labour.gov.in/", "actionLabel": "Ministry of Labour & Employment (India)"}
    ],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Take the resignation conversation properly: last day, transition shape, and whether a counter or a clean exit is honest", "route": "person", "reversibility": "reversible", "estimatedMinutes": 60},
        {"id": "n2", "label": "Confirm the notice terms from the offer letter and handbook — at-will is the US baseline, so goodwill and the transition plan are the real levers", "route": "person", "reversibility": "reversible", "estimatedMinutes": 20},
        {"id": "n3", "label": "Run the equity math: vested vs unvested at the last day, and the plan's post-termination exercise window", "route": "agent", "reversibility": "reversible", "vendor": "carta", "optionsArenaId": "equity-management", "vendorOptions": ["carta", "pulley"], "actionUrl": "https://www.irs.gov/taxtopics/tc427", "actionLabel": "IRS Topic 427 (stock options)", "estimatedMinutes": 30},
        {"id": "n4", "label": "Put the exercise window in writing to the departing employee — a missed window (and the ISO 3-month rule) is the classic post-exit dispute", "route": "person", "reversibility": "painful", "riskLevel": "high", "estimatedMinutes": 20},
        {"id": "n5", "label": "Plan the knowledge transfer: owned systems, in-flight work, credentials inventory, named successors", "route": "person", "reversibility": "reversible", "estimatedMinutes": 90},
        {"id": "n6", "label": "Offboard on the last day: access revocation, device return, final pay on the state's required timeline", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 45},
        {"id": "n7", "label": "Run the exit interview — the honest 30 minutes that tells you why people actually leave", "route": "person", "reversibility": "reversible", "estimatedMinutes": 30},
        {"id": "n8", "label": "Update the cap table, the org chart, and the on-call rotations", "route": "agent", "reversibility": "reversible", "vendor": "carta", "estimatedMinutes": 20}
      ],
      "edges": edges(8),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the resignation terms: last day and what was agreed", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "the option grant and plan documents (vesting, post-termination window)", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "hr", "resignation", "offboarding", "equity"],
    "activeMinutes": 315, "totalEstimatedMinutes": 315, "hasAsyncSteps": False,
    "annoyance": 3, "risk": 3, "growthImpact": 1,
    "produces": [], "requires": [],
  },
  {
    "id": "sit_020",
    "title": "Absorb a pulled term sheet",
    "description": "The round you were counting on just evaporated — and the first honest hour is about facts, not feelings. Get the real reason if you can (a diligence finding you can fix is different from partner politics or the market turning); check what you actually signed — term sheets are mostly non-binding EXCEPT exclusivity/no-shop and confidentiality, so note when the no-shop expires before re-opening conversations (the NVCA model documents show the standard shape); re-run the runway math on real numbers; then pick the path: re-open the process wide, bridge with insiders on SAFEs (YC's published documents are the standard), or cut to default-alive. Tell the investors who were waiting the truth — the round changed, the company didn't — and if cash is the issue, start the cost plan now: the weeks of denial are the expensive part. Editorial guidance from the standard documents; nothing here is legal or financial advice.",
    "phase": "fundraising",
    "kind": "situation",
    "trigger": "The lead pulls the term sheet — by call or silence — and the round you planned around is gone.",
    "urgency": "days",
    "cadence": "event-driven",
    "geoScope": "global",
    "complexity": "moderate",
    "reversibility": "reversible",
    "category": "fundraising",
    "supportLevel": "manual_guide",
    "supportReason": "The investor conversations and the path decision are founder work; an agent can re-run the runway scenarios from the books and rebuild the pipeline and data room for the re-opened process.",
    "vendors": [],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Get the real reason if you can — a fixable diligence finding, partner politics, or the market are three different problems", "route": "person", "reversibility": "reversible", "estimatedMinutes": 45},
        {"id": "n2", "label": "Check what you signed: term sheets are mostly non-binding except exclusivity/no-shop and confidentiality — note when the no-shop expires", "route": "person", "reversibility": "reversible", "riskLevel": "medium", "actionUrl": "https://nvca.org/model-legal-documents/", "actionLabel": "NVCA model legal documents", "estimatedMinutes": 30},
        {"id": "n3", "label": "Re-run the runway on real numbers: months left, the cut scenarios, the honest minimum raise", "route": "agent", "reversibility": "reversible", "optionsArenaId": "accounting", "vendorOptions": ["quickbooks", "xero"], "estimatedMinutes": 45},
        {"id": "n4", "label": "Pick the path: re-open the process wide, bridge with insiders on SAFEs, or cut to default-alive", "route": "person", "reversibility": "reversible", "riskLevel": "high", "actionUrl": "https://www.ycombinator.com/documents", "actionLabel": "YC SAFE documents", "estimatedMinutes": 60},
        {"id": "n5", "label": "Tell the other investors who were waiting, honestly — the round changed, the company didn't", "route": "person", "reversibility": "painful", "estimatedMinutes": 45},
        {"id": "n6", "label": "Rebuild the raise machine: refresh the data room, the target list, and the weekly cadence", "route": "agent", "reversibility": "reversible", "optionsArenaId": "equity-management", "vendorOptions": ["carta"], "estimatedMinutes": 60},
        {"id": "n7", "label": "If cash is the issue, start the cost plan now — the weeks of denial are the expensive part", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 60}
      ],
      "edges": edges(7),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the signed term sheet (no-shop/confidentiality terms and dates)", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "current cash, burn, and committed-but-unclosed checks", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "fundraising", "term-sheet", "runway", "bridge"],
    "activeMinutes": 345, "totalEstimatedMinutes": 345, "hasAsyncSteps": False,
    "annoyance": 3, "risk": 4, "growthImpact": 2,
    "produces": [], "requires": [],
  },
]

AUDIT = [
  # sit_019
  ("sit_019", "n1", "person", "Counter-offer or clean exit is a judgment about the person, the team, and the honest future — made in a conversation only the founder can have.", "no-screen", "This is a conversation (often several); an agent can only prepare the facts."),
  ("sit_019", "n2", "person", "What the offer letter and handbook actually promise — notice, PTO payout, references — is a document read with consequences; assuming the baseline is how disputes start.", "assist", "An agent can pull and summarize the signed documents; what the company honors beyond them is a human call."),
  ("sit_019", "n4", "person", "The exercise-window notice is the company's statement of a deadline with tax consequences — it must be right, in writing, and on time.", "assist", "An agent can draft the notice from the plan's terms and the vesting math; the company's humans own sending a correct one."),
  ("sit_019", "n5", "person", "Knowledge transfer is organizational judgment — what this person uniquely holds, and who credibly takes it — mapped with the people involved.", "assist", "An agent can inventory owned repos, docs, and credentials as the starting map; naming successors is the founder's call."),
  ("sit_019", "n7", "person", "Exit interviews only work as candid human conversations — the useful truth arrives off the record.", "no-screen", "Nothing to drive; notes afterward are the only artifact."),
  # sit_020
  ("sit_020", "n1", "person", "The real reason arrives — if at all — in a frank call with the partner; reading which problem you actually have is founder judgment.", "no-screen", "The call is the step; an agent can only note what was said."),
  ("sit_020", "n2", "person", "Which clauses survive the pull (no-shop, confidentiality, expenses) is a legal read of YOUR document — the standard shape helps, the signed text controls.", "assist", "An agent can extract the clauses and their dates from the signed term sheet; the interpretation is counsel's where it matters."),
  ("sit_020", "n4", "person", "Re-open wide, insider bridge, or default-alive is the company-defining judgment — made on the runway math, owned by the founder.", "no-screen", "The decision forms over the scenarios an agent prepared; there is no screen to drive."),
  ("sit_020", "n5", "person", "Other investors hear it from the founder before the rumor mill — candor here is what keeps the re-opened process alive.", "no-screen", "Drafting help aside, the telling is human."),
  ("sit_020", "n7", "person", "A cost plan is people and priorities — the founder decides what the company stops doing.", "assist", "An agent can model the scenarios and flag the biggest levers; the cuts are human decisions."),
]

STORIES = [
  # function mappings
  ("sit_019", "n3", "function", "equity-management", ["custom-vesting-schedules", "cap-table-single-source"]),
  ("sit_019", "n8", "function", "equity-management", ["agent-reconciles-ownership"]),
  ("sit_020", "n3", "function", "accounting", ["full-gl-export-via-api", "complete-audit-trail"]),
  ("sit_020", "n6", "function", "equity-management", ["diligence-data-room", "investor-updates-portal"]),
  # computer-use mappings — x2 per manual (non-agent, non-signature) node; [] = honest none.
  ("sit_019", "n1", "computer-use", "ai-assistants", []),
  ("sit_019", "n1", "computer-use", "browser-agents", []),
  ("sit_019", "n2", "computer-use", "ai-assistants", []),
  ("sit_019", "n2", "computer-use", "browser-agents", []),
  ("sit_019", "n4", "computer-use", "ai-assistants", []),
  ("sit_019", "n4", "computer-use", "browser-agents", []),
  ("sit_019", "n5", "computer-use", "ai-assistants", []),
  ("sit_019", "n5", "computer-use", "browser-agents", []),
  ("sit_019", "n7", "computer-use", "ai-assistants", []),
  ("sit_019", "n7", "computer-use", "browser-agents", []),
  ("sit_020", "n1", "computer-use", "ai-assistants", []),
  ("sit_020", "n1", "computer-use", "browser-agents", []),
  ("sit_020", "n2", "computer-use", "ai-assistants", []),
  ("sit_020", "n2", "computer-use", "browser-agents", []),
  ("sit_020", "n4", "computer-use", "ai-assistants", []),
  ("sit_020", "n4", "computer-use", "browser-agents", []),
  ("sit_020", "n5", "computer-use", "ai-assistants", []),
  ("sit_020", "n5", "computer-use", "browser-agents", []),
  ("sit_020", "n7", "computer-use", "ai-assistants", []),
  ("sit_020", "n7", "computer-use", "browser-agents", []),
]


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
        if rec['geoScope'] != 'global':
            assert sorted(n['country'] for n in rec['geoNotes']) == ['DE', 'FR', 'IN', 'UK'], rec['id']
        corpus.append(rec)
    dump('processes/corpus.json', corpus)

    audit = load('data/human-step-audit.json')
    audit += [dict(zip(('taskId', 'nodeId', 'route', 'why', 'computerUse', 'computerUseWhy'), e)) for e in AUDIT]
    dump('data/human-step-audit.json', audit)

    stories = load('data/process-step-stories.json')
    stories += [dict(zip(('taskId', 'nodeId', 'kind', 'arenaId', 'storyIds'), e)) for e in STORIES]
    dump('data/process-step-stories.json', stories)
    print('wired sit_019, sit_020')


if __name__ == '__main__':
    main()
