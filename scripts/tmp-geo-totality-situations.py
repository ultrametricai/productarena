#!/usr/bin/env python3
"""Geo coverage to totality, part 1 of 2 (founder boost 2026-10-02: "close EVERY gap"): the
US-scoped SITUATIONS' missing country notes — sit_001/002/004/005/007/008/009/010 gain all four
countries and sit_003 gains the CNIL note the first pass couldn't verify (the canonical
teleservice page curl-verified 200 this round). Every note carries the curated kind
(analog / absorbed / not-applicable, lib/geoPreference.ts GEO_NOTE_KINDS) and a live-fetched
actionUrl — government/primary sources preferred; bot-walled official hosts follow the
established substitutions (mca.gov.in→NSWS; travel.state.gov's documented 403 posture from the
sit_002 wiring). Same tmp-wire pattern as tmp-wire-situations-set.py."""
import json

CORPUS = 'processes/corpus.json'

# (taskId, country, kind, summary, actionUrl, actionLabel). URLs curl-verified 2026-10-02
# (200 via GET unless noted).
NOTES = [
  # --- sit_001 Respond to a cease-and-desist: demand letters exist everywhere; the local
  # --- flavors differ enough to matter (UK threats regime, German Abmahnung contracts).
  ("sit_001", "UK", "analog",
   "A C&D usually arrives as a letter before claim under the IP pre-action regime — and the UK's unjustified-threats rules (Intellectual Property (Unjustified Threats) Act 2017) cut both ways: a groundless infringement threat can itself be actionable, which disciplines both the letter you received and any reply you send. IP counsel before answering, same as the US flow.",
   "https://www.legislation.gov.uk/ukpga/2017/14/contents",
   "Unjustified Threats Act 2017"),
  ("sit_001", "DE", "analog",
   "The German form is the Abmahnung with a strafbewehrte Unterlassungserklärung attached: signing that cease-and-desist declaration creates a contract with penalties for every future breach, so never sign it unreviewed. Short stated deadlines are normal and an einstweilige Verfügung (preliminary injunction) can follow quickly — counsel first.",
   "https://www.dpma.de/marken/index.html",
   "DPMA — Marken (trademarks)"),
  ("sit_001", "FR", "analog",
   "A mise en demeure letter typically precedes a contrefaçon action; preserve your evidence and answer through IP counsel — once litigation starts, saisie-contrefaçon evidence seizures move quickly, so the calm, reasoned reply matters as much as in the US.",
   "https://www.inpi.fr/",
   "INPI (French IP office)"),
  ("sit_001", "IN", "analog",
   "A C&D under the Trade Marks Act 1999 works like the US letter — and Section 142 provides a remedy against groundless threats, which a reasoned reply can invoke. Pull the claimed mark's record on the registry before answering, with counsel.",
   "https://ipindia.gov.in/",
   "IP India (trade marks registry)"),

  # --- sit_002 Unstick a delayed US visa: inherently US-inbound — the honest non-US note is
  # --- that a founder abroad faces the SAME US machinery, not a local analog.
  ("sit_002", "UK", "not-applicable",
   "Inherently US-inbound: a UK founder hits this situation in the US embassy/consulate queue, not in any UK process — the 221(g) administrative-processing reality this situation maps is the same one from London.",
   "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/administrative-processing-information.html",
   "US State Dept: administrative processing (221(g))"),
  ("sit_002", "IN", "not-applicable",
   "Inherently US-inbound: Indian founders face this situation at the US consulates (where 221(g) administrative processing is famously common), not in any Indian process — the escalation paths are the US ones this situation maps.",
   "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/administrative-processing-information.html",
   "US State Dept: administrative processing (221(g))"),
  ("sit_002", "DE", "not-applicable",
   "Inherently US-inbound: a German founder encounters this situation at the US consulate (Frankfurt handles most visa classes), not in any German process — the delay machinery and its unsticking levers are the US ones mapped here.",
   "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/administrative-processing-information.html",
   "US State Dept: administrative processing (221(g))"),
  ("sit_002", "FR", "not-applicable",
   "Inherently US-inbound: a French founder faces this at the US embassy in Paris, not in a French process — the 221(g) wait and the expedite/inquiry levers are the US-side machinery this situation maps.",
   "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/administrative-processing-information.html",
   "US State Dept: administrative processing (221(g))"),

  # --- sit_003 Respond to a data breach: the FR note the first pass couldn't verify — the
  # --- CNIL's own notification page answered 200 to a live fetch this round.
  ("sit_003", "FR", "analog",
   "GDPR Article 33 in France runs through the CNIL: notify within 72 hours of awareness via the CNIL's online breach-notification teleservice (a two-stage notification is allowed while facts are incomplete), and inform the affected people where the risk to them is high.",
   "https://www.cnil.fr/fr/notifier-une-violation-de-donnees-personnelles",
   "CNIL — notify a data breach"),

  # --- sit_004 Answer an IRS or state tax notice: every country's tax authority writes
  # --- letters with their own clocks; the contest routes are real and named.
  ("sit_004", "UK", "analog",
   "HMRC's version is the compliance check or a decision letter — respond by the letter's own date, and if you disagree the route is a statutory review and then an appeal to the tax tribunal, most of it on 30-day windows stated in the decision itself.",
   "https://www.gov.uk/tax-appeals",
   "HMRC — disagree with a tax decision"),
  ("sit_004", "DE", "analog",
   "A Steuerbescheid from the Finanzamt carries a one-month Einspruch (objection) window under §355 AO — object in time and the assessment stays open while it is re-examined; let the month lapse and it binds. The notice's own Rechtsbehelfsbelehrung states the clock.",
   "https://www.gesetze-im-internet.de/ao_1977/__355.html",
   "AO §355 — Einspruch deadline"),
  ("sit_004", "FR", "analog",
   "A proposition de rectification from the DGFiP opens its own stated reply window (30 days, extendable on request), and the réclamation through your espace professionnel on impots.gouv.fr is the formal contest route — answer by the letter's date, with your accountant.",
   "https://www.impots.gouv.fr/professionnel",
   "impots.gouv.fr — espace professionnel"),
  ("sit_004", "IN", "analog",
   "Income-tax notices (143(1) mismatches, 139(9) defective returns, 142(1) inquiries) land in the e-filing portal's e-Proceedings and are answered there by the notice's own date — the response flow is electronic end to end against your PAN.",
   "https://www.incometax.gov.in/iec/foportal/",
   "Income Tax e-filing (e-Proceedings)"),

  # --- sit_005 Frozen bank account / bank failure: deposit-protection schemes are the real
  # --- analogs — different caps, same payroll-first triage.
  ("sit_005", "UK", "analog",
   "If a UK-authorised bank fails, the FSCS protects £85,000 per depositor per bank and aims to pay most depositors within days; a compliance freeze is the same KYC/UBO documents conversation with the bank — and standing up a second operating account for payroll is the same first move.",
   "https://www.fscs.org.uk/",
   "FSCS deposit protection"),
  ("sit_005", "DE", "analog",
   "The statutory Entschädigungseinrichtung deutscher Banken (EdB) compensates €100,000 per depositor per bank (the EU deposit-guarantee floor) and contacts depositors after a failure; compliance freezes are worked out with the bank's own team under BaFin supervision.",
   "https://www.edb-banken.de/",
   "EdB — German deposit protection"),
  ("sit_005", "FR", "analog",
   "The FGDR guarantees €100,000 per depositor per bank and targets compensation within seven working days of a failure; a gel du compte lifts on the bank's KYC questions being answered, not on a form — the backup-account move is identical.",
   "https://www.garantiedesdepots.fr/",
   "FGDR deposit guarantee"),
  ("sit_005", "IN", "analog",
   "DICGC insurance covers ₹5 lakh per depositor per bank (principal plus interest), and RBI moratoria on stressed banks have historically capped withdrawals for months — which makes the second-account triage even more important than in the US.",
   "https://www.dicgc.org.in/",
   "DICGC deposit insurance"),

  # --- sit_007 Co-founder departure: the vesting/consent/register mechanics exist everywhere
  # --- but run through different instruments — notaries, registries, leaver clauses.
  ("sit_007", "UK", "analog",
   "The mechanics run through Companies House (TM01 for the directorship, PSC updates where ownership crosses thresholds) and through the articles and shareholders' agreement — good-leaver/bad-leaver provisions usually decide what happens to the shares and at what price.",
   "https://www.gov.uk/file-changes-to-a-company-with-companies-house",
   "Companies House — file company changes"),
  ("sit_007", "DE", "analog",
   "GmbH shares move only by notarized deed (§15 GmbHG — the Abtretung requires notarielle Beurkundung) and the updated Gesellschafterliste is filed to the Handelsregister; founder vesting lives in the Gesellschaftervereinbarung, not in statute, so read yours first.",
   "https://www.gesetze-im-internet.de/gmbhg/__15.html",
   "GmbHG §15 — notarized share transfer"),
  ("sit_007", "FR", "analog",
   "In a SAS the statuts and the pacte d'associés govern the exit (leaver and forced-transfer clauses); the share movement is recorded in the company's registre de mouvements de titres and officer changes file through the INPI guichet unique.",
   "https://procedures.inpi.fr/",
   "INPI guichet unique (formalités)"),
  ("sit_007", "IN", "analog",
   "Director changes file to the RoC on DIR-12 within 30 days (the director's own DIR-11 alongside), share transfers move on Form SH-4 with stamp duty, and founder vesting is a shareholders'-agreement matter enforced through the articles — same mechanics, MCA paperwork.",
   "https://www.nsws.gov.in/",
   "India NSWS (MCA filings)"),

  # --- sit_008 Respond to a lawsuit: service starts a clock everywhere; the clocks and the
  # --- representation rules differ.
  ("sit_008", "UK", "analog",
   "Served with a claim form, you acknowledge service and file a defence on the CPR clock — 14 days from the particulars of claim, 28 with an acknowledgment of service; money claims respond online, and silence ends in default judgment.",
   "https://www.gov.uk/respond-to-court-claim-for-money",
   "gov.uk — respond to a court claim"),
  ("sit_008", "DE", "analog",
   "A served Klage comes with the court's own stated deadlines — typically two weeks to declare the intent to defend (Verteidigungsanzeige) and a further period for the Klageerwiderung; before the Landgericht a lawyer is mandatory (Anwaltszwang), and a missed response risks a Versäumnisurteil.",
   "https://www.justiz.de/",
   "Justizportal (German courts)"),
  ("sit_008", "FR", "analog",
   "An assignation names the court and the clock; before the tribunal judiciaire you generally must appoint an avocat (constitution d'avocat) within the summons's stated window — the document itself states your deadline, and default judgment follows silence.",
   "https://www.justice.fr/",
   "justice.fr (French courts)"),
  ("sit_008", "IN", "analog",
   "A summons under the CPC sets the date to appear and file the written statement — 30 days, extendable to 90 (and a hard 120-day cap in commercial suits under the Commercial Courts Act); the e-Courts services track the case number end to end.",
   "https://ecourts.gov.in/",
   "eCourts case services"),

  # --- sit_009 Trademark office action: every office examines and objects; the response
  # --- windows are the analog's heart (UKIPO 2 months, India 30 days).
  ("sit_009", "UK", "analog",
   "The UKIPO issues an examination report with a two-month response window — objections commonly on distinctiveness, plus notifications of earlier marks surfaced in the search (the UK notifies rather than refuses on relative grounds). Respond, amend, or let it lapse.",
   "https://www.gov.uk/how-to-register-a-trade-mark",
   "UKIPO — register a trade mark"),
  ("sit_009", "DE", "analog",
   "A DPMA Beanstandung names the defect (absolute grounds, classification, formalities) with its own stated response deadline; relative grounds arrive later as oppositions after publication — answer through the DPMA's procedures or counsel, inside the stated window.",
   "https://www.dpma.de/marken/index.html",
   "DPMA — Marken (trademarks)"),
  ("sit_009", "FR", "analog",
   "INPI examination raises objections with the notification's own reply deadline, and third-party oppositions run on fixed windows after publication — both are answered through the INPI e-procedures portal, which is also where the file's status lives.",
   "https://procedures.inpi.fr/",
   "INPI e-procedures (marques)"),
  ("sit_009", "IN", "analog",
   "The registry's examination report must be answered within 30 days of receipt or the application is treated as abandoned — the report and the application status live on the registry's online search, and responses go through an agent or attorney.",
   "https://tmrsearch.ipindia.gov.in/",
   "India TM registry (status & examination reports)"),

  # --- sit_010 Cure a franchise-tax delinquency: no other country has Delaware's ritual, but
  # --- the honest analog is curing the missed company-register annual filing — real everywhere.
  ("sit_010", "UK", "analog",
   "The analog is the overdue confirmation statement or accounts at Companies House: late accounts trigger automatic penalties (from £150, doubled when late two years running) and a long-overdue confirmation statement starts the strike-off path — cure by filing online, then fix the reminders.",
   "https://www.gov.uk/government/publications/late-filing-penalties",
   "Companies House — late filing penalties"),
  ("sit_010", "DE", "analog",
   "Miss the Offenlegung (disclosure) of annual accounts and the Bundesamt für Justiz opens Ordnungsgeld proceedings — from €2,500, repeatable, after a six-week grace notice — so the cure is filing in the Unternehmensregister before the next escalation.",
   "https://www.unternehmensregister.de/",
   "Unternehmensregister (filing portal)"),
  ("sit_010", "FR", "analog",
   "The analog is the overdue dépôt des comptes annuels at the greffe: the president of the tribunal de commerce can order the filing under daily penalty (astreinte), and the cure is simply depositing the accounts through the one-stop formalities channel.",
   "https://entreprendre.service-public.fr/vosdroits/F31214",
   "Dépôt des comptes annuels (service-public)"),
  ("sit_010", "IN", "analog",
   "MCA's annual filings (AOC-4 accounts, MGT-7 annual return) accrue additional fees of ₹100 per day per form once late — no cap — and persistent default risks director disqualification; the cure is filing the overdue forms with the accrued fees.",
   "https://www.nsws.gov.in/",
   "India NSWS (MCA compliance)"),
]


def main():
    with open(CORPUS) as f:
        corpus = json.load(f)
    by_id = {t['id']: t for t in corpus}
    for task_id, country, kind, summary, url, label in NOTES:
        task = by_id[task_id]
        notes = task.setdefault('geoNotes', [])
        assert country not in {n['country'] for n in notes}, (task_id, country)
        assert task['geoScope'] in ('us', 'us-state'), task_id
        notes.append({
            'country': country, 'kind': kind, 'summary': summary,
            'actionUrl': url, 'actionLabel': label,
        })
    # The point of the pass: these nine situations are now four-country total.
    for task_id in ['sit_001', 'sit_002', 'sit_003', 'sit_004', 'sit_005',
                    'sit_007', 'sit_008', 'sit_009', 'sit_010']:
        countries = sorted(n['country'] for n in by_id[task_id]['geoNotes'])
        assert countries == ['DE', 'FR', 'IN', 'UK'], (task_id, countries)
    with open(CORPUS, 'w') as f:
        # The committed corpus is literal UTF-8 (the step-documents wiring round switched it);
        # ensure_ascii=False keeps this diff additive-only.
        json.dump(corpus, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f'added {len(NOTES)} situation geo notes')


if __name__ == '__main__':
    main()
