#!/usr/bin/env python3
"""Geo coverage to totality, part 2 of 2 (founder boost 2026-10-02): the five remaining
US-scoped PROCESSES close — qs_023 open-bank-account (the priority: full four-country analogs,
aligned with the committed jurisdictions/vendor-geo.json Wise/Airwallex judgments), qs_044
mailing address (registered-office/domiciliation analogs are real), fund_003 409A (DE/FR
honestly not-applicable — no statutory appraisal ritual exists), tax_003 1099s (DE honestly
not-applicable — no payer-side information return), vc_002 close-the-fund (the AIFMD reality:
BaFin/KAGB and AMF). Every actionUrl fetched live 2026-10-02 (curl 200). After this pass:
uncovered = 0 across all 41 US-scoped records — pinned in lib/__tests__/processes.test.ts."""
import json

CORPUS = 'processes/corpus.json'

NOTES = [
  # --- qs_023 Open bank account (founder priority (a)). The vendor-geo spike's committed
  # --- judgments are the availability spine: Wise UK/DE/FR available, IN partial
  # --- (receive-from-abroad only); Airwallex UK/DE/FR available via the UK/Europe entities,
  # --- IN not onboarded. The notes cite real account-opening portals a founder starts from.
  ("qs_023", "UK", "analog",
   "Open a UK business account once (or while) the company registers at Companies House — Wise Business and Airwallex both fully serve UK-registered companies per the committed geo spike, and challenger/high-street onboarding is the same KYC/UBO conversation as the US flow.",
   "https://wise.com/gb/business/",
   "Wise Business (UK)"),
  ("qs_023", "IN", "analog",
   "The real path is a current account with an Indian bank once incorporation documents and PAN exist — the geo spike found Airwallex doesn't onboard Indian-registered businesses and Wise's India business offering is receive-from-abroad only, so domestic banking is bank-first, KYC in person or video.",
   "https://www.icicibank.com/business-banking/current-account",
   "ICICI Bank — business current account"),
  ("qs_023", "DE", "analog",
   "German companies are served through the EEA fintech rails — Wise (via Wise Europe) and Airwallex's Europe entity both onboard German entities with local IBANs, per the committed geo spike — alongside the traditional Hausbank route; expect the notarized formation documents in the KYC pack.",
   "https://wise.com/de/business/",
   "Wise Business (Germany)"),
  ("qs_023", "FR", "analog",
   "French companies open on the same EEA rails (Wise Europe, Airwallex Europe — both judged available) or with the Paris-native Qonto, whose onboarding is built around French formalities — a new SAS's dépôt de capital commonly happens at the same provider that becomes the operating account.",
   "https://qonto.com/fr",
   "Qonto (France)"),

  # --- qs_044 Set up mailing address: the registered-office / domiciliation analogs are real
  # --- (the UK note existed; IN/DE/FR close here).
  ("qs_044", "IN", "analog",
   "The registered office is declared to the MCA (INC-22, within 30 days of incorporation where not declared at filing) and every change files back to the RoC; virtual-office addresses are widely used — including per-state for GST registrations, each state wanting its own proof-of-address set.",
   "https://www.nsws.gov.in/",
   "India NSWS (MCA filings)"),
  ("qs_044", "DE", "analog",
   "The company's inländische Geschäftsanschrift lives in the Handelsregister and the website's Impressum needs a ladungsfähige Anschrift — a business-center address is fine if post genuinely reaches you; address changes go through the notary to the register, so pick one that will last.",
   "https://www.handelsregister.de/",
   "Handelsregister (business address)"),
  ("qs_044", "FR", "analog",
   "Domiciliation is its own regulated service in France: a société de domiciliation (agréée by the préfecture) contracts to host your siège social, and the address flows through the INPI guichet unique onto the RCS — the service-public page is the canonical map of what qualifies.",
   "https://entreprendre.service-public.fr/vosdroits/F2160",
   "Domiciliation d'entreprise (service-public)"),

  # --- fund_003 Get a 409A valuation: DE/FR honestly have NO statutory appraisal ritual —
  # --- the one-liner is the truth (the UK EMI and India 11UA analogs were already mapped).
  ("fund_003", "DE", "not-applicable",
   "No 409A equivalent: there is no statutory safe-harbor appraisal for option strike prices. German ESOP/VSOP pricing is a company-and-tax-advisor judgment, and the statutory lever that actually matters is §19a EStG's deferred ('dry income') taxation for startup employee equity.",
   "https://www.gesetze-im-internet.de/estg/__19a.html",
   "EStG §19a — startup equity taxation"),
  ("fund_003", "FR", "not-applicable",
   "No 409A equivalent: BSPCE strike prices are set by the issuing company with no statutory appraisal or safe harbor — the tax administration's BOFiP doctrine governs eligibility and taxation, so price prudently off the last round with your advisors and document the reasoning.",
   "https://bofip.impots.gouv.fr/",
   "BOFiP — official tax doctrine (BSPCE)"),

  # --- tax_003 Issue 1099s: Germany, decided from the sources — not-applicable (no payer-side
  # --- information return for ordinary contractor fees; the duties are invoice-side).
  ("tax_003", "DE", "not-applicable",
   "No 1099 regime: contractors invoice you (a §14 UStG-compliant Rechnung, VAT where due) and self-report their income; the payer's duties are the invoice and bookkeeping trail (GoBD) and reverse-charge handling — no information return to the Finanzamt exists for ordinary fees.",
   "https://www.gesetze-im-internet.de/ustg_1980/__14.html",
   "UStG §14 — invoice requirements"),

  # --- vc_002 Close the fund: the AIFMD reality, one-liner + regulator URL, as briefed.
  ("vc_002", "DE", "analog",
   "Closing a German fund is an AIFMD event: the manager registers with (sub-threshold) or is authorized by BaFin under the KAGB before capital is accepted, and the first close itself is the LPA's closing mechanics with BaFin reporting attached from then on.",
   "https://www.bafin.de/",
   "BaFin (KAGB / AIFM supervision)"),
  ("vc_002", "FR", "analog",
   "French VC funds close under the AMF's regime: the management company is AMF-authorized, the vehicle (FPCI or SLP) is declared to the AMF, and the first close follows the fund's règlement/LPA — AIFMD reporting runs from the close onward.",
   "https://www.amf-france.org/",
   "AMF (fund management supervision)"),
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
    # The founder's pin: uncovered = 0 — every US-scoped record carries all four countries.
    uncovered = [
        t['id'] for t in corpus
        if t.get('geoScope') in ('us', 'us-state')
        and sorted(n['country'] for n in t.get('geoNotes', [])) != ['DE', 'FR', 'IN', 'UK']
    ]
    assert uncovered == [], uncovered
    with open(CORPUS, 'w') as f:
        json.dump(corpus, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f'added {len(NOTES)} process geo notes; uncovered = 0')


if __name__ == '__main__':
    main()
