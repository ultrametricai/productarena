"""Read-only acceptance check for the October 2026 catalog reconciliation.

Unlike check-import.py (which permits arbitrary authored catalog changes), this
opt-in migration check compares the live catalog with fresh committed-source
output, allowing only the documented formation chooser amendment. Do not make
it a general authoring gate: future deliberate catalog authoring needs its own
reviewed preservation contract.
"""
import copy
import hashlib
import json
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()


def parts(items):
    for part in items:
        yield part
        for option in part['options']:
            yield from parts(option['parts'])


def check():
    with tempfile.TemporaryDirectory() as temporary:
        generated_root = Path(temporary)
        subprocess.run([sys.executable, str(ROOT / 'scripts/shared-processes/import.py'), '--write', '--output', temporary], check=True, stdout=subprocess.DEVNULL)
        expected = {path.stem: json.loads(path.read_text()) for path in (generated_root / 'records').glob('*.json')}
        audit = json.loads((generated_root / 'legacy-audit.json').read_text())
    actual = {path.stem: json.loads(path.read_text()) for path in (ROOT / 'content/processes/records').glob('*.json')}
    assert set(actual) == set(expected), 'Record additions/deletions need reconciliation'
    manifest = json.loads((ROOT / 'content/processes/import-manifest.json').read_text())
    assert set(manifest['records']) == set(actual), 'Manifest identity drift'
    assert json.loads((ROOT / 'content/processes/legacy-audit.json').read_text()) == audit, 'Lossless raw source audit drift'
    authored = []
    for key, generated in expected.items():
        record = copy.deepcopy(actual[key])
        revision = record['source']['revision']
        source = json.loads(subprocess.check_output(['git', 'show', f"{revision}:{record['source']['path']}"], cwd=ROOT, text=True))
        raw = next(item for item in source if item['id'] == record['source']['id']) if isinstance(source, list) else source
        assert digest(raw) == record['source']['sha256'], f'{key}: provenance does not describe imported source'
        assert manifest['records'][key]['sourceHash'] == generated['source']['sha256'], f'{key}: source hash drift'
        baseline = copy.deepcopy(generated)
        baseline['source']['revision'] = revision
        if key == 'form_001':
            # PR96 added Clerky after the 38 approved default repairs. Its existing
            # chooser deliberately keeps the base annotations and six candidates
            # at n1, with Clerky as its sole explicit alternative.
            chooser = next(part for part in generated['parts'] if part['id'] == 'n1')
            default = chooser['options'].pop(0)
            assert default['id'] == 'default'
            chooser['references'] = default['references']
            chooser['metadata'] = default['metadata']
            chooser['guidance'] = 'Pick the service that will prepare and file your incorporation paperwork.'
            assert manifest['records'][key]['generatedHash'] == digest(baseline), 'Authored chooser must retain the generated baseline hash'
            assert digest(actual[key]) != manifest['records'][key]['generatedHash'], 'Authored chooser incorrectly blessed as generated'
            authored.append(key + ':n1')
        record['source'].pop('revision')
        generated['source'].pop('revision')
        assert record == generated, f'{key}: source values or authored amendment differ'
    defaults = json.loads((ROOT / 'content/processes/default-options-audit.json').read_text())
    assert len(defaults['entries']) == 38
    for entry in defaults['entries']:
        part = next(p for p in parts(actual[entry['record']]['parts']) if p['id'] == entry['part'])
        assert part['options'][0]['id'] == 'default', f'{entry}: default missing'
        assert [o['id'] for o in part['options'][1:]] == entry['preservedAlternativeIds'], f'{entry}: alternative IDs/order changed'
    counts = Counter()
    def visit(value):
        if isinstance(value, dict):
            for key, item in value.items():
                if key == 'metadata':
                    counts.update(item.keys())
                visit(item)
        elif isinstance(value, list):
            for item in value:
                visit(item)
    for record in actual.values():
        visit(record)
    print(json.dumps({'records': len(actual), 'exactFieldsAndScopesPreserved': True,
                      'authoredAmendments': authored, 'repairedDefaults': 38,
                      'alternativesInRepairAudit': sum(len(e['preservedAlternativeIds']) for e in defaults['entries']),
                      'unresolvedGeographicDownstream': sum(e['geographicDownstreamUnresolved'] for e in defaults['entries']),
                      'metadataOccurrences': dict(sorted(counts.items())),
                      'rawSourceAuditMatches': True, 'allSourceProvenanceVerified': True}, indent=2))


if __name__ == '__main__':
    check()
