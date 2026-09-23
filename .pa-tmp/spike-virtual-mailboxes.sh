#!/bin/sh
# Sequential spike passes for virtual-mailboxes (one at a time in-arena), --budget-urls 20.
set -e
cd "$(dirname "$0")/.."
for p in stable virtualpostmail earth-class-mail anytime-mailbox; do
  echo "=== spike virtual-mailboxes/$p"
  pnpm exec tsx pipeline/scripts/spike-engine.ts --process --category virtual-mailboxes --product "$p" --budget-urls 20
done
echo "virtual-mailboxes spikes done"
