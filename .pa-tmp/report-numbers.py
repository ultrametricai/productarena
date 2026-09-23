import json
import os

tot_e = 0
for a in ('cloud-storage', 'cloud-platforms'):
    print('==', a)
    for f in sorted(os.listdir(f'data/{a}/evidence')):
        d = json.load(open(f'data/{a}/evidence/{f}'))
        n = len(d) if isinstance(d, list) else len(d.get('evidence', []))
        tot_e += n
        print('  ', f, n)
    idx = json.load(open(f'data/{a}/proofs/index.json'))
    print('   proofs recorded:', len(idx))
print('total evidence:', tot_e)

keys = {'dropbox', 'google_drive', 'box', 'onedrive', 'aws', 'google_cloud', 'azure', 'oracle_cloud'}
t = json.load(open('data/processes.json'))
lit = []
for task in t:
    for n in task['dag']['nodes']:
        vs = {n.get('vendor')} | set(n.get('vendorOptions') or [])
        if vs & keys:
            lit.append((task['id'], n['id']))
print('steps with newly tracked chips:', len(lit), sorted(set(x[0] for x in lit)))

m = json.load(open('data/process-step-stories.json'))
txt = json.dumps(m)
print('step-story file mentions cloud-storage:', txt.count('cloud-storage'), 'cloud-platforms:', txt.count('cloud-platforms'))
