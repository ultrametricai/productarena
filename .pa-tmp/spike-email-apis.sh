#!/bin/sh
# Sequential spike passes, one product at a time (never two spikes in one arena concurrently),
# --budget-urls 20 per the launch-day lane brief. Exit on first failure.
set -e
cd "$(dirname "$0")/.."
for p in sendgrid resend postmark mailgun amazon-ses; do
  echo "=== spike email-apis/$p"
  pnpm exec tsx pipeline/scripts/spike-engine.ts --process --category email-apis --product "$p" --budget-urls 20
done
echo "email-apis spikes done"
