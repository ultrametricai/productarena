#!/usr/bin/env python3
"""Append the two primary sources the situation rule cards cite (founder ask 2026-10-01)."""
import json

reg = json.load(open('sources/registry.json'))
assert all(s['id'] not in ('uspto-responding-office-actions-page', 'frcp-rule-12') for s in reg['sources'])
reg['updated_on'] = '2026-10-01'
reg['sources'] += [
    {
        "id": "uspto-responding-office-actions-page",
        "publisher": "United States Patent and Trademark Office",
        "title": "Responding to office actions (trademarks)",
        "kind": "primary-agency-guidance",
        "url": "https://www.uspto.gov/trademarks/maintain/responding-office-actions",
        "locator": "'What is a nonfinal versus a final office action?' — respond within three months from issue, optional three-month extension for a fee; Madrid Section 66(a): six months, no extension",
        "issued_on": None,
        "checked_on": "2026-10-01",
        "jurisdiction": "US-FED",
        "note": "Agency guidance page, fetched live 2026-10-01 (the three-month and extension text verified verbatim). 37 CFR 2.62 and the TMEP control; recheck the live page and the office action itself before relying.",
    },
    {
        "id": "frcp-rule-12",
        "publisher": "United States Courts",
        "title": "Federal Rules of Civil Procedure, Rule 12 (Defenses and Objections: When and How Presented)",
        "kind": "primary-regulation",
        "url": "https://www.uscourts.gov/rules-policies/current-rules-practice-procedure/federal-rules-civil-procedure",
        "locator": "Fed. R. Civ. P. 12(a)(1)(A)(i)-(ii) (21 days after service; 60/90 days after a Rule 4(d) waiver request), 12(a)(2)-(4)",
        "issued_on": None,
        "checked_on": "2026-10-01",
        "jurisdiction": "US-FED",
        "note": "Court rules promulgated under the Rules Enabling Act, 28 U.S.C. §§ 2071-2077 — official uscourts.gov publication page, curl-verified live 2026-10-01. Check the current rules edition and any local rules or orders.",
    },
]
with open('sources/registry.json', 'w') as f:
    json.dump(reg, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('sources appended')
