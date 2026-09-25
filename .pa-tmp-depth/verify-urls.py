#!/usr/bin/env python3
"""Verify candidate depth URLs: status, size, and title/first-line, using the pipeline UA."""
import sys, urllib.request

UA = 'Mozilla/5.0 (compatible; ProductArena/1.0; +https://ultrametric.ai/productarena)'

def check(url: str) -> None:
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read(200_000).decode('utf-8', 'replace')
            status = r.status
    except Exception as e:
        print(f"ERR  {e} | {url}")
        return
    title = ''
    low = body.lower()
    i = low.find('<title>')
    if i >= 0:
        title = body[i + 7: low.find('</title>', i)][:80].strip()
    else:
        title = body.strip().splitlines()[0][:80] if body.strip() else '(empty)'
    print(f"{status} {len(body):>7} | {title} | {url}")

for u in sys.argv[1:] or [l.strip() for l in sys.stdin if l.strip()]:
    check(u)
