#!/usr/bin/env python3
"""Shared-catalog reconcile, wave 3 (the 2026-10-02 reconcile precedent): qs_023's committed
import-manifest generatedHash predates the committed record file (a stale blessing left by an
earlier reconcile — invisible to shared:check while the corpus source was unchanged, surfaced
now that the scope-audit flip changed qs_023's sourceHash). The committed record's CONTENT is
byte-equal to a fresh generation outside the source stamp — i.e. NOT authored — so the honest
fix is to re-bless the manifest at the committed file's digest and let `shared:import --write`
regenerate it from the new corpus. Authored content elsewhere (form_001) is untouched: its
source didn't change, so the importer skips it by hash."""
import hashlib
import json
from pathlib import Path

MANIFEST = Path('content/processes/import-manifest.json')
RECORD = Path('content/processes/records/qs_023.json')


def digest(value):
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()
    ).hexdigest()


record = json.loads(RECORD.read_text())
manifest = json.loads(MANIFEST.read_text())
entry = manifest['records']['qs_023']
old = entry['generatedHash']
entry['generatedHash'] = digest(record)
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(f"re-blessed qs_023 generatedHash {old[:12]} -> {entry['generatedHash'][:12]}")
