#!/bin/sh
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36"
echo "== VPM homepage nav links"
curl -s -L --max-time 20 -A "$UA" https://www.virtualpostmail.com | grep -oE 'href="/[a-z0-9/-]+"' | sort -u | head -40
echo "== VPM developers page links"
curl -s -L --max-time 20 -A "$UA" https://www.virtualpostmail.com/developers/ | grep -oE 'href="[^"]+"' | sort -u | head -40
echo "== Anytime Mailbox nav links"
curl -s -L --max-time 20 -A "$UA" https://www.anytimemailbox.com | grep -oE 'href="[^"#]+"' | sort -u | head -50
echo "== Stable sitemap probe"
curl -s -o /dev/null -w "%{http_code}\n" -L --max-time 20 -A "$UA" https://www.usestable.com/sitemap.xml
echo "== ECM homepage links"
curl -s -L --max-time 20 -A "$UA" https://www.earthclassmail.com | grep -oE 'href="[^"#]+"' | sort -u | head -40
