#!/usr/bin/env python3
"""Verify all target-arena queue entries were spiked today."""
import json

q = json.load(open('data/spike-queue.json'))
arenas = {'identity-verification', 'tax-automation', 'processors', 'banking-as-a-service',
          'card-issuing', 'email-marketing', 'stablecoin-payments', 'fraud-prevention',
          'billing-subscriptions'}
stale = [f"{e['arena']}/{e['productId']} last={e['lastSpiked']} status={e['status']}"
         for e in q['queue'] if e['arena'] in arenas
         and (not e['lastSpiked'] or e['lastSpiked'] < '2026-09-23')]
print('not spiked this run:', stale if stale else 'NONE - all 53 updated')
