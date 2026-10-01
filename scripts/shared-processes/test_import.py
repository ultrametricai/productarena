import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent

class ImportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / 'scripts/shared-processes').mkdir(parents=True)
        (self.root / 'processes').mkdir()
        (self.root / 'journeys').mkdir()
        for name in ('import.py', 'claim_audit.py'):
            shutil.copy(SCRIPT / name, self.root / 'scripts/shared-processes' / name)
        self.source = self.root / 'processes/corpus.json'
        self.records = [{'id': key, 'title': key, 'description': 'Synthetic source', 'dag': {'nodes': [], 'edges': []}} for key in ('alpha', 'beta')]
        self.source.write_text(json.dumps(self.records))
        (self.root / 'journeys/chains.json').write_text('[]')
        (self.root / 'processes/vendor-registry.json').write_text('{"vendors":{}}')
        subprocess.run(['git', 'init', '-q'], cwd=self.root, check=True)
        subprocess.run(['git', '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-qm', 'Synthetic fixture'], cwd=self.root, check=True)
        self.run_import('--write', expected=0)

    def tearDown(self):
        self.temp.cleanup()

    def run_import(self, *args, expected):
        result = subprocess.run(['python3', str(self.root / 'scripts/shared-processes/import.py'), *args], capture_output=True, text=True)
        self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
        return result

    def test_preserves_authored_edits_and_stops_before_any_conflicting_write(self):
        target = self.root / 'content/processes/records/alpha.json'
        value = json.loads(target.read_text())
        value['notes'] = [{'text': 'Authored note'}]
        target.write_text(json.dumps(value))
        self.run_import('--write', expected=0)
        self.assertEqual(json.loads(target.read_text())['notes'], value['notes'])
        before = {str(p): p.read_bytes() for p in (self.root / 'content/processes').rglob('*.json')}
        self.records[0]['description'] = 'Changed source'
        self.records[1]['description'] = 'Another changed source'
        self.source.write_text(json.dumps(self.records))
        self.run_import('--write', expected=1)
        self.assertEqual({str(p): p.read_bytes() for p in (self.root / 'content/processes').rglob('*.json')}, before)

    def test_reports_drift_then_updates_an_unedited_generated_record(self):
        self.records[0]['description'] = 'Changed source'
        self.source.write_text(json.dumps(self.records))
        self.run_import(expected=1)
        self.run_import('--write', expected=0)
        target = self.root / 'content/processes/records/alpha.json'
        self.assertEqual(json.loads(target.read_text())['summary'], 'Changed source')
        self.run_import(expected=0)

if __name__ == '__main__':
    unittest.main()
