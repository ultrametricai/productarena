# Founder 2026-10-02 ("Processes link to the open documents"): extend the spike's node-level
# `documents` coverage (form_001 only) to the corpus steps that are genuinely done ON a
# registry document — SAFEs on the SAFE-prep step, the NVCA suite on the definitive-docs step,
# offer letters on the offer-draft step, Form 15620 on the 83(b) signing/filing steps, the
# open NDAs/DPAs/cloud terms on their drafting steps. Only where the document is plainly the
# step's instrument — no forced totality. Idempotent; validates every id against
# documents/registry.json and every (task, node) against processes/corpus.json before writing.
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

MAPPINGS: dict[tuple[str, str], list[str]] = {
    # Raise pre-seed (SAFEs): the SAFE forms ARE the instrument being prepared; the user guide
    # is YC's own companion (its cap-table arithmetic is replayed in lib/openstartup tests).
    ('fund_001', 'n2'): [
        'yc-postmoney-safe-cap',
        'yc-postmoney-safe-discount',
        'yc-postmoney-safe-mfn',
        'yc-safe-user-guide',
    ],
    # Close a priced equity round: YC's term sheet template on the negotiation step; the NVCA
    # model suite on the counsel-drafts-definitives step (counsel's starting documents).
    ('fund_002', 'n1'): ['yc-series-a-term-sheet'],
    ('fund_002', 'n4'): [
        'nvca-certificate-of-incorporation',
        'nvca-stock-purchase-agreement',
        'nvca-investors-rights-agreement',
        'nvca-voting-agreement',
        'nvca-rofr-cosale-agreement',
    ],
    # Set up a data room: Cooley's DD request list is the assemble-the-documents checklist.
    ('fund_005', 'n2'): ['cooley-dd-request-list'],
    # Convert SAFEs: the conversion mechanics (caps, discounts, pro-rata) are the user guide's
    # own worked arithmetic.
    ('fund_006', 'n2'): ['yc-safe-user-guide'],
    # Founder agreement & equity split: the IP-assignment instrument, and Form 15620 on BOTH
    # 83(b) steps (sign, then file — the 30-day window is the form's own clock).
    ('startup_002', 'n2'): ['cooley-ciiaa'],
    ('startup_002', 'n4b'): ['irs-form-15620'],
    ('startup_002', 'n5'): ['irs-form-15620'],
    # Incorporate C-Corp: the Orrick toolkit (charter, bylaws, board/stockholder consents)
    # joins the Cooley package on the bylaws/consents drafting step, and the 83(b) FILING step
    # carries the form its signing step (n8a, spike) already cites.
    ('form_001', 'n6'): ['cooley-incorporation-package-de', 'orrick-incorporation-toolkit'],
    ('form_001', 'n8'): ['irs-form-15620'],
    # Hire first employee: the offer letter being drafted.
    ('hr_001', 'n1'): ['cooley-offer-letter'],
    # Get EIN: the step is literally completing Form SS-4 online.
    ('form_002', 'n3'): ['irs-form-ss4'],
    # Send NDA: the open standard NDAs the template step generates from.
    ('legal_001', 'n2'): ['commonpaper-mutual-nda', 'bonterms-mutual-nda', 'onenda'],
    # Get IP assignments signed: the PIIA/CIIAA form itself.
    ('legal_003', 'n2'): ['cooley-ciiaa'],
    # Publish privacy policy & DPA: the open standard DPAs behind the e-sign flow.
    ('comp_010', 'n4'): ['commonpaper-dpa', 'bonterms-dpa', 'onedpa'],
    # Negotiate SaaS agreement: the open cloud/SaaS terms on the agreement draft; the open ToS
    # standard on the ToS draft.
    ('legal_004', 'n1'): ['commonpaper-csa', 'bonterms-cloud-terms', 'yc-sales-agreement'],
    ('legal_004', 'n2'): ['commonpaper-terms-of-service'],
}

registry = json.loads((ROOT / 'documents/registry.json').read_text())
known = {d['id'] for d in registry['documents']}
for (task, node), ids in MAPPINGS.items():
    unknown = [i for i in ids if i not in known]
    if unknown:
        raise SystemExit(f'{task}/{node}: unknown document ids {unknown}')
    if len(set(ids)) != len(ids):
        raise SystemExit(f'{task}/{node}: duplicate document ids')

corpus_path = ROOT / 'processes/corpus.json'
corpus = json.loads(corpus_path.read_text())
by_task = {t['id']: t for t in corpus}
applied = 0
for (task_id, node_id), ids in MAPPINGS.items():
    task = by_task.get(task_id)
    if task is None:
        raise SystemExit(f'unknown task {task_id}')
    node = next((n for n in task['dag']['nodes'] if n['id'] == node_id), None)
    if node is None:
        raise SystemExit(f'{task_id}: unknown node {node_id}')
    if node.get('documents') != ids:
        node['documents'] = ids
        applied += 1

corpus_path.write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + '\n')
pairs = sum(len(ids) for ids in MAPPINGS.values())
print(f'wired {applied} steps ({len(MAPPINGS)} mapped steps, {pairs} step-document pairs)')
