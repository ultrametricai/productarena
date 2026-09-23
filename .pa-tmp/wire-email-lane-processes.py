#!/usr/bin/env python3
# Process wiring for the launch-day email lane:
# - growth_005 SendGrid steps get optionsArenaId email-apis (+ curated vendorOptions, required
#   non-empty by lib/__tests__/processes.test.ts:~370) — the opp_011 n2 precedent.
# - qs_044 n1 (choose mailing address provider) gets optionsArenaId virtual-mailboxes; its
#   three chips are now arena-tracked.
# - gmail-vendor nodes drop "email" from extraOptionArenas: with gmail in VENDOR_ARENA their
#   covering arena IS email now, and extras must never equal the covering arena.
import json

with open('data/processes.json') as f:
    tasks = json.load(f)

by_id = {t['id']: t for t in tasks}
changed = []

g5 = by_id['growth_005']
for n in g5['dag']['nodes']:
    if n.get('vendor') == 'sendgrid' and 'optionsArenaId' not in n:
        n['optionsArenaId'] = 'email-apis'
        if not n.get('vendorOptions'):
            n['vendorOptions'] = ['sendgrid']
        changed.append(f"growth_005/{n['id']}: optionsArenaId=email-apis")

q44 = by_id['qs_044']
for n in q44['dag']['nodes']:
    if n.get('vendorOptions') == ['stable', 'earth_class_mail', 'virtualpostmail'] and 'optionsArenaId' not in n:
        n['optionsArenaId'] = 'virtual-mailboxes'
        changed.append(f"qs_044/{n['id']}: optionsArenaId=virtual-mailboxes")

for t in tasks:
    for n in t['dag']['nodes']:
        if n.get('vendor') == 'gmail' and 'email' in (n.get('extraOptionArenas') or []):
            n['extraOptionArenas'] = [a for a in n['extraOptionArenas'] if a != 'email']
            # extraOptionRefs point at specific products in OTHER arenas (ai-assistants,
            # team-chat) — they are independent of the arenas list and stay.
            if not n['extraOptionArenas']:
                del n['extraOptionArenas']
            changed.append(f"{t['id']}/{n['id']}: extraOptionArenas -= email (now covering)")

with open('data/processes.json', 'w') as f:
    json.dump(tasks, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('\n'.join(changed))
print(f'{len(changed)} nodes changed')
