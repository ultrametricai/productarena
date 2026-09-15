#!/bin/sh
# Verify email-marketing arena URLs resolve (status + final URL).
for u in \
  https://loops.so \
  https://loops.so/docs/api-reference/intro \
  https://loops.so/llms.txt \
  https://loops.so/pricing \
  https://loops.so/agents/mcp \
  https://app.loops.so \
  https://customer.io \
  https://docs.customer.io/api \
  https://customer.io/llms.txt \
  https://docs.customer.io/ai/mcp-server/ \
  https://customer.io/pricing \
  https://fly.customer.io/login \
  https://www.klaviyo.com \
  https://developers.klaviyo.com/en/reference/api_overview \
  https://www.klaviyo.com/llms.txt \
  https://developers.klaviyo.com/en/docs/klaviyo_mcp_server \
  https://www.klaviyo.com/pricing \
  https://mailchimp.com \
  https://mailchimp.com/developer/ \
  https://mailchimp.com/developer/marketing/api/ \
  https://mailchimp.com/pricing/marketing/ \
  https://login.mailchimp.com \
  https://kit.com \
  https://developers.kit.com \
  https://developers.kit.com/llms.txt \
  https://developers.kit.com/mcp/overview \
  https://kit.com/pricing \
  https://app.kit.com \
  https://bentonow.com \
  https://bentonow.com/docs \
  https://bentonow.com/llms.txt \
  https://bentonow.com/docs/integrations/mcp \
  https://bentonow.com/pricing \
  https://app.bentonow.com \
; do
  printf '%-62s ' "$u"
  curl -sIL --max-time 15 -o /dev/null -w '%{http_code} -> %{url_effective}\n' "$u" || echo FAIL
done
