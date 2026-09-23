#!/bin/sh
for u in \
  "https://www.anytimemailbox.com/plans" \
  "https://www.anytimemailbox.com/faq" \
  "https://www.travelingmailbox.com" \
  "https://www.travelingmailbox.com/pricing/" \
  "https://www.postscanmail.com" \
  "https://www.postscanmail.com/pricing" \
  "https://www.postscanmail.com/developers" \
  "https://api.postscanmail.com" \
  "https://www.virtualpostmail.com/developers/docs" \
  "https://www.virtualpostmail.com/products/virtual-mailbox" \
  "https://www.virtualpostmail.com/products/virtual-business-address" \
  "https://www.usestable.com/products/virtual-address" \
  "https://www.usestable.com/products/virtual-mailbox" \
  "https://www.earthclassmail.com/how-it-works" \
  "https://www.earthclassmail.com/features" \
; do
  code=$(curl -s -o /dev/null -w "%{http_code} %{url_effective}" -L --max-time 20 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36" "$u")
  echo "$code <- $u"
done
