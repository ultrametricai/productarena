import json
tasks = json.load(open('data/processes.json'))
targets = {'dropbox','google_drive','aws','google_slides','google_sheets','metabase','box','onedrive','google_cloud','azure','gcp','oracle','oracle_cloud','ibm_cloud'}
for t in tasks:
    for n in t['dag']['nodes']:
        vs = set()
        if n.get('vendor') in targets: vs.add(n['vendor'])
        for v in (n.get('vendorOptions') or []):
            if v in targets: vs.add(v)
        if vs:
            print(t['id'], n['id'], sorted(vs), '| vendor=', n.get('vendor'), '| arena=', n.get('optionsArenaId'), '| extra=', n.get('extraOptionArenas'), '|', n.get('label','')[:70])
