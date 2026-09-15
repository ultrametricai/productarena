#!/bin/sh
for u in \
  https://loops.so/docs \
  https://loops.so/agents \
  https://docs.customer.io \
  https://docs.customer.io/journeys/ \
  https://docs.customer.io/integrations/api/track/ \
  https://developers.klaviyo.com \
  https://developers.klaviyo.com/en/reference/create_campaign \
  https://mailchimp.com/developer/transactional/api/ \
  https://developers.kit.com/api-reference/overview \
  https://developers.kit.com/api-reference/broadcasts/create-a-broadcast \
  https://bentonow.com/docs/events_api \
  https://bentonow.com/docs/subscribers \
  https://bentonow.com/docs/operations/transactional-email \
  https://customer.io/features/email \
  https://www.klaviyo.com/products/email-marketing \
  https://mailchimp.com/features/email-marketing-automation/ \
  https://kit.com/features/email-marketing \
  https://bentonow.com/emails \
; do
  printf '%-72s ' "$u"
  curl -sIL --max-time 15 -o /dev/null -w '%{http_code} -> %{url_effective}\n' "$u" || echo FAIL
done
