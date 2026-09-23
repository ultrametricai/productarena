#!/bin/sh
# Roster corpus verification (keyless, read-only HEAD-ish checks)
for u in \
  "https://github.com/twilio/sendgrid-oai" \
  "https://github.com/mailgun/mailgun-mcp-server" \
  "https://github.com/ActiveCampaign/postmark.js" \
  "https://www.twilio.com/docs/sendgrid/api-reference" \
  "https://www.twilio.com/docs/sendgrid/for-developers/sending-email/api-getting-started" \
  "https://www.twilio.com/docs/sendgrid/ui/account-and-settings/how-to-set-up-domain-authentication" \
  "https://www.usestable.com/pricing" \
  "https://docs.usestable.com/reference" \
  "https://www.virtualpostmail.com/pricing" \
  "https://www.earthclassmail.com/pricing" \
  "https://www.anytimemailbox.com/pricing" \
  "https://postmarkapp.com/pricing.txt" \
; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 20 -A "Mozilla/5.0" "$u")
  echo "$code $u"
done
