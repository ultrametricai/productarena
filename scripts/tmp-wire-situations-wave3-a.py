#!/usr/bin/env python3
"""Situations wave 3, pair A (founder boost 2026-10-02, '~8-10 new situations at the
established depth bar'): sit_013 payment-processor account termination (the famous
Stripe-shutdown pain — appeal path, reserve/payout realities, backup-processor migration;
docs.stripe.com + the public services agreement cited, every URL curl-verified 200
2026-10-02) and sit_014 security-vulnerability report received (CISA CVD pattern +
security.txt; ISO 29147 dropped from the cites — iso.org bot-walls at 403, nothing
unverifiable is listed). Same wiring pattern as tmp-wire-situations-set.py: records,
human-step-audit entries for every non-agent node, conservative function/computer-use
step-story mappings."""
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
    "id": "sit_013",
    "title": "Recover from a payment-processor account termination",
    "description": "The famous overnight email: your processor is terminating the account. The first read is the notice itself — the stated reason, the final processing date, and the reserve terms (processors commonly hold funds against future disputes for a stated period after termination; Stripe's services agreement is public and states its reserve mechanics — read YOURS). Then three tracks at once: export every record while API access lasts, appeal through the processor's own review channel with real evidence, and start underwriting at a backup processor immediately — onboarding is days, and PAN-level card-data migration between PCI-compliant processors is a real, supported path, not a workaround. Tell customers honestly if payouts or renewals will wobble. The reserve clock is the processor's, modeled here as the wait it is.",
    "phase": "finance",
    "kind": "situation",
    "trigger": "Your payment processor emails that your account is terminated or restricted — payouts pause and a final processing date is set.",
    "urgency": "days",
    "cadence": "event-driven",
    "geoScope": "global",
    "complexity": "complex",
    "reversibility": "painful",
    "category": "payments",
    "supportLevel": "partial",
    "supportReason": "Data export and the checkout re-point are real API work while access lasts; the appeal, the underwriting conversation at the next processor, and the reserve clock belong to the processors' humans and timelines.",
    "vendors": ["stripe"],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Read the termination notice: the stated reason, the final processing date, and the reserve/payout-hold terms your services agreement sets", "route": "person", "reversibility": "reversible", "riskLevel": "high", "actionUrl": "https://stripe.com/legal/ssa", "actionLabel": "Stripe Services Agreement (termination & reserves)", "estimatedMinutes": 30},
        {"id": "n2", "label": "Export everything while API access lasts: charges, customers, subscription state, dispute history, payout records", "route": "agent", "reversibility": "reversible", "vendor": "stripe", "functionCalls": [{"method": "GET /v1/charges", "type": "rest"}, {"method": "GET /v1/subscriptions", "type": "rest"}], "actionUrl": "https://docs.stripe.com/stripe-reports", "actionLabel": "Stripe: reports & data exports", "estimatedMinutes": 60},
        {"id": "n3", "label": "File the appeal through the processor's own review channel, with evidence: business model, fulfillment proof, dispute history", "route": "person", "reversibility": "reversible", "riskLevel": "high", "actionUrl": "https://support.stripe.com/", "actionLabel": "Stripe support (account reviews)", "estimatedMinutes": 60},
        {"id": "n4", "label": "Choose the backup processor and start its underwriting now — onboarding/KYC runs in days, not hours", "route": "person", "reversibility": "reversible", "optionsArenaId": "payments", "vendorOptions": ["paddle", "paypal", "square"], "estimatedMinutes": 60},
        {"id": "n5", "label": "Request the PAN-level card-data migration to the new processor (a PCI-compliant processor-to-processor transfer)", "route": "form", "reversibility": "reversible", "vendor": "stripe", "actionUrl": "https://docs.stripe.com/get-started/data-migrations", "actionLabel": "Stripe: payments data migrations", "estimatedMinutes": 45},
        {"id": "n6", "label": "Re-point checkout, billing, and webhooks to the new processor behind a flag, and reconcile the first live charges", "route": "agent", "reversibility": "reversible", "riskLevel": "medium", "optionsArenaId": "payments", "vendorOptions": ["paddle", "paypal", "square"], "estimatedMinutes": 120},
        {"id": "n7", "label": "Tell affected customers honestly if payouts, refunds, or renewals will wobble during the cutover", "route": "person", "reversibility": "painful", "estimatedMinutes": 45},
        {"id": "n8", "label": "Wait out the appeal decision and the reserve release — both run on the processor's stated schedule", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 43200}
      ],
      "edges": edges(8),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the termination notice (reason, final processing date, reserve terms)", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "what runs on the processor: subscriptions, payout cadence, integrations", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "payments", "processor", "termination", "migration"],
    "activeMinutes": 420, "totalEstimatedMinutes": 43620, "hasAsyncSteps": True,
    "annoyance": 5, "risk": 5, "growthImpact": 2,
    "produces": [], "requires": [],
  },
  {
    "id": "sit_014",
    "title": "Handle a security-vulnerability report",
    "description": "A good-faith vulnerability report is a gift wearing a deadline. Acknowledge fast and open a private channel — researchers go public when ignored; reproduce the finding honestly and make the severity call on exploitability, not embarrassment; fix on a clock the severity sets; then agree the disclosure timeline with the reporter (90-day coordinated-disclosure norms are industry practice, not law) and publish the advisory with credit. CISA's coordinated-vulnerability-disclosure guidance is the pattern, and a security.txt file is how the next report finds you instead of your CEO's inbox. If the hole was actually exploited and data was reached, that is 'Respond to a data breach' — different situation, statutory clocks.",
    "phase": "product",
    "kind": "situation",
    "trigger": "A security researcher (or a customer, or a stranger) reports a vulnerability in your product — responsibly, so far.",
    "urgency": "days",
    "cadence": "event-driven",
    "geoScope": "global",
    "complexity": "moderate",
    "reversibility": "reversible",
    "category": "security",
    "supportLevel": "partial",
    "supportReason": "Reproduction, the patch loop, and the advisory mechanics are agent-drivable — the judged scanners gate the fix; the severity call, the disclosure decision, and the reporter relationship stay human.",
    "vendors": [],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Acknowledge receipt fast and open a private channel with the reporter — silence is how disclosures go public", "route": "person", "reversibility": "reversible", "actionUrl": "https://www.cisa.gov/coordinated-vulnerability-disclosure-process", "actionLabel": "CISA: coordinated vulnerability disclosure", "estimatedMinutes": 20},
        {"id": "n2", "label": "Reproduce the report and scope the vulnerable surface: what's reachable, since when, by whom", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 60},
        {"id": "n3", "label": "Make the severity call: drop everything or schedule — exploitability and exposure, not embarrassment", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 30},
        {"id": "n4", "label": "Patch, regression-test, and run the scanners over the fix before it ships", "route": "agent", "reversibility": "reversible", "optionsArenaId": "security-scanners", "vendorOptions": ["semgrep", "snyk"], "estimatedMinutes": 120},
        {"id": "n5", "label": "Decide disclosure with the reporter: coordinated timeline, customer notice if data was reachable — exploited means the breach situation instead", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 45},
        {"id": "n6", "label": "Publish the fix and the advisory, credit the reporter, and adopt security.txt so the next report routes cleanly", "route": "agent", "reversibility": "reversible", "actionUrl": "https://securitytxt.org/", "actionLabel": "security.txt standard", "estimatedMinutes": 45},
        {"id": "n7", "label": "Hold the coordinated-disclosure window: the fix soaks in production, the reporter holds publication, you re-test", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 10080}
      ],
      "edges": edges(7),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the vulnerability report itself (vector, affected surface, reporter contact)", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "access to the affected code and deployment", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "security", "vulnerability", "disclosure", "triage"],
    "activeMinutes": 320, "totalEstimatedMinutes": 10400, "hasAsyncSteps": True,
    "annoyance": 3, "risk": 4, "growthImpact": 1,
    "produces": [], "requires": [],
  },
]

AUDIT = [
  # sit_013
  ("sit_013", "n1", "person", "The notice's stated reason and final-processing date set every clock downstream — and misreading the reserve terms is how founders plan payroll against money that is held.", "assist", "An agent can extract the dates and quote the services-agreement reserve terms; what the business does about them is the founder's call."),
  ("sit_013", "n3", "person", "Appeals are reviewed by the processor's risk team against their underwriting policy — evidence quality and the honest business-model story decide it, not submission speed.", "assist", "A browser agent can file the appeal form with the prepared evidence pack; what gets asserted is the founder's risk call."),
  ("sit_013", "n4", "person", "Choosing the next processor is an underwriting-fit question — the model that got you terminated may be restricted at the next one too; ask before you build.", "assist", "An agent can shortlist from the judged payments arena and pre-fill the application; the underwriting conversation is human."),
  ("sit_013", "n5", "form", "PAN-level migrations run processor-to-processor under PCI rules — you raise the request, the two processors execute the transfer between themselves.", "assist", "A browser agent can raise and track the migration request; the transfer itself is the processors' controlled process."),
  ("sit_013", "n7", "person", "Customers hear payout and renewal wobbles from the founder in plain words — trust is the asset the termination actually threatens.", "no-screen", "Drafting help aside, the telling is human; there is no screen between a founder and their customers here."),
  ("sit_013", "n8", "person", "Reserve releases and appeal decisions run on the processor's stated schedule — weeks to months with nothing on your side to advance.", "third-party-wait", "Nothing to drive; a calendar nudge to confirm the release is the whole automation."),
  # sit_014
  ("sit_014", "n1", "person", "The first reply sets the relationship: researchers go public when ignored — a fast, non-defensive acknowledgment is incident diplomacy, not support triage.", "assist", "An agent can draft the acknowledgment and open the private tracking channel; the tone toward a security researcher is a human call."),
  ("sit_014", "n3", "person", "Drop-everything vs scheduled is a severity judgment weighing exploitability against what is exposed — made by whoever owns the system, under uncertainty.", "assist", "An agent can lay out the reproduction, the CVSS factors, and the blast radius side by side; the priority call is the owner's."),
  ("sit_014", "n5", "person", "Coordinated disclosure is a negotiation with the reporter plus a customer-notice judgment — and if data was actually reached, the statutory breach clocks take over (its own situation).", "no-screen", "The decision forms in conversation with the reporter (and counsel where data is in play); nothing to drive."),
  ("sit_014", "n7", "person", "The disclosure window is deliberate waiting — the fix soaks in production while the reporter holds publication.", "third-party-wait", "Nothing to drive; the pre-publication re-test is already modeled in the fix loop."),
]

STORIES = [
  # function mappings (covering arena per node)
  ("sit_013", "n2", "function", "payments", ["openness-full-export", "agentic-public-api"]),
  ("sit_013", "n4", "function", "payments", ["integrate-from-docs-in-a-day", "sandbox-test-mode-fidelity"]),
  ("sit_013", "n5", "function", "payments", []),
  ("sit_013", "n6", "function", "payments", ["embedded-checkout-components", "webhook-delivery-reliability"]),
  ("sit_014", "n4", "function", "security-scanners", ["sast-code-scanning", "autofix-findings"]),
  # computer-use mappings — x2 per manual (non-agent, non-signature) node; [] = honest none.
  ("sit_013", "n1", "computer-use", "ai-assistants", []),
  ("sit_013", "n1", "computer-use", "browser-agents", []),
  ("sit_013", "n3", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_013", "n3", "computer-use", "browser-agents", ["dom-action-primitives", "file-download-upload"]),
  ("sit_013", "n4", "computer-use", "ai-assistants", []),
  ("sit_013", "n4", "computer-use", "browser-agents", []),
  ("sit_013", "n5", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_013", "n5", "computer-use", "browser-agents", ["dom-action-primitives"]),
  ("sit_013", "n7", "computer-use", "ai-assistants", []),
  ("sit_013", "n7", "computer-use", "browser-agents", []),
  ("sit_013", "n8", "computer-use", "ai-assistants", []),
  ("sit_013", "n8", "computer-use", "browser-agents", []),
  ("sit_014", "n1", "computer-use", "ai-assistants", []),
  ("sit_014", "n1", "computer-use", "browser-agents", []),
  ("sit_014", "n3", "computer-use", "ai-assistants", []),
  ("sit_014", "n3", "computer-use", "browser-agents", []),
  ("sit_014", "n5", "computer-use", "ai-assistants", []),
  ("sit_014", "n5", "computer-use", "browser-agents", []),
  ("sit_014", "n7", "computer-use", "ai-assistants", []),
  ("sit_014", "n7", "computer-use", "browser-agents", []),
]


REGISTRY = {
  # The security-scanners market sit_014's patch-gate step derives from; URLs curl-verified
  # 200 on 2026-10-02 (semgrep.dev, snyk.io). Same pattern as the sit_006 fraud-prevention
  # registry additions.
  "semgrep": {"arenaId": "security-scanners", "signupUrl": "https://semgrep.dev/"},
  "snyk": {"arenaId": "security-scanners", "signupUrl": "https://snyk.io/"},
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

    reg = load('processes/vendor-registry.json')
    for k, v in REGISTRY.items():
        assert k not in reg['vendors'], k
        reg['vendors'][k] = v
    reg['vendors'] = dict(sorted(reg['vendors'].items()))
    dump('processes/vendor-registry.json', reg)
    print('wired sit_013, sit_014')


if __name__ == '__main__':
    main()
