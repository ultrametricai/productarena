#!/usr/bin/env python3
# Verifier for append-docs-evidence-A.py: every double-quoted span in each excerpt must
# appear verbatim in the cache file whose first line names the item's url (falling back to
# any cache file for that product, reported separately). Matching normalizes the crawler's
# markdown escaping only: backslashes, backticks, and asterisks are stripped and whitespace
# is collapsed on BOTH sides, so the words/punctuation themselves must match exactly.
import importlib.util
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / 'pipeline' / 'cache' / 'crawl' / 'agentic-commerce'

spec = importlib.util.spec_from_file_location(
    'appendmod_a', pathlib.Path(__file__).parent / 'append-docs-evidence-A.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def norm(s):
    s = s.replace('\\', '').replace('`', '').replace('*', '')
    return re.sub(r'\s+', ' ', s)


failures = 0
elsewhere = 0
checked = 0
for product, items in mod.ITEMS.items():
    files = {}
    for p in sorted((CACHE / product).glob('*.md')):
        text = p.read_text()
        m = re.match(r'<!-- source: (\S+) -->', text.splitlines()[0])
        files[p.name] = (m.group(1) if m else '', norm(text))
    all_text = '\n'.join(t for _, t in files.values())
    for item in items:
        src_texts = [t for (u, t) in files.values() if u == item['url']]
        for q in re.findall(r'"([^"]+)"', item['excerpt']):
            checked += 1
            nq = norm(q)
            if any(nq in t for t in src_texts):
                continue
            if nq in all_text:
                elsewhere += 1
                print(f'WARN [FOUND-ELSEWHERE-ONLY] {item["id"]}: {q[:100]!r}')
            else:
                failures += 1
                print(f'FAIL [NOT-FOUND-ANYWHERE] {item["id"]}: {q[:100]!r}')
print(f'{checked} quotes checked, {failures} hard failures, {elsewhere} found-elsewhere warnings')
sys.exit(1 if failures else 0)
