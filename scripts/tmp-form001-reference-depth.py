#!/usr/bin/env python3
"""Founder spike 2026-10-02: take form_001 (Incorporate C-Corp) to REFERENCE DEPTH.

Every number below was read LIVE on 2026-10-01 from the cited primary source and every URL was
curl-verified (200). Adds: verify on every checkable step, complete sourced costs (incl. the
method variants' published stickers / honest nulls), a Clerky vendor method, failureModes
(4 curated entries), documents cross-references, and rule-card citations for the legal claims.
"""
import json

CORPUS = 'processes/corpus.json'
FEE_PDF = 'https://corpfiles.delaware.gov/Fee_Schedule/AugustFee2026.pdf'
DELCODE_SC01 = 'https://delcode.delaware.gov/title8/c001/sc01/index.html'
NAMESEARCH = 'https://icis.corp.delaware.gov/ecorp/entitysearch/namesearch.aspx'
F15620 = 'https://www.irs.gov/pub/irs-pdf/f15620.pdf'
NOTICE123 = 'https://pe.usps.com/text/dmm300/Notice123.htm'
CLERKY = 'https://www.clerky.com/pricing'
GOVUK = 'https://www.gov.uk/limited-company-formation/register-your-company'
GNOTKG = 'https://www.gesetze-im-internet.de/gnotkg/'
CASOS = 'https://www.sos.ca.gov/business-programs/business-entities/forms/corporations-foreign-out-state-or-out-country'


def load(p):
    with open(p) as f:
        return json.load(f)


def dump(p, data):
    with open(p, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')


data = load(CORPUS)
task = next(t for t in data if t['id'] == 'form_001')
nodes = {n['id']: n for n in task['dag']['nodes']}

# --- n1 Choose formation service: Clerky's published sticker as a vendor method -------------
n1 = nodes['n1']
assert 'methods' not in n1
n1['methods'] = [
    {
        'id': 'clerky-formation',
        'label': 'Form through Clerky',
        'summary': "Clerky's published formation pricing (read live 2026-10-01): $427 one-time "
                   'pay-per-use incorporation or the $819 Company Lifetime Package — both '
                   'include expedited Delaware filing fees and the first-year registered agent.',
        'context': {'kind': 'vendor', 'when': 'Forming through Clerky rather than Stripe Atlas — pay-per-document pricing'},
        'vendor': 'clerky',
        'actionUrl': CLERKY,
        'actionLabel': 'Clerky pricing',
        'cost': {
            'usd': 427,
            'kind': 'typical-vendor-price',
            'source': CLERKY,
            'asOf': '2026-10-01',
            'note': 'Pay-per-use incorporation (includes expedited Delaware filing fees and the '
                    'first-year registered agent); the $819 Company Lifetime Package adds '
                    'unlimited standard post-incorporation paperwork products, and '
                    'post-incorporation setup is $299 separately on pay-per-use.',
        },
    },
]

# --- n3 Check name availability: verify + sourced failure mode ------------------------------
n3 = nodes['n3']
assert 'verify' not in n3 and 'failureModes' not in n3
n3['verify'] = {
    'how': 'The proposed name returns no indistinguishable active entity in the Delaware entity '
           'search and carries a required corporate-indicator word — the 8 Del. C. '
           '§ 102(a)(1) distinguishability standard (rule card '
           'us-de.incorporation-certificate-contents).',
    'url': NAMESEARCH,
}
n3['failureModes'] = [
    {
        'what': 'The name is not distinguishable from an existing entity of record, or lacks a '
                'required corporate word (association, company, corporation, incorporated, '
                'limited...).',
        'then': 'Pick a distinguishable name or obtain the consent § 102(a)(1) allows (rule '
                'card us-de.incorporation-certificate-contents); a cleared name can be reserved '
                'for 120 days for $75 on the published fee schedule.',
        'source': FEE_PDF,
    },
]

# --- n4 Submit incorporation filing: expedite options in the cost note, variant costs,
#     Companies House read-API call on the UK variant, § 103 failure mode, documents ---------
n4 = nodes['n4']
assert n4['cost']['usd'] == 109
n4['cost']['note'] = (
    "Minimum state filing fee for a one-page, minimum-stock Certificate of Incorporation — the "
    "schedule marks it 'varies based on stock'. Expedited options on the same schedule, per "
    "document: $50 24-hour, $100 same-day, $500 2-hour (Priority 2), $1,000 1-hour (Priority 1)."
)
n4['documents'] = ['de-formation-instructions']
assert 'failureModes' not in n4
n4['failureModes'] = [
    {
        'what': 'The Division rejects the filing because the certificate is defective — missing '
                '§ 102(a) required contents or § 103 execution.',
        'then': "Fix the defect and resubmit: the corporation exists only once the Secretary of "
                "State endorses the instrument 'Filed' (rule card "
                'us-de.incorporation-filing-mechanics); nothing is committed until that '
                'endorsement.',
        'source': DELCODE_SC01,
    },
]
methods = {m['id']: m for m in n4['methods']}
uk = methods['uk-companies-house']
assert 'cost' not in uk and 'functionCalls' not in uk
uk['cost'] = {
    'usd': None,
    'kind': 'government-fee',
    'source': GOVUK,
    'asOf': '2026-10-01',
    'note': '£100 Companies House fee for the online incorporation (£124 by post) — '
            'published in GBP only, so no USD figure is claimed; online registrations usually '
            'complete within 24 hours.',
}
uk['functionCalls'] = [
    {
        'method': 'GET https://api.company-information.service.gov.uk/company/{companyNumber}',
        'type': 'rest',
        'description': "Confirm the new company's registered profile via the Companies House "
                       'REST API — read access needs a free API key from the Developer Hub, '
                       'sent as the HTTP Basic username.',
    },
]
de = methods['germany-notary-gmbh']
assert 'cost' not in de
de['cost'] = {
    'usd': None,
    'kind': 'government-fee',
    'source': GNOTKG,
    'asOf': '2026-10-01',
    'note': 'Notary fees are statutory under GNotKG — value-based (Geschäftswert) via the '
            'Kostenverzeichnis (Annex 1 to § 3(2)) — plus Handelsregister fees; the amount '
            'scales with share capital, so no single sticker price exists.',
}
# india-spice-plus / france-inpi-guichet: no single published fee was verifiable live -> no cost
# field (the honest absence, not a null with a guessed source).

# --- n5 Receive Certificate: the stamped artifact IS the check; certified-copy fee; lost-cert
#     failure mode ----------------------------------------------------------------------------
n5 = nodes['n5']
assert 'verify' not in n5 and 'cost' not in n5 and 'failureModes' not in n5
n5['verify'] = {
    'how': "The stamped 'Filed' Certificate of Incorporation is in hand — the Secretary of "
           "State's endorsement is the filing date (rule card "
           'us-de.incorporation-filing-mechanics), and the retained stamped copy is the '
           'artifact every bank and investor asks for.',
}
n5['cost'] = {
    'usd': 50,
    'kind': 'government-fee',
    'source': FEE_PDF,
    'asOf': '2026-10-01',
    'note': 'Optional certified copy of the filed certificate: $50 per document plus $2 per '
            'page (expedited $60 same-day / $50 24-hour). The plain stamped copy comes back '
            'with the filing itself at no extra fee.',
}
n5['failureModes'] = [
    {
        'what': 'The stamped certificate copy is lost.',
        'then': 'Order a certified copy from the Division — $50 per document plus $2 per page '
                'on the published fee schedule; a certified copy is accepted wherever the '
                'stamped original would be.',
        'source': FEE_PDF,
    },
]

# --- n6 / n7: canonical open documents for the drafting steps --------------------------------
nodes['n6']['documents'] = ['cooley-incorporation-package-de']
nodes['n7']['documents'] = ['cooley-incorporation-package-de']

# --- n7b Founders sign the SPAs: the retained executed paper is the check --------------------
n7b = nodes['n7b']
assert 'verify' not in n7b
n7b['verify'] = {
    'how': 'The executed stock purchase agreements plus the matching entries in the '
           "company's stock ledger — the retained signed SPAs and the ledger ARE the record; "
           'no external registry of private stock issuances exists to query.',
}

# --- n8a Sign the 83(b): the canonical IRS form ----------------------------------------------
nodes['n8a']['documents'] = ['irs-form-15620']

# --- n8 File 83(b): certified-mail cost from the live USPS price list, rule-card citations,
#     the missed-window failure mode ----------------------------------------------------------
n8 = nodes['n8']
assert n8['cost']['kind'] == 'free'
n8['cost'] = {
    'usd': 5.55,
    'kind': 'government-fee',
    'source': NOTICE123,
    'asOf': '2026-10-01',
    'note': 'USPS Certified Mail fee (Notice 123, prices effective 2026-07-12), plus '
            'First-Class postage ($0.82 stamped 1 oz letter) and optional return receipt '
            '($2.91 electronic / $4.65 mail). The IRS charges nothing for the election itself.',
}
n8['verify'] = {
    'how': 'Retain the USPS certified-mail receipt and a date-stamped copy of the election — '
           'the IRS sends no acknowledgment, so proof of timely mailing within the 30-day '
           'window (rule card us-fed.83b-filing-period) IS the record; if the IRS returns a '
           'stamped copy, retain it as the strongest evidence.',
    'url': F15620,
}
# n8.functionCalls stays byte-identical (it feeds the committed derived-data hashes); its
# "within 30 days" claim resolves to rule card us-fed.83b-filing-period via the verify and the
# failure mode on this same step.
assert 'failureModes' not in n8
n8['failureModes'] = [
    {
        'what': 'The 30-day window passes with no postmarked election.',
        'then': 'There is no cure: the deadline is jurisdictional (rule card '
                'us-fed.83b-filing-period) and an election generally cannot be made late or '
                'revoked without IRS consent (rule card us-fed.83b-revocation) — what remains '
                'is a tax-counsel conversation about the consequences, not a self-help fix.',
        'source': F15620,
    },
]

# --- jca1 (jurisdiction-conditional, CA): the published bizfile fee --------------------------
jca1 = nodes['jca1']
assert 'cost' not in jca1
jca1['cost'] = {
    'usd': 100,
    'kind': 'government-fee',
    'source': CASOS,
    'asOf': '2026-10-01',
    'note': 'Statement and Designation by Foreign Corporation (stock corporation) filing fee; '
            'filed through bizfile Online. Conditional step — excluded from the default-flow '
            'fee headline by construction.',
}

dump(CORPUS, data)
print('form_001 reference depth wired.')
