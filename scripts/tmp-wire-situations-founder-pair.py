#!/usr/bin/env python3
"""Wire the two founder-example SITUATIONS (founder ask 2026-10-01) into the corpus and its
totality data: sit_001 (cease-and-desist) + sit_002 (delayed US visa), the startup-law-firms
vendor-registry mappings the counsel step routes through, the human-step-audit entries for
every non-agent node, and the conservative computer-use/function step-story mappings.
Same throwaway-wiring pattern as scripts/tmp-wire-fund007-data.py."""
import json

INDENT = 2

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, data):
    # Match each file's committed serialization so the diff stays additive-only:
    # corpus.json escapes non-ASCII (—); the data files and the registry keep raw unicode.
    ascii_out = p.endswith('corpus.json')
    with open(p, 'w') as f:
        json.dump(data, f, indent=INDENT, ensure_ascii=ascii_out)
        f.write('\n')

SIT_001 = {
    "id": "sit_001",
    "title": "Respond to a cease-and-desist",
    "description": "A trademark or IP cease-and-desist letter is a demand, not a court order — but ignored demands are how lawsuits start. Capture the claims and the letter's own stated deadline (there is no statutory response clock — the letter and any lawsuit that follows set it), preserve your evidence before anything changes, and get IP counsel into the assessment before you reply, admit, or sign anything. The response options are honestly three: comply (stop/rebrand), negotiate (coexistence or license), or contest. Educational guidance, not legal advice. Active times are rough founder-hours; the counterparty's reply is an async wait, modeled, never promised.",
    "phase": "legal",
    "kind": "situation",
    "trigger": "A cease-and-desist letter claiming trademark or IP infringement arrives by mail or email.",
    "urgency": "days",
    "cadence": "event-driven",
    "region": "us",
    "geoScope": "us",
    "complexity": "complex",
    "reversibility": "painful",
    "category": "legal",
    "supportLevel": "manual_guide",
    "supportReason": "The exposure assessment, the strategy, and the response letter are counsel-and-founder work — legal judgment, not API calls. An agent can preserve the evidence file and pull the claimed mark's USPTO record; it cannot answer a legal demand for you.",
    "vendors": [],
    "dag": {
        "nodes": [
            {"id": "n1", "label": "Read the letter calmly: who sent it, the exact claims, and its stated response deadline", "route": "person", "reversibility": "reversible", "actionUrl": "https://www.uspto.gov/page/about-trademark-infringement", "actionLabel": "USPTO: about trademark infringement", "estimatedMinutes": 30},
            {"id": "n2", "label": "Preserve the evidence: archive the letter, your first-use dates, sales records, and screenshots", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 25},
            {"id": "n3", "label": "Look up the claimed mark on USPTO TSDR: registration status, goods and services, filing dates", "route": "agent", "reversibility": "reversible", "actionUrl": "https://tsdr.uspto.gov/", "actionLabel": "USPTO TSDR status lookup", "estimatedMinutes": 20},
            {"id": "n4", "label": "Choose counsel for the response (IP/trademark litigation)", "route": "person", "reversibility": "reversible", "optionsArenaId": "startup-law-firms", "vendorOptions": ["cooley", "fenwick", "orrick", "gunderson_dettmer"], "estimatedMinutes": 60},
            {"id": "n5", "label": "Sign the counsel engagement letter", "route": "person", "legalSignature": True, "reversibility": "painful", "estimatedMinutes": 15},
            {"id": "n6", "label": "Assess with counsel: their mark's strength, your actual use, and the options — comply, negotiate, or contest", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 90},
            {"id": "n7", "label": "Draft the response (or the rebrand/coexistence plan counsel recommends)", "route": "person", "reversibility": "reversible", "estimatedMinutes": 120},
            {"id": "n8", "label": "Send the response before the letter's stated deadline", "route": "person", "reversibility": "painful", "riskLevel": "high", "estimatedMinutes": 15},
            {"id": "n9", "label": "Wait for the counterparty's reply and calendar the follow-through", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 10080},
        ],
        "edges": [{"from": f"n{i}", "to": f"n{i+1}"} for i in range(1, 9)],
    },
    "contextNeeded": [
        {"tool": "user_input", "query": "the cease-and-desist letter and its stated deadline", "tier": "user_input", "required": True},
        {"tool": "user_input", "query": "your first-use dates and usage evidence", "tier": "user_input", "required": True},
    ],
    "tags": ["situation", "legal", "trademark", "ip", "cease-and-desist"],
    "activeMinutes": 375,
    "totalEstimatedMinutes": 10455,
    "hasAsyncSteps": True,
    "annoyance": 4,
    "risk": 5,
    "growthImpact": 1,
}

SIT_002 = {
    "id": "sit_002",
    "title": "Unstick a delayed US visa",
    "description": "A stuck visa is a status-and-escalation problem with honest limits. Find WHERE it is stuck — CEAC for the consulate, the USCIS tracker for the petition — and read 221(g) administrative processing for what it is: no fixed clock and no appeal; most cases resolve, some take months. Then work the real levers: a documented expedite request against USCIS's published criteria, Form I-907 premium processing where the petition classification qualifies (it does not speed a consular 221(g)), immigration counsel, and a congressional inquiry with your signed privacy release. Plan B is stated honestly: run the company remotely from your current country while you wait. Educational guidance, not legal advice. CEAC and the USCIS tracker are the real portals — both sit behind bot walls, so the status checks are founder clicks, not API calls.",
    "phase": "hr",
    "kind": "situation",
    "trigger": "Your US visa is stuck — 221(g) administrative processing after the interview, or a petition sitting past posted times — while the company needs you in Silicon Valley.",
    "urgency": "days",
    "cadence": "event-driven",
    "region": "us",
    "geoScope": "us",
    "complexity": "complex",
    "reversibility": "reversible",
    "category": "immigration",
    "supportLevel": "manual_guide",
    "supportReason": "The status portals are captcha-gated government surfaces, the 221(g) response and expedite case are judgment calls made with counsel, and a congressional inquiry moves only on your signed privacy release. An agent can draft the expedite memo from your records; it cannot move a consulate.",
    "vendors": [],
    "dag": {
        "nodes": [
            {"id": "n1", "label": "Check the consular case status on CEAC", "route": "form", "reversibility": "reversible", "actionUrl": "https://ceac.state.gov/CEACStatTracker/Status.aspx", "actionLabel": "CEAC visa status check", "estimatedMinutes": 10},
            {"id": "n2", "label": "Check the petition status on the USCIS case tracker (if a petition underlies your visa)", "route": "form", "reversibility": "reversible", "actionUrl": "https://egov.uscis.gov/casestatus/landing.do", "actionLabel": "USCIS case status", "estimatedMinutes": 10},
            {"id": "n3", "label": "Identify the hold: 221(g) administrative processing vs a petition backlog vs a missing-document request", "route": "person", "reversibility": "reversible", "actionUrl": "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/administrative-processing-information.html", "actionLabel": "State Dept: administrative processing (221(g))", "estimatedMinutes": 30},
            {"id": "n4", "label": "Draft the expedite case against the published USCIS criteria (severe financial loss, emergencies, government interest)", "route": "agent", "reversibility": "reversible", "actionUrl": "https://www.uscis.gov/forms/filing-guidance/how-to-make-an-expedite-request", "actionLabel": "USCIS: how to make an expedite request", "estimatedMinutes": 45},
            {"id": "n5", "label": "File Form I-907 premium processing if your petition classification qualifies (designated I-129/I-140 classes per USCIS)", "route": "form", "reversibility": "reversible", "riskLevel": "medium", "actionUrl": "https://www.uscis.gov/forms/all-forms/how-do-i-request-premium-processing", "actionLabel": "USCIS: premium processing eligibility", "estimatedMinutes": 30},
            {"id": "n6", "label": "Engage immigration counsel on the 221(g) response and the escalation paths", "route": "person", "reversibility": "reversible", "estimatedMinutes": 60},
            {"id": "n7", "label": "Sign the privacy release and open a congressional inquiry through your district office", "route": "person", "legalSignature": True, "reversibility": "reversible", "actionUrl": "https://www.house.gov/representatives/find-your-representative", "actionLabel": "Find your U.S. representative", "estimatedMinutes": 45},
            {"id": "n8", "label": "Set the honest plan B: run the company remotely from your current country until the visa clears", "route": "person", "reversibility": "reversible", "estimatedMinutes": 60},
            {"id": "n9", "label": "Wait for consular or USCIS action, re-checking status weekly", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 20160},
        ],
        "edges": [{"from": f"n{i}", "to": f"n{i+1}"} for i in range(1, 9)],
    },
    "contextNeeded": [
        {"tool": "user_input", "query": "visa class, case number, and interview/filing dates", "tier": "user_input", "required": True},
        {"tool": "user_input", "query": "evidence for an expedite case (financial loss, emergencies)", "tier": "user_input", "required": False},
    ],
    "tags": ["situation", "immigration", "visa", "221g", "uscis"],
    "activeMinutes": 290,
    "totalEstimatedMinutes": 20450,
    "hasAsyncSteps": True,
    "annoyance": 5,
    "risk": 4,
    "growthImpact": 2,
}

AUDIT = [
    # sit_001 — every non-agent node, honest why + conservative computer-use feasibility.
    ("sit_001", "n1", "person", "The letter is addressed to you: what it claims and how hard its stated deadline lands is a founder-and-counsel read, not a parsing task.", "assist", "An agent can OCR the letter, summarize the claims, and extract the stated deadline; deciding how seriously to take it stays with the founder and counsel."),
    ("sit_001", "n4", "person", "Choosing who defends you is a trust, conflicts, and budget decision made in calls — the market row offers the judged firms, the pick is yours.", "assist", "An agent can shortlist IP litigation counsel from the judged startup-law-firms arena; the engagement choice itself is a founder call."),
    ("sit_001", "n5", "person", "The firm requires the client's own signature on the engagement letter — a counterparty-required signature act, the true human floor.", "policy-gate", "Nothing to drive: the signature is the legally meaningful act and it must be the founder's own."),
    ("sit_001", "n6", "person", "Exposure assessment — their mark's strength against your actual use — is privileged legal judgment formed in a counsel conversation.", "no-screen", "The work is a privileged discussion with counsel, not a screen an agent could drive."),
    ("sit_001", "n7", "person", "Every sentence of a C&D response carries a legal position; counsel drafts it or signs off on it before it exists.", "assist", "An agent can assemble the facts, dates, and evidence file for counsel; the legal positions in the letter are counsel's work product."),
    ("sit_001", "n8", "person", "The send is the commitment: a legal response goes out only on explicit founder and counsel sign-off, inside the letter's stated deadline.", "assist", "An agent could dispatch the email or mail run, but the founder and counsel gate the moment of sending — the act, not the mechanics, is the step."),
    ("sit_001", "n9", "person", "The counterparty replies on their own clock; nothing on your side advances it, and the follow-through dates just need calendaring.", "third-party-wait", "Waiting on opposing counsel has no screen to drive; calendar nudges are trivial next to the wait itself."),
    # sit_002
    ("sit_002", "n1", "form", "CEAC is a captcha-gated State Department portal with no public API — the status check is a founder click, not a call.", "assist", "A browser agent can navigate CEAC and read the status page, but the captcha and government terms keep a human in the loop."),
    ("sit_002", "n2", "form", "The USCIS case tracker is a bot-walled government portal with no public status API for applicants — manual lookup by receipt number.", "assist", "A browser agent can drive the tracker form and read the case state; the bot wall and terms keep the check human-supervised."),
    ("sit_002", "n3", "person", "Reading WHERE the case is stuck — a 221(g) slip, a petition backlog, or a missing document — sets every next step, and misreading it wastes weeks.", "assist", "An agent can lay the statuses beside the published definitions; the determination is a judgment the founder or counsel owns."),
    ("sit_002", "n5", "form", "Form I-907 is filed in the USCIS portal with payment and eligibility attestations — manual government form work, only for qualifying petition classes.", "assist", "A browser agent can fill the I-907 flow; eligibility, payment, and the final submit stay human-gated."),
    ("sit_002", "n6", "person", "Immigration counsel engagement is a conversation about case facts, strategy, and risk tolerance — judgment, not form-filling.", "no-screen", "The engagement happens in calls and privileged discussion, not on a drivable screen."),
    ("sit_002", "n7", "person", "Congressional offices act only on the constituent's own signed privacy release — a legally required signature act before any inquiry moves.", "policy-gate", "An agent can prepare the packet, but the release must carry the founder's signature; the law names the human."),
    ("sit_002", "n8", "person", "Deciding to run the company remotely while the visa clears is a founder judgment about operations, hiring, and risk — made with the team, not a tool.", "no-screen", "A plan is thinking and conversation; there is no screen whose driving would constitute the step."),
    ("sit_002", "n9", "person", "Consular administrative processing has no fixed clock and no appeal; the wait belongs to the government.", "third-party-wait", "Nothing to drive — the weekly re-check is the only screen touch, and it is already modeled as its own step."),
]

STORIES = [
    # function mapping: the counsel step's covering arena (startup-law-firms).
    ("sit_001", "n4", "function", "startup-law-firms", ["ip-litigation-strength", "trademark-clearance-registration", "stated-engagement-model"]),
    # computer-use mappings — one per fleet source for every manual (non-agent, non-signature)
    # node; [] is the honest "no judged story covers this" (judgment, meetings, waits).
    ("sit_001", "n1", "computer-use", "ai-assistants", []),
    ("sit_001", "n1", "computer-use", "browser-agents", []),
    ("sit_001", "n4", "computer-use", "ai-assistants", []),
    ("sit_001", "n4", "computer-use", "browser-agents", []),
    ("sit_001", "n6", "computer-use", "ai-assistants", []),
    ("sit_001", "n6", "computer-use", "browser-agents", []),
    ("sit_001", "n7", "computer-use", "ai-assistants", []),
    ("sit_001", "n7", "computer-use", "browser-agents", []),
    ("sit_001", "n8", "computer-use", "ai-assistants", ["computer-use-desktop"]),
    ("sit_001", "n8", "computer-use", "browser-agents", ["dom-action-primitives"]),
    ("sit_001", "n9", "computer-use", "ai-assistants", []),
    ("sit_001", "n9", "computer-use", "browser-agents", []),
    ("sit_002", "n1", "computer-use", "ai-assistants", ["browser-agent"]),
    ("sit_002", "n1", "computer-use", "browser-agents", ["dom-action-primitives", "captcha-handling"]),
    ("sit_002", "n2", "computer-use", "ai-assistants", ["browser-agent"]),
    ("sit_002", "n2", "computer-use", "browser-agents", ["dom-action-primitives", "captcha-handling"]),
    ("sit_002", "n3", "computer-use", "ai-assistants", []),
    ("sit_002", "n3", "computer-use", "browser-agents", []),
    ("sit_002", "n5", "computer-use", "ai-assistants", ["browser-agent"]),
    ("sit_002", "n5", "computer-use", "browser-agents", ["dom-action-primitives", "nl-task-to-completion"]),
    ("sit_002", "n6", "computer-use", "ai-assistants", []),
    ("sit_002", "n6", "computer-use", "browser-agents", []),
    ("sit_002", "n8", "computer-use", "ai-assistants", []),
    ("sit_002", "n8", "computer-use", "browser-agents", []),
    ("sit_002", "n9", "computer-use", "ai-assistants", []),
    ("sit_002", "n9", "computer-use", "browser-agents", []),
]

REGISTRY = {
    # The judged startup-law-firms arena, now routable from corpus counsel steps (founder ask
    # 2026-10-01: C&D counsel engagement routes via existing VENDOR mappings). Signup URLs
    # curl-verified 200 before listing; fenwick.com sits behind a bot wall (403) so it carries
    # an honest note instead of a link.
    "cooley": {"arenaId": "startup-law-firms", "signupUrl": "https://www.cooley.com/"},
    "fenwick": {"arenaId": "startup-law-firms", "note": "fenwick.com is bot-walled (curl 403) — no start-here URL listed rather than an unverified one."},
    "orrick": {"arenaId": "startup-law-firms", "signupUrl": "https://www.orrick.com/"},
    "gunderson_dettmer": {"arenaId": "startup-law-firms", "signupUrl": "https://www.gunder.com/"},
}


def main():
    corpus = load('processes/corpus.json')
    assert all(t['id'] not in ('sit_001', 'sit_002') for t in corpus)
    for rec in (SIT_001, SIT_002):
        nodes = rec['dag']['nodes']
        active = sum(n['estimatedMinutes'] for n in nodes if not n.get('async'))
        total = sum(n['estimatedMinutes'] for n in nodes)
        assert rec['activeMinutes'] == active, (rec['id'], active)
        assert rec['totalEstimatedMinutes'] == total, (rec['id'], total)
    corpus += [SIT_001, SIT_002]
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
    print('wired sit_001 + sit_002')


if __name__ == '__main__':
    main()
