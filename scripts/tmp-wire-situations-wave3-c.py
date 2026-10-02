#!/usr/bin/env python3
"""Situations wave 3, pair C (founder boost 2026-10-02): sit_017 ad/platform account
suspension (Google Ads' PUBLISHED suspension/appeal path — the Meta Business Help Center is
deliberately NOT linked: facebook.com/transparency.meta.com answer 400 to live fetches, the
documented bot-wall posture, so Meta's path is named in prose without a fabricated URL) and
sit_018 domain or social account compromised (registrar recovery + the ICANN complaint/RDAP
machinery + the platforms' own published recovery flows; help.x.com bot-walls at 403 so X's
flow is likewise named without a link). Every listed URL curl-verified 200 on 2026-10-02.
Same wiring pattern as the wave 3A/3B scripts."""
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
    "id": "sit_017",
    "title": "Recover a suspended ad or platform account",
    "description": "An ad-account suspension cuts a growth channel overnight — and the appeal that works is the one filed AFTER the violation is actually fixed. Read which policy is cited (Google Ads publishes its suspension reasons and appeal path; Meta's runs through the Business Help Center's account-quality flow), audit what could honestly have tripped it — billing mismatches, landing-page policy, circumventing-systems flags — fix that first, then file ONE complete appeal; five thin ones read as circumvention. While the appeal runs on the platform's clock, shift spend to the channels you still own — the email list first — because concentration was the real lesson. Platform policy enforcement is the platform's judgment; nothing here promises reinstatement.",
    "phase": "growth",
    "kind": "situation",
    "trigger": "Google Ads, Meta, or another ad/platform account is suspended — campaigns stop and a policy email names the violation.",
    "urgency": "days",
    "cadence": "event-driven",
    "geoScope": "global",
    "complexity": "moderate",
    "reversibility": "reversible",
    "category": "marketing",
    "supportLevel": "manual_guide",
    "supportReason": "Policy enforcement and appeals run on the platforms' own judgment and consoles; an agent can audit the likely trigger and keep the owned channels running, but the fix and the appeal are the founder's assertions.",
    "vendors": [],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Read the suspension notice: which policy is cited, and at what level (account, campaign, payment profile)", "route": "person", "reversibility": "reversible", "actionUrl": "https://support.google.com/adspolicy/answer/2375414", "actionLabel": "Google Ads: account suspensions", "estimatedMinutes": 20},
        {"id": "n2", "label": "Audit what could have tripped it: billing mismatches, destination/landing-page policy, circumventing-systems flags", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 60},
        {"id": "n3", "label": "Fix the underlying violation first — appeals filed with the violation still live get denied", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 60},
        {"id": "n4", "label": "File ONE complete appeal through the published flow with the fix documented (Meta's path runs through the Business Help Center's account-quality flow)", "route": "form", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 30},
        {"id": "n5", "label": "Shift spend to the channels still standing while the appeal runs — the email list first; concentration was the real lesson", "route": "person", "reversibility": "reversible", "optionsArenaId": "email-marketing", "vendorOptions": ["mailchimp", "loops", "customer_io"], "estimatedMinutes": 45},
        {"id": "n6", "label": "Wait for the appeal decision — the clock is the platform's", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 10080}
      ],
      "edges": edges(6),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the suspension notice (policy cited, account level)", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "how much acquisition rides the suspended channel", "tier": "user_input", "required": False}
    ],
    "tags": ["situation", "marketing", "ads", "suspension", "appeal"],
    "activeMinutes": 215, "totalEstimatedMinutes": 10295, "hasAsyncSteps": True,
    "annoyance": 4, "risk": 3, "growthImpact": 3,
    "produces": [], "requires": [],
  },
  {
    "id": "sit_018",
    "title": "Recover a hijacked domain or social account",
    "description": "The first hour decides how far it spreads: scope what was actually taken — the registrar account, DNS, email, or the social handle — because changed MX records and DNS are how one stolen login becomes all of them. Lock everything you still hold (passwords, hardware-key 2FA, registrar/transfer lock), then run the owners' processes: the registrar's compromise case — and if the domain was transferred away, ICANN's transfer-dispute and complaint machinery, where the 60-day rules matter — plus the platforms' own published recovery flows (Google's hacked-account flow; Instagram's /hacked; X's equivalent lives behind its help center). Verify the registration state on RDAP rather than guessing. If posts went out or mail was read, tell the people affected before the screenshots do. A domain transferred to another registrar comes back only with pain — that is the honest reversibility here.",
    "phase": "operations",
    "kind": "situation",
    "trigger": "Your domain, DNS, or a company social/email account is taken over — logins fail, records change, or posts you didn't write appear.",
    "urgency": "hours",
    "cadence": "event-driven",
    "geoScope": "global",
    "complexity": "complex",
    "reversibility": "painful",
    "category": "security",
    "supportLevel": "manual_guide",
    "supportReason": "Recovery runs through registrar cases, ICANN processes, and platform flows that verify the human owner; an agent can run the lock-down, the RDAP checks, and the hardening, but the ownership proofs are yours.",
    "vendors": [],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Scope the compromise: registrar account, DNS, email, or the social handle — and whether MX/DNS were changed (that's how everything else falls)", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 30},
        {"id": "n2", "label": "Lock what you still hold: rotate passwords, enforce hardware-key 2FA, check DNS and MX against known-good, enable the registrar/transfer lock", "route": "agent", "reversibility": "reversible", "optionsArenaId": "domain-registrars", "vendorOptions": ["cloudflare_registrar", "namecheap", "porkbun"], "estimatedMinutes": 45},
        {"id": "n3", "label": "Open the registrar's compromise case — and if the domain was transferred away, invoke ICANN's transfer-dispute path (the 60-day rules matter)", "route": "person", "reversibility": "reversible", "riskLevel": "high", "actionUrl": "https://www.icann.org/compliance/complaint", "actionLabel": "ICANN: registrar complaints", "estimatedMinutes": 45},
        {"id": "n4", "label": "Verify the live registration state and transfer timeline on RDAP — facts, not guesses", "route": "agent", "reversibility": "reversible", "actionUrl": "https://lookup.icann.org/", "actionLabel": "ICANN RDAP lookup", "estimatedMinutes": 20},
        {"id": "n5", "label": "Run the platform's own recovery flow for hijacked accounts (Google's hacked-account flow; Instagram's /hacked; X's via its help center)", "route": "form", "reversibility": "reversible", "riskLevel": "medium", "actionUrl": "https://support.google.com/accounts/answer/6294825", "actionLabel": "Google: secure a hacked account", "estimatedMinutes": 45},
        {"id": "n6", "label": "If posts went out from your handle or mail was read, tell the people affected before the screenshots do", "route": "person", "reversibility": "painful", "estimatedMinutes": 30},
        {"id": "n7", "label": "Harden after recovery: registrar lock + hardware keys everywhere + DNS monitoring, documented", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 45},
        {"id": "n8", "label": "Wait out the registrar/platform case queues and re-verify on RDAP when they close", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 10080}
      ],
      "edges": edges(8),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "which accounts/domains are affected and what still logs in", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "registrar, DNS host, and the ownership proofs you hold", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "security", "domain", "account-takeover", "recovery"],
    "activeMinutes": 260, "totalEstimatedMinutes": 10340, "hasAsyncSteps": True,
    "annoyance": 4, "risk": 5, "growthImpact": 1,
    "produces": [], "requires": [],
  },
]

AUDIT = [
  # sit_017
  ("sit_017", "n1", "person", "Which policy is cited and at what level decides the whole recovery — a payment-profile suspension and a circumventing-systems flag are different problems wearing the same subject line.", "assist", "An agent can parse the notice and pull the cited policy text alongside; reading what the platform actually believes happened is human."),
  ("sit_017", "n3", "person", "The fix is a business change — landing pages, billing identity, claims in creatives — decided and made by the founder before any appeal has a chance.", "assist", "An agent can list the violating surfaces against the policy text; changing the business's claims is the founder's act."),
  ("sit_017", "n4", "form", "Appeals are reviewed by platform policy teams against their own enforcement history — one complete, honest appeal beats volume.", "assist", "A browser agent can file the appeal form with the documented fix; what gets asserted is the founder's."),
  ("sit_017", "n5", "person", "Reweighting acquisition is a budget judgment made under uncertainty — which surviving channels get the suspended spend is a founder call.", "assist", "An agent can stand up the email sends and report channel performance; the reallocation is human."),
  ("sit_017", "n6", "person", "Platform appeal queues run on their own clocks — days to weeks, nothing on your side advances them.", "third-party-wait", "Nothing to drive; a status nudge when the verdict lands is the whole automation."),
  # sit_018
  ("sit_018", "n1", "person", "Scoping which account fell first — and whether mail routing changed — is incident triage under pressure; getting it wrong wastes the critical first hour.", "assist", "An agent can diff DNS/MX against known-good and list recent logins; deciding what fell first is the responder's read."),
  ("sit_018", "n3", "person", "Registrar compromise cases and ICANN disputes want the OWNER's evidence — government ID, payment records, registration history — and the 60-day transfer rules reward speed.", "assist", "An agent can assemble the ownership-evidence pack and draft the case; identity proofs are the founder's own."),
  ("sit_018", "n5", "form", "Platform recovery flows deliberately verify the human owner — selfie checks, device history, ID upload — because an attacker could otherwise run them too.", "policy-gate", "The flows exist to distinguish the real owner from the attacker; an agent passing them would defeat their purpose."),
  ("sit_018", "n6", "person", "People who got phished from your handle hear it from you, fast and plainly — the honesty is the damage control.", "no-screen", "Drafting help aside, the telling is human."),
  ("sit_018", "n8", "person", "Registrar cases and platform reviews close on their queues' clocks — the wait is theirs.", "third-party-wait", "Nothing to drive; the RDAP re-check when a case closes is already modeled."),
]

STORIES = [
  # function mappings
  ("sit_017", "n5", "function", "email-marketing", ["create-send-campaign", "agent-drives-campaign"]),
  ("sit_018", "n2", "function", "domain-registrars", ["account-security", "transfer-registry-lock"]),
  # computer-use mappings — x2 per manual (non-agent, non-signature) node; [] = honest none.
  ("sit_017", "n1", "computer-use", "ai-assistants", []),
  ("sit_017", "n1", "computer-use", "browser-agents", []),
  ("sit_017", "n3", "computer-use", "ai-assistants", []),
  ("sit_017", "n3", "computer-use", "browser-agents", []),
  ("sit_017", "n4", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_017", "n4", "computer-use", "browser-agents", ["dom-action-primitives"]),
  ("sit_017", "n5", "computer-use", "ai-assistants", []),
  ("sit_017", "n5", "computer-use", "browser-agents", []),
  ("sit_017", "n6", "computer-use", "ai-assistants", []),
  ("sit_017", "n6", "computer-use", "browser-agents", []),
  ("sit_018", "n1", "computer-use", "ai-assistants", []),
  ("sit_018", "n1", "computer-use", "browser-agents", []),
  ("sit_018", "n3", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_018", "n3", "computer-use", "browser-agents", ["dom-action-primitives", "file-download-upload"]),
  ("sit_018", "n5", "computer-use", "ai-assistants", []),
  ("sit_018", "n5", "computer-use", "browser-agents", []),
  ("sit_018", "n6", "computer-use", "ai-assistants", []),
  ("sit_018", "n6", "computer-use", "browser-agents", []),
  ("sit_018", "n8", "computer-use", "ai-assistants", []),
  ("sit_018", "n8", "computer-use", "browser-agents", []),
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
        corpus.append(rec)
    dump('processes/corpus.json', corpus)

    audit = load('data/human-step-audit.json')
    audit += [dict(zip(('taskId', 'nodeId', 'route', 'why', 'computerUse', 'computerUseWhy'), e)) for e in AUDIT]
    dump('data/human-step-audit.json', audit)

    stories = load('data/process-step-stories.json')
    stories += [dict(zip(('taskId', 'nodeId', 'kind', 'arenaId', 'storyIds'), e)) for e in STORIES]
    dump('data/process-step-stories.json', stories)
    print('wired sit_017, sit_018')


if __name__ == '__main__':
    main()
