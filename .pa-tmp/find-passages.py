#!/usr/bin/env python3
# Helper: locate verbatim passages in the crawled cache for the docs-evidence append.
# Usage: python3 .pa-tmp/find-passages.py <product> <regex> [context_chars]
import os, re, sys

base = 'pipeline/cache/crawl/frontier-models'
pid, pattern = sys.argv[1], sys.argv[2]
ctx = int(sys.argv[3]) if len(sys.argv) > 3 else 220
rx = re.compile(pattern, re.I)
for f in sorted(os.listdir(os.path.join(base, pid))):
    text = open(os.path.join(base, pid, f)).read()
    src = text.split('\n', 1)[0]
    for m in rx.finditer(text):
        s = max(0, m.start() - 40)
        frag = text[s:m.start() + ctx].replace('\n', ' ')
        print(f'--- {f} {src[len("<!-- source: "):-4] if src.startswith("<!--") else ""}')
        print(f'    {frag}')
        break  # first hit per file
