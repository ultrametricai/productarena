#!/usr/bin/env python3
"""Verify www.amd.com candidate pages with a browser UA (the prefetch-amd-crawl.ts
workaround path — amd.com resets/403s the pipeline UA)."""
import sys, urllib.request

UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
for url in sys.argv[1:]:
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            body = r.read(300_000).decode('utf-8', 'replace')
            low = body.lower()
            i = low.find('<title>')
            title = body[i + 7: low.find('</title>', i)][:80].strip() if i >= 0 else '(no title)'
            n9950 = body.count('9950X3D')
            print(f"{r.status} {len(body):>7} | 9950X3D-mentions={n9950} | {title} | {url}")
    except Exception as e:
        print(f"ERR {e} | {url}")
