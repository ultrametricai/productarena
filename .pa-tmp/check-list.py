#!/usr/bin/env python3
# Check a list of URLs (one per arg or stdin) and print "<code> <url>".
import subprocess
import sys

urls = sys.argv[1:] or [l.strip() for l in sys.stdin if l.strip()]
for url in urls:
    code = subprocess.run(
        ['curl', '-sL', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '20',
         '-A', 'Mozilla/5.0', url],
        capture_output=True, text=True, timeout=40,
    ).stdout.strip()
    print(code, url)
