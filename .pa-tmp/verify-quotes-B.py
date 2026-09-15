#!/usr/bin/env python3
# Verifier for append-docs-evidence-B.py: every double-quoted span in each excerpt
# must appear verbatim in the cache file whose first line names the item's url
# (falling back to any cache file for that product).
import importlib.util
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / 'pipeline' / 'cache' / 'crawl' / 'agentic-commerce'

spec = importlib.util.spec_from_file_location('appendmod', pathlib.Path(__file__).parent / 'append-docs-evidence-B.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

failures = 0
checked = 0
for product, items in mod.ITEMS.items():
    files = {}
    for p in sorted((CACHE / product).glob('*.md')):
        text = p.read_text()
        first = text.splitlines()[0]
        m = re.match(r'<!-- source: (\S+) -->', first)
        files[p.name] = (m.group(1) if m else '', text)
    all_text = '\n'.join(t for _, t in files.values())
    for item in items:
        url = item['url']
        src_texts = [t for (u, t) in files.values() if u == url]
        quotes = re.findall(r'"([^"]+)"', item['excerpt'])
        for q in quotes:
            checked += 1
            in_src = any(q in t for t in src_texts)
            in_any = q in all_text
            if not in_src:
                failures += 1
                where = 'FOUND-ELSEWHERE-ONLY' if in_any else 'NOT-FOUND-ANYWHERE'
                print(f'FAIL [{where}] {item["id"]}: {q[:110]!r}')
print(f'{checked} quotes checked, {failures} failures')
sys.exit(1 if failures else 0)
