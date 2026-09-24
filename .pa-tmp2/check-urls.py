#!/usr/bin/env python3
"""Verify candidate depth URLs are live (200) before appending to urls.extra."""
import sys
import urllib.request

def main():
    urls = [line.strip() for line in sys.stdin if line.strip()]
    for u in urls:
        try:
            req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (compatible; ProductArena/1.0; +https://ultrametric.ai/productarena)'})
            r = urllib.request.urlopen(req, timeout=15)
            body = r.read()
            print(r.status, len(body), u)
        except Exception as e:
            print('ERR', str(e)[:80].replace('\n', ' '), u)

if __name__ == '__main__':
    main()
