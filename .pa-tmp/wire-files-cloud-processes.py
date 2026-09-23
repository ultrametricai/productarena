#!/usr/bin/env python3
# Launch-day process wiring for the cloud-storage / cloud-platforms arenas: the steps whose
# FUNCTION is "choose/use file storage" or "choose/use a cloud platform" get optionsArenaId
# pointing at the new arenas. The dropbox/google_drive/aws chips themselves light up via the
# VENDOR_ARENA mappings in lib/processes.ts. Deliberate non-changes, for honesty:
# - prod_002 (CI/CD on GitHub+Vercel): no cloud-platform function in any node — untouched.
# - comp_011/n2 (minutes template in notion/google_drive): the function is a document template,
#   not storage hosting; the chips already resolve via VENDOR_ARENA.
# - scale_010/n6 (metabase), scale_005/n5 + fin_010/n4 (google_slides), qs_050/n3
#   (google_sheets): no honest arena fit (see commit message) — left as chips.
# Idempotent.
import json

with open('data/processes.json') as f:
    tasks = json.load(f)

by_id = {t['id']: t for t in tasks}

def node(tid, nid):
    return next(n for n in by_id[tid]['dag']['nodes'] if n['id'] == nid)

changes = []

def set_arena(tid, nid, arena):
    n = node(tid, nid)
    if n.get('optionsArenaId') != arena:
        n['optionsArenaId'] = arena
        changes.append(f'{tid}/{nid}: optionsArenaId={arena}')

# cloud-storage: the choose-storage / data-room / archive steps.
set_arena('qs_015', 'n1', 'cloud-storage')       # "Choose storage provider"
set_arena('fund_005', 'n1', 'cloud-storage')     # "Choose where to host the data room"
set_arena('fund_002', 'n2', 'cloud-storage')     # "Refresh the data room for diligence" (notion stays a tracked cross-arena extra)
set_arena('comp_011', 'n5', 'cloud-storage')     # "File signed minutes in the data room"
set_arena('shutdown_001', 'n12', 'cloud-storage')  # "Archive corporate records for retention"

# cloud-platforms: the account-creation step is where the cloud is chosen; the rest of
# prod_001's AWS nodes keep their canonical vendor chip (now tracked + ranked via VENDOR_ARENA).
set_arena('prod_001', 'n2', 'cloud-platforms')   # "Create AWS account + billing"

with open('data/processes.json', 'w') as f:
    json.dump(tasks, f, indent=1, ensure_ascii=False)
    f.write('\n')
print('\n'.join(changes) or 'no changes')
