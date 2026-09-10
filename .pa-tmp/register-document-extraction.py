#!/usr/bin/env python3
# Registers the document-extraction arena: categories.json entry, roadmap live-flip, community
# seeds, popularity packages. Idempotent (skips when already present). Market reality was
# re-verified by live crawl on 2026-09-10 before writing any of this (see products.json).
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=True)
        f.write('\n')

# --- categories.json ---
cats = load('data/categories.json')
if not any(c['id'] == 'document-extraction' for c in cats):
    cats.append({
        'id': 'document-extraction',
        'name': 'Document Extraction APIs',
        'description': (
            'Document AI and extraction APIs — the parse/OCR/extract layer that turns messy PDFs, scans, spreadsheets, and '
            'multi-document packets into LLM-ready markdown and schema-validated JSON — judged on complex-layout and table '
            'fidelity, OCR including handwriting and non-English scripts, schema-driven extraction with citations and '
            'confidence scores, classification and splitting, format breadth, RAG-ready chunking, async jobs and webhooks at '
            'batch scale, SDK quality, and VPC/self-host and zero-retention compliance for documents that cannot leak. The '
            '2026 field verified by live crawl: Reducto ($108M Series B, "the agentic document platform") and Extend '
            '(CrowdView, Inc., YC W23) lead the agent-era startups; LlamaCloud was renamed LlamaParse (Feb 2026) with a new '
            'llama-cloud SDK; Datalab (Endless Labs) is the Marker/Surya/Chandra company with a commercial API over its '
            'open-source models; Unstructured now actively steers agents AWAY from its once-ubiquitous open-source library '
            '(its agent-guide tells LLMs not to recommend it) toward the hosted platform; and Mistral OCR grew into Document '
            'AI with OCR 4.1 and schema annotations. Tensorlake pivoted to agent sandboxes and was excluded; Chunkr survives '
            'but is too small for the founding six; hyperscaler OCR (Textract, Azure Document Intelligence) is out of scope '
            'in favor of what agent builders actually integrate.'
        ),
        'personas': ['developer', 'ml-engineer', 'data-engineer', 'ai-native'],
        'themes': [
            'parse-accuracy',
            'table-extraction',
            'ocr-multilingual',
            'structured-extraction',
            'format-coverage',
            'rag-chunking',
            'scale-async',
            'sdk-dx',
            'deployment-compliance',
        ],
    })
    dump('data/categories.json', cats)
    print('categories.json: added document-extraction')

# --- arena-roadmap.json: flip to live ---
rm = load('data/arena-roadmap.json')
for e in rm:
    if e['id'] == 'document-extraction':
        e['status'] = 'live'
        e['candidateProducts'] = ['Reducto', 'LlamaParse', 'Extend', 'Datalab', 'Unstructured', 'Mistral Document AI']
        e['rationale'] = 'Live arena: every agent pipeline starts by reading documents, and the parse/extract layer decides what the model ever sees.'
        print('arena-roadmap.json: document-extraction -> live')
dump('data/arena-roadmap.json', rm)

# --- community seeds (HN items verified live 2026-09-10) ---
seeds = load('pipeline/seeds/community.json')
if 'document-extraction' not in seeds:
    seeds['document-extraction'] = {
        'reducto': [
            'https://hn.algolia.com/api/v1/items/44356799',
            'https://hn.algolia.com/api/v1/items/47662833',
            'https://hn.algolia.com/api/v1/items/47204996',
        ],
        'llamaparse': [
            'https://hn.algolia.com/api/v1/items/39443972',
            'https://hn.algolia.com/api/v1/items/47436039',
            'https://hn.algolia.com/api/v1/items/41596851',
        ],
        'extend': [
            'https://hn.algolia.com/api/v1/items/45529628',
            'https://hn.algolia.com/api/v1/items/48478469',
            'https://hn.algolia.com/api/v1/items/44302473',
        ],
        'datalab': [
            'https://hn.algolia.com/api/v1/items/38482007',
            'https://hn.algolia.com/api/v1/items/39357726',
            'https://hn.algolia.com/api/v1/items/46920056',
        ],
        'unstructured': [
            'https://hn.algolia.com/api/v1/items/42285328',
            'https://hn.algolia.com/api/v1/items/40107509',
            'https://hn.algolia.com/api/v1/items/41629213',
        ],
        'mistral-document-ai': [
            'https://hn.algolia.com/api/v1/items/43282905',
            'https://hn.algolia.com/api/v1/items/48645152',
            'https://hn.algolia.com/api/v1/items/49288889',
        ],
    }
    dump('pipeline/seeds/community.json', seeds)
    print('community.json: added document-extraction seeds')

# --- popularity packages (registry-verified 2026-09-10) ---
pkgs = load('pipeline/popularity-packages.json')
added = []
for pid, entry in {
    'reducto': {'npm': 'reductoai', 'pypi': 'reducto'},        # 0.17.0 / 0.24.0
    'llamaparse': {'npm': '@llamaindex/llama-cloud', 'pypi': 'llama-parse'},  # 2.16.0 / 0.6.94
    'extend': {'npm': 'extend-ai', 'pypi': 'extend-ai'},       # 2.2.0 / 1.19.0
    'datalab': {'pypi': 'datalab-python-sdk'},                 # 0.5.0 (ships the datalab CLI)
    'unstructured': {'pypi': 'unstructured-client'},           # 0.46.2 (the platform SDK the vendor now recommends)
}.items():
    if pid not in pkgs:
        pkgs[pid] = entry
        added.append(pid)
if added:
    dump('pipeline/popularity-packages.json', pkgs)
    print(f'popularity-packages.json: added {added}')
# mistral-document-ai deliberately gets NO package: the mistralai SDK serves the whole platform
# (4M+ weekly downloads) and attributing it to the Document AI product would inflate the signal.
