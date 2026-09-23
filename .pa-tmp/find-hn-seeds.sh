#!/bin/sh
# Keyless HN Algolia search for community seeds — top stories per product.
q() {
  echo "### $1"
  curl -s --max-time 20 "https://hn.algolia.com/api/v1/search?query=$2&tags=story&hitsPerPage=6&numericFilters=points%3E40" \
    | python3 -c "
import json,sys
d=json.load(sys.stdin)
for h in d.get('hits',[]):
    print(h['objectID'], h.get('points'), (h.get('title') or '')[:90], h.get('created_at','')[:10])
"
}
q sendgrid "sendgrid"
q resend "resend.com"
q resend2 "resend%20email"
q postmark "postmark"
q mailgun "mailgun"
q ses "amazon%20ses"
q stable "usestable"
q stable2 "stable%20virtual%20address"
q ecm "earth%20class%20mail"
q vpm "virtualpostmail"
q vpm2 "virtual%20mailbox"
q anytime "anytime%20mailbox"
q gmail_api "gmail%20api"
q gmail "gmail"
