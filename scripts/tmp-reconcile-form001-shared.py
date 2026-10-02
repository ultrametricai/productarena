# Founder 2026-10-02 (step-documents wiring): form_001's shared record is one of the AUTHORED
# records (manifest re-blessed 2026-10-02, 'geo-filter merge integration' commit) — the plain
# `shared:import --write` regeneration clobbers its authored decision structure (the n1
# formation-service options with guidance and vendor candidates the preview reader tests pin).
# This script reconciles instead: restore the authored record, apply ONLY the corpus delta
# (documents on n6 and n8), and re-bless the manifest's generatedHash — the same precedent the
# 2026-10-02 geo-filter reconciliation set. Authored content untouched otherwise.
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECORD = ROOT / 'content/processes/records/form_001.json'
MANIFEST = ROOT / 'content/processes/import-manifest.json'
AUTHORED_REV = '1c1e7885b'  # last commit before the regeneration


def digest(value):
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()
    ).hexdigest()


# 1. Restore the authored record.
authored = subprocess.run(
    ['git', 'show', f'{AUTHORED_REV}:content/processes/records/form_001.json'],
    cwd=ROOT, capture_output=True, text=True, check=True,
).stdout
record = json.loads(authored)

# 2. Apply the corpus delta into the authored structure (documents live on part.metadata).
by_id = {p['id']: p for p in record['parts']}
by_id['n6']['metadata']['documents'] = ['cooley-incorporation-package-de', 'orrick-incorporation-toolkit']
by_id['n8']['metadata']['documents'] = ['irs-form-15620']

# 3. Carry the regenerated source stamp (the corpus DID change) onto the authored record.
regenerated = json.loads(RECORD.read_text())
record['source'] = regenerated['source']

RECORD.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')

# 4. Re-bless the manifest: keep the new sourceHash, point generatedHash at the reconciled file.
manifest = json.loads(MANIFEST.read_text())
entry = manifest['records']['form_001']
entry['generatedHash'] = digest(record)
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print('reconciled form_001; generatedHash', entry['generatedHash'][:12])
