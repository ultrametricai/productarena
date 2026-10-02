#!/usr/bin/env python3
"""Geo-scope audit (founder correction 2026-10-02: sit_005 'could happen in any country —
check for mistakes like this'). The test applied to every us/us-state record: is the NEED
US-specific (EIN, DE franchise tax, US-inbound visa), or is only the WRITE-UP US-first while
the need is universal?

FLIPPED to global (write-up-US-first, universal need):
  - sit_005 Recover from a frozen bank account or bank failure — freezes and failures happen
    anywhere; the FDIC is the US instance, now framed as such inside a globally-framed DAG,
    and the per-country deposit-protection schemes (FSCS/EdB/FGDR/DICGC) ride as analog-kind
    flavor notes (already curated in the totality pass).
  - qs_023 Open bank account — every company everywhere opens an account; no US agency or
    court owns the procedure (KYC is universal, the EIN is just the US tax-ID instance, kept
    as the default-flow framing). The four country analogs ride as flavor notes.

KEPT us/us-state (the need or the procedure is genuinely US-bound; analogs mapped as notes):
  - US entities & registries: form_001/011/012, qs_043 (registered-agent industry is US-only),
    qs_044 (the CMRA/USPS-1583 notarized procedure), form_005, qs_045, qs_047, tax_001,
    tax_011, sit_010 (Delaware's own ritual).
  - IRS/US statutes: form_002, tax_002, tax_003, tax_010, fund_003 (409A), hr_012 (ERISA),
    sit_004 (founder call: IRS notice = us).
  - US instruments & stock-plan mechanics: fund_001 (SAFEs), fund_002 (NVCA priced round),
    fund_004/fund_006 (ISO/83(b) grants & conversion), startup_002 (83(b)/stock-purchase
    spine), sit_007 (board-consent + repurchase-window mechanics; notarized-transfer regimes
    abroad are structurally different — the four analogs carry them).
  - USPTO procedure: legal_002, opp_012, sit_009.
  - US people/benefits procedure: qs_063 (state/federal payroll registrations — running
    payroll is already global as hr_002), hr_001 (I-9/W-4), hr_011 (US immigration),
    scale_002 (the US health-insurance benefits regime), opp_002 (1099/W-9 classification).
  - US fund/wind-down procedure: vc_001, vc_002, shutdown_001.
  - Procedure-bound situations (founder's lawsuit judgment applied): sit_001 (demand-letter
    mechanics differ materially per jurisdiction — the German Abmahnung is a contract trap),
    sit_003 (the situation IS the US state-statute map; single-regulator 72h regimes are
    structurally different), sit_008 (the founder's own example), sit_002 (US-inbound by
    definition).
"""
import json

CORPUS = 'processes/corpus.json'


def main():
    with open(CORPUS) as f:
        corpus = json.load(f)
    by_id = {t['id']: t for t in corpus}

    # --- sit_005: globally-framed DAG, FDIC as the US instance, schemes in the geo notes.
    s = by_id['sit_005']
    assert s['geoScope'] == 'us' and s['region'] == 'us'
    s['geoScope'] = 'global'
    del s['region']
    s['description'] = (
        "Whether it's a compliance freeze or your bank failing outright, the clock is payroll "
        "— and that is true in every country. The first hours are confirming what happened, "
        "sizing exposure against your deposit-protection scheme's limit (US: FDIC insurance at "
        "$250,000 per depositor, per bank, per ownership category; the UK/German/French/Indian "
        "schemes and their caps ride in the geo notes), and getting a second operating account "
        "live so the payments that cannot bounce don't. Then the honest fork: a compliance "
        "freeze is a KYC/UBO documents conversation with the bank; a failure is a receivership "
        "you track and claim against for uninsured balances (US: the FDIC's). Re-pointing "
        "banking rails mid-crisis is undoable only at real cost — that's the painful part, "
        "stated."
    )
    nodes = {n['id']: n for n in s['dag']['nodes']}
    nodes['n1']['label'] = ("Confirm what happened: a compliance freeze notice from the bank, "
                            "or the bank itself failing (US: the FDIC failed-bank list; your "
                            "country's resolution authority otherwise)")
    nodes['n2']['label'] = ("Size the exposure: balances against your deposit-protection limit "
                            "(US: FDIC's $250,000 per depositor, per bank, per ownership "
                            "category — other schemes in the geo notes)")
    nodes['n7']['label'] = ("If the bank failed: track the receivership (US: the FDIC's) and "
                            "file the claim for uninsured balances")
    # The curated backup-bank defaults stay US-first (the judged startup-banking arena), but
    # the globally-available rail joins them honestly.
    if 'wise' not in nodes['n4']['vendorOptions']:
        nodes['n4']['vendorOptions'].append('wise')

    # --- qs_023: universal need; the EIN becomes the US framing of the tax-ID detail.
    q = by_id['qs_023']
    assert q['geoScope'] == 'us' and q['region'] == 'us'
    q['geoScope'] = 'global'
    del q['region']
    q['description'] = (
        "Open a business bank account to separate personal and company finances — the first "
        "finance move for a company in any country. The US startup banks run fully-online "
        "applications with day-or-two approvals (the default flow below); the per-country "
        "rails and providers ride in the geo notes. KYC on the founders is universal; the tax "
        "ID the bank asks for is the local one (US: the EIN)."
    )
    qnodes = {n['id']: n for n in q['dag']['nodes']}
    qnodes['n3']['label'] = ("Complete the online application (company details, tax ID — US: "
                             "EIN — and founders)")

    # The flip keeps the four-country analogs as flavor notes — global notes must be analogs.
    for t in (s, q):
        kinds = {n['kind'] for n in t['geoNotes']}
        assert kinds == {'analog'}, (t['id'], kinds)
        assert sorted(n['country'] for n in t['geoNotes']) == ['DE', 'FR', 'IN', 'UK']

    # Re-assert the audit's end state: every remaining us/us-state record is one of the
    # KEPT set above, and totality still holds over it.
    kept = {t['id'] for t in corpus if t.get('geoScope') in ('us', 'us-state')}
    expected = {
        'form_001', 'form_011', 'form_012', 'form_002', 'form_005', 'fund_001', 'fund_002',
        'fund_003', 'fund_004', 'fund_006', 'legal_002', 'tax_001', 'tax_002', 'tax_003',
        'tax_010', 'tax_011', 'qs_043', 'qs_044', 'qs_045', 'qs_047', 'qs_063', 'hr_001',
        'hr_011', 'hr_012', 'scale_002', 'opp_002', 'opp_012', 'startup_002', 'shutdown_001',
        'vc_001', 'vc_002', 'sit_001', 'sit_002', 'sit_003', 'sit_004', 'sit_007', 'sit_008',
        'sit_009', 'sit_010',
    }
    assert kept == expected, kept.symmetric_difference(expected)
    for t in corpus:
        if t['id'] in kept:
            assert sorted(n['country'] for n in t.get('geoNotes', [])) == ['DE', 'FR', 'IN', 'UK'], t['id']

    with open(CORPUS, 'w') as f:
        json.dump(corpus, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print('flipped sit_005 + qs_023 to global; 39 US-scoped records kept, totality intact')


if __name__ == '__main__':
    main()
