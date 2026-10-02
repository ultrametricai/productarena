#!/usr/bin/env python3
"""Situations wave 3, pair E — the set closes at 10 (founder boost 2026-10-02): sit_021
workplace injury / workers'-comp report (the OSHA 8/24-hour clocks rule-carded against
osha.gov/report; state-fund basics honestly needs_review-postured in prose — state systems
differ sharply; us-state scope with the RIDDOR/DGUV/CPAM-48h/ESIC analogs) and sit_022
harassment complaint received (EEOC's published employer obligations; no-retaliation and the
documented, prompt, thorough investigation as the spine; us scope with the ACAS-Code/AGG
§13/Code-du-travail/POSH-Act analogs — India's Internal Committee is statutory machinery).
Every URL curl-verified 200 on 2026-10-02 (shebox.wcd.gov.in bot-walls at 403, so the POSH
note cites the ministry instead). Also extends the /situations search aliases with the wave-3
triggers (the aliases totality obligation)."""
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
    "id": "sit_021",
    "title": "Report and manage a workplace injury",
    "description": "Care first, clocks second — but the clocks are real: a work-related fatality must be reported to OSHA within 8 hours, and any in-patient hospitalization, amputation, or eye loss within 24 (rule card us-fed.osha-severe-injury-reporting, osha.gov cited). Then the workers'-comp machinery: notify your carrier and hand the employee the claim form fast — state deadlines are short (California requires providing the DWC-1 within one working day of notice) — write the incident record while memories are fresh (plus the OSHA 300 log entry if you're covered), plan return-to-work honestly, and fix the hazard. State systems differ sharply: this is the generic shape with the honest pointer to YOUR state's rules and fund — verify locally; nothing here is legal advice. The claim itself runs on the carrier's and the state's clocks.",
    "phase": "hr",
    "kind": "situation",
    "trigger": "Someone is hurt at work — an injury on the job just happened and the reporting clocks may already be running.",
    "urgency": "hours",
    "cadence": "event-driven",
    "region": "us",
    "geoScope": "us-state",
    "complexity": "complex",
    "reversibility": "painful",
    "category": "hr",
    "supportLevel": "manual_guide",
    "supportReason": "The emergency response, the carrier conversation, and the return-to-work plan are human; an agent can draft the incident record, keep the OSHA log, and track the claim's clocks. State systems differ sharply — treat the state-fund specifics as needs-review until checked against your state.",
    "vendors": [],
    "geoNotes": [
      {"country": "UK", "kind": "analog", "summary": "RIDDOR makes certain workplace injuries reportable to the HSE — deaths and specified injuries by the quickest practicable means with the report within 10 days, over-seven-day incapacitations within 15 — through the HSE's online reporting forms.", "actionUrl": "https://www.hse.gov.uk/riddor/report.htm", "actionLabel": "HSE: report under RIDDOR"},
      {"country": "DE", "kind": "analog", "summary": "Arbeitsunfälle run through your Berufsgenossenschaft (the DGUV accident-insurance system): the Unfallanzeige is required for injuries causing more than three days' incapacity, and serious/fatal accidents are reported immediately — the insurer then owns treatment and rehabilitation.", "actionUrl": "https://www.dguv.de/", "actionLabel": "DGUV (statutory accident insurance)"},
      {"country": "FR", "kind": "analog", "summary": "Declare the accident du travail to the CPAM within 48 hours (Sundays and holidays excluded) and give the employee the feuille d'accident — the declaration runs electronically and late declarations expose the employer to the costs.", "actionUrl": "https://www.service-public.fr/particuliers/vosdroits/F14840", "actionLabel": "service-public — accident du travail"},
      {"country": "IN", "kind": "analog", "summary": "The Employees' Compensation Act and the ESIC scheme carry the duties: ESI-covered units report accidents through ESIC and benefits run from there, while non-covered employment falls under the EC Act's compensation machinery — the labour ministry is the canonical start.", "actionUrl": "https://labour.gov.in/", "actionLabel": "Ministry of Labour & Employment (India)"}
    ],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Care first: emergency response, the scene made safe — everything else waits for this", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 30},
        {"id": "n2", "label": "Check the OSHA clocks: fatality — report within 8 hours; in-patient hospitalization, amputation, or eye loss — within 24", "route": "person", "reversibility": "reversible", "riskLevel": "high", "actionUrl": "https://www.osha.gov/report", "actionLabel": "OSHA: report an incident", "estimatedMinutes": 20},
        {"id": "n3", "label": "File the OSHA report if a clock applies — by phone or the online form (state-plan states have their own channels)", "route": "form", "reversibility": "painful", "riskLevel": "high", "estimatedMinutes": 30},
        {"id": "n4", "label": "Notify the workers'-comp carrier and give the employee the claim form — state deadlines are short (CA: DWC-1 within one working day of notice)", "route": "person", "reversibility": "reversible", "riskLevel": "high", "actionUrl": "https://www.dir.ca.gov/dwc/", "actionLabel": "California DWC (workers' comp)", "estimatedMinutes": 45},
        {"id": "n5", "label": "Write the incident record while it's fresh: what, where, witnesses, equipment — and the OSHA 300 log entry if you're covered", "route": "agent", "reversibility": "reversible", "actionUrl": "https://www.osha.gov/recordkeeping", "actionLabel": "OSHA recordkeeping", "estimatedMinutes": 45},
        {"id": "n6", "label": "Plan return-to-work or modified duty honestly, with the employee and the carrier", "route": "person", "reversibility": "reversible", "estimatedMinutes": 45},
        {"id": "n7", "label": "Fix the hazard and document the correction — the recurrence is the lawsuit", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 60},
        {"id": "n8", "label": "The claim runs on the carrier's and the state's clocks — track it, don't chase it daily", "route": "person", "reversibility": "reversible", "async": True, "estimatedMinutes": 20160}
      ],
      "edges": edges(8),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "what happened, to whom, how serious — and when you learned of it (the clocks run from knowledge)", "tier": "user_input", "required": True},
      {"tool": "user_input", "query": "your workers'-comp carrier/policy and the state you operate in", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "hr", "injury", "osha", "workers-comp"],
    "activeMinutes": 275, "totalEstimatedMinutes": 20435, "hasAsyncSteps": True,
    "annoyance": 4, "risk": 5, "growthImpact": 1,
    "produces": [], "requires": [],
  },
  {
    "id": "sit_022",
    "title": "Respond to a harassment complaint",
    "description": "The response IS the defense: prompt, thorough, documented — and retaliation is separately unlawful, so the no-retaliation line is drawn on day one (the EEOC's published employer guidance is the spine here). Take the complaint seriously at receipt without judgments or promises, put interim measures in place that protect the complainant rather than punish them, choose an unconflicted investigator (outside counsel or an external HR investigator for anything senior), run the investigation properly, decide proportionately — up to termination — with the reasoning documented, close the loop with the complainant, and then actively watch for retaliation for months, because that is where companies lose. An EEOC charge may still follow; the file you built is the answer. Educational guidance, not legal advice.",
    "phase": "hr",
    "kind": "situation",
    "trigger": "An employee reports harassment — by complaint, by email, or in a conversation that just became one.",
    "urgency": "days",
    "cadence": "event-driven",
    "region": "us",
    "geoScope": "us",
    "complexity": "complex",
    "reversibility": "painful",
    "category": "hr",
    "supportLevel": "manual_guide",
    "supportReason": "The investigation, the proportionate-action judgment, and every conversation in this flow are irreducibly human (and counsel-led where it's senior); an agent can preserve the file and keep the timeline straight — that file is the company's defense.",
    "vendors": [],
    "geoNotes": [
      {"country": "UK", "kind": "analog", "summary": "The ACAS Code of Practice governs grievance handling — a fair procedure (investigation, hearing, appeal) is what tribunals expect, and compensation uplifts of up to 25% apply for unreasonably ignoring the Code.", "actionUrl": "https://www.acas.org.uk/acas-code-of-practice-on-disciplinary-and-grievance-procedures", "actionLabel": "ACAS Code of Practice (grievances)"},
      {"country": "DE", "kind": "analog", "summary": "The AGG gives employees a statutory complaint right (§13) and obliges the employer to act against harassment (§12, up to dismissal of the harasser) — a named complaints body (Beschwerdestelle) is expected in every company.", "actionUrl": "https://www.gesetze-im-internet.de/agg/__13.html", "actionLabel": "AGG §13 — complaint right"},
      {"country": "FR", "kind": "analog", "summary": "The Code du travail obliges the employer to prevent and act on harcèlement moral and sexuel; companies of 250+ must designate a référent, the CSE has its own alert rights, and the employer's inaction is itself actionable.", "actionUrl": "https://www.service-public.fr/particuliers/vosdroits/F2354", "actionLabel": "service-public — harassment at work"},
      {"country": "IN", "kind": "analog", "summary": "The POSH Act 2013 is statutory machinery, not policy: every workplace with 10+ employees must constitute an Internal Committee, complaints go to the IC, and the inquiry runs on a 90-day clock with annual reporting — the ministry for women and child development administers the regime.", "actionUrl": "https://wcd.gov.in/", "actionLabel": "Ministry of WCD (POSH Act)"}
    ],
    "dag": {
      "nodes": [
        {"id": "n1", "label": "Take it seriously at receipt: acknowledge, no judgments, no promises — and the no-retaliation line drawn on day one (retaliation is separately unlawful)", "route": "person", "reversibility": "reversible", "riskLevel": "high", "actionUrl": "https://www.eeoc.gov/harassment", "actionLabel": "EEOC: harassment (employer obligations)", "estimatedMinutes": 30},
        {"id": "n2", "label": "Interim measures while you investigate — schedule or reporting-line separation chosen to protect the complainant, never to punish them", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 45},
        {"id": "n3", "label": "Choose the investigator: trained and unconflicted internally, or outside counsel / an external HR investigator for anything senior", "route": "person", "reversibility": "reversible", "optionsArenaId": "startup-law-firms", "vendorOptions": ["cooley", "orrick", "fenwick", "gunderson_dettmer"], "estimatedMinutes": 45},
        {"id": "n4", "label": "Run the investigation: interviews, documents, contemporaneous notes — prompt, thorough, documented", "route": "person", "reversibility": "reversible", "riskLevel": "high", "estimatedMinutes": 180},
        {"id": "n5", "label": "Preserve the file: the complaint, interview notes, decisions and their reasons — the file is the company's defense", "route": "agent", "reversibility": "reversible", "estimatedMinutes": 30},
        {"id": "n6", "label": "Decide and act proportionately — up to termination — with the reasoning documented", "route": "person", "reversibility": "painful", "riskLevel": "high", "estimatedMinutes": 60},
        {"id": "n7", "label": "Close the loop with the complainant (the outcome, not necessarily the details) — and actively watch for retaliation for months", "route": "person", "reversibility": "reversible", "estimatedMinutes": 30}
      ],
      "edges": edges(7),
    },
    "contextNeeded": [
      {"tool": "user_input", "query": "the complaint as received, and who is involved (conflicts decide the investigator)", "tier": "user_input", "required": True}
    ],
    "tags": ["situation", "hr", "harassment", "investigation", "eeoc"],
    "activeMinutes": 420, "totalEstimatedMinutes": 420, "hasAsyncSteps": False,
    "annoyance": 4, "risk": 5, "growthImpact": 1,
    "produces": [], "requires": [],
  },
]

AUDIT = [
  # sit_021
  ("sit_021", "n1", "person", "The emergency response is physical-world action under pressure — people, scene, safety; no part of it is a screen.", "no-screen", "Nothing to drive; the record-keeping starts after the people are safe."),
  ("sit_021", "n2", "person", "Whether an OSHA clock applies is a severity read on a human being's condition, made fast, with under-reporting and over-reporting both costly.", "assist", "An agent can lay the 8/24-hour criteria against the known facts and surface the deadline; the severity read is human."),
  ("sit_021", "n3", "form", "The OSHA report is a federal filing with legal weight, made by phone or the agency's own form — state-plan states route differently.", "assist", "A browser agent can file the online form from the incident record once a human confirms the facts; many reports honestly happen by phone."),
  ("sit_021", "n4", "person", "The carrier notification and the claim-form handoff are human obligations on short state clocks — and the first conversation with the injured employee matters more than the paperwork.", "assist", "An agent can prepare the claim paperwork and calendar the state deadline; the handoff and the conversation are human."),
  ("sit_021", "n6", "person", "Return-to-work is negotiated between the employee's reality, the doctor's restrictions, and the carrier — judgment and care, not a form.", "no-screen", "The plan forms in conversations; an agent can only document what was agreed."),
  ("sit_021", "n8", "person", "Comp claims move on the carrier's and the state's adjudication clocks — weeks to months of their process.", "third-party-wait", "Nothing to drive; a status nudge when the claim state changes is the whole automation."),
  # sit_022
  ("sit_022", "n1", "person", "The first response sets the legal posture: acknowledgment without judgment, and the no-retaliation line — human words with legal weight.", "no-screen", "The conversation is the step; an agent can only timestamp that it happened."),
  ("sit_022", "n2", "person", "Interim measures are judgment about people under stress — protecting the complainant without prejudging the accused.", "no-screen", "Schedule mechanics aside, the design of the measures is a human call with legal consequence."),
  ("sit_022", "n3", "person", "Investigator choice is a conflicts-and-credibility judgment — anything senior needs someone the outcome cannot touch.", "assist", "An agent can shortlist outside investigators and counsel from the judged arena; the conflicts call is human."),
  ("sit_022", "n4", "person", "The investigation is interviews and credibility assessments — human testimony, weighed by a human, documented contemporaneously.", "no-screen", "An agent can transcribe and organize; the interviewing and the weighing are the investigator's."),
  ("sit_022", "n6", "person", "Proportionate action is an employment decision with legal exposure in both directions — too little proves tolerance, too much invites its own claim.", "no-screen", "The decision is made on the investigation file by the humans accountable for it."),
  ("sit_022", "n7", "person", "Closing the loop and the months of retaliation-watching are management attention — the part companies fail at after the file closes.", "assist", "An agent can watch for the measurable signals (schedule cuts, review-score swings) and nudge; reading them is human."),
]

STORIES = [
  # function mappings
  ("sit_022", "n3", "function", "startup-law-firms", ["employment-onboarding-docs", "stated-engagement-model"]),
  # computer-use mappings — x2 per manual (non-agent, non-signature) node; [] = honest none.
  ("sit_021", "n1", "computer-use", "ai-assistants", []),
  ("sit_021", "n1", "computer-use", "browser-agents", []),
  ("sit_021", "n2", "computer-use", "ai-assistants", []),
  ("sit_021", "n2", "computer-use", "browser-agents", []),
  ("sit_021", "n3", "computer-use", "ai-assistants", ["browser-agent"]),
  ("sit_021", "n3", "computer-use", "browser-agents", ["dom-action-primitives"]),
  ("sit_021", "n4", "computer-use", "ai-assistants", []),
  ("sit_021", "n4", "computer-use", "browser-agents", []),
  ("sit_021", "n6", "computer-use", "ai-assistants", []),
  ("sit_021", "n6", "computer-use", "browser-agents", []),
  ("sit_021", "n8", "computer-use", "ai-assistants", []),
  ("sit_021", "n8", "computer-use", "browser-agents", []),
  ("sit_022", "n1", "computer-use", "ai-assistants", []),
  ("sit_022", "n1", "computer-use", "browser-agents", []),
  ("sit_022", "n2", "computer-use", "ai-assistants", []),
  ("sit_022", "n2", "computer-use", "browser-agents", []),
  ("sit_022", "n3", "computer-use", "ai-assistants", []),
  ("sit_022", "n3", "computer-use", "browser-agents", []),
  ("sit_022", "n4", "computer-use", "ai-assistants", []),
  ("sit_022", "n4", "computer-use", "browser-agents", []),
  ("sit_022", "n6", "computer-use", "ai-assistants", []),
  ("sit_022", "n6", "computer-use", "browser-agents", []),
  ("sit_022", "n7", "computer-use", "ai-assistants", []),
  ("sit_022", "n7", "computer-use", "browser-agents", []),
]

OSHA_SOURCE = {
  "id": "osha-report-incident-page",
  "publisher": "Occupational Safety and Health Administration",
  "title": "Report a fatality or severe injury",
  "kind": "primary-agency-guidance",
  "url": "https://www.osha.gov/report",
  "locator": "'All employers are required to notify OSHA when an employee is killed on the job or suffers a work-related hospitalization, amputation, or loss of an eye' — fatality within 8 hours; in-patient hospitalization, amputation, or eye loss within 24 hours",
  "issued_on": None,
  "checked_on": "2026-10-02",
  "jurisdiction": "US-FED",
  "note": "Agency reporting page, fetched live 2026-10-02 (the 8-hour and 24-hour clocks verified). 29 CFR 1904.39 controls and state-plan states have their own channels; recheck the live page before relying.",
}

OSHA_RULE = {
  "id": "us-fed.osha-severe-injury-reporting",
  "kind": "legal",
  "statement": "An employer must report a work-related fatality to OSHA within 8 hours of learning of it, and any work-related in-patient hospitalization, amputation, or loss of an eye within 24 hours of learning of it.",
  "source_ids": ["osha-report-incident-page"],
  "caveat": "29 CFR 1904.39 controls the details (motor-vehicle and heart-attack edge cases differ), states operating their own OSHA-approved plans have their own reporting channels with at-least-as-strict clocks, and the reporting duty is independent of fault or of the workers'-comp claim. This repo does not calculate or extend the deadline.",
  "jurisdiction": "US-FED",
  "version": "0.1.0",
  "status": "demonstration",
  "reviewed_on": "2026-10-02",
  "review_due": "2027-01-02",
  "reviewer": "Lane editorial review (situations wave 3, 2026-10-02); independent domain expert review pending",
  "valid_from": None,
  "valid_until": None,
}

# The /situations palette aliases grow with the wave-3 triggers (what people actually type).
NEW_SITUATION_ALIASES = [
  "stripe account closed", "processor shutdown", "payout hold",
  "vulnerability report", "security disclosure",
  "dsar", "subject access request", "gdpr request",
  "app store rejection", "app removed",
  "ads account suspended", "google ads suspended",
  "domain hijacked", "account hacked",
  "employee resigned", "exercise window",
  "term sheet pulled", "lost the lead investor",
  "workplace injury", "workers comp", "osha report",
  "harassment complaint",
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

    sources = load('sources/registry.json')
    assert all(s['id'] != OSHA_SOURCE['id'] for s in sources['sources'])
    sources['sources'].append(OSHA_SOURCE)
    dump('sources/registry.json', sources)

    dump('rules/US-FED/us-fed-osha-severe-injury-reporting.json', OSHA_RULE)

    aliases = load('data/search-aliases.json')
    sit = aliases['pages']['/situations']
    for phrase in NEW_SITUATION_ALIASES:
        assert phrase not in sit, phrase
        sit.append(phrase)
    dump('data/search-aliases.json', aliases)
    print('wired sit_021, sit_022 + the OSHA rule card + /situations aliases')


if __name__ == '__main__':
    main()
