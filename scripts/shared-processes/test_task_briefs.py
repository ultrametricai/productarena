"""Exercise importer preservation using the complete authored catalog in isolation."""
import hashlib
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


class TaskBriefImportTests(unittest.TestCase):
    def test_preserved_copy_and_provider_bindings_reject_unreviewed_changes(self):
        spec = importlib.util.spec_from_file_location(
            "task_brief_check", ROOT / "scripts/shared-processes/check-task-briefs.py")
        checker = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(checker)
        for target in ("description", "provider"):
            with self.subTest(target=target), tempfile.TemporaryDirectory() as directory:
                work = Path(directory)
                checker.RECORDS = work / "records"
                checker.AUDIT_DIR = work / "audit"
                shutil.copytree(ROOT / "content/processes/records", checker.RECORDS)
                shutil.copytree(ROOT / "docs/catalog-task-briefs", checker.AUDIT_DIR)
                path = checker.RECORDS / "form_001.json"
                record = json.loads(path.read_text())
                if target == "description":
                    part = next(p for p in record["parts"] if p["id"] == "n3")
                    part["guidance"] += " Unreviewed change."
                    audit_path = checker.AUDIT_DIR / "audit.json"
                    audit = json.loads(audit_path.read_text())
                    item = next(i for i in audit["items"] if i["recordId"] == "form_001"
                                and i["partId"] == "n3" and i["field"] == "guidance")
                    # Updating the ordinary audit cannot silently bless changed retained copy.
                    item["contentHash"] = checker.digest(part["guidance"])
                    item["wordCount"] = len(part["guidance"].split())
                    audit_path.write_text(json.dumps(audit))
                    error = "Preserved brief changed"
                else:
                    part = next(p for p in record["parts"] if p["id"] == "n8")
                    part["metadata"]["previewBriefs"][0]["guidance"] += " Unreviewed change."
                    error = "previewBriefs"
                path.write_text(json.dumps(record))
                with self.assertRaisesRegex(AssertionError, error):
                    checker.main()

    def test_full_catalog_is_idempotent_and_all_authored_source_changes_conflict(self):
        audit = json.loads((ROOT / "docs/catalog-task-briefs/audit.json").read_text())
        authored_ids = {i["recordId"] for i in audit["items"]}
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            shutil.copytree(ROOT / "scripts/shared-processes", work / "scripts/shared-processes")
            shutil.copytree(ROOT / "content/processes", work / "content/processes")
            for name in ("processes/corpus.json", "processes/vendor-registry.json", "journeys/chains.json"):
                dest = work / name
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / name, dest)
            shutil.copytree(ROOT / "processes/equity", work / "processes/equity")

            def git(*args):
                subprocess.run(["git", *args], cwd=work, check=True, capture_output=True)

            def commit():
                git("add", "processes", "journeys")
                git("-c", "user.name=Test", "-c", "user.email=test@example.invalid",
                    "-c", "commit.gpgsign=false", "commit", "-qm", "Isolated importer fixture")

            def snapshot():
                return {str(p.relative_to(work)): hashlib.sha256(p.read_bytes()).hexdigest()
                        for p in (work / "content/processes").rglob("*.json")}

            def run_import():
                return subprocess.run([sys.executable, str(work / "scripts/shared-processes/import.py"),
                                       "--write"], cwd=work, capture_output=True, text=True)

            git("init", "-q")
            commit()
            before = snapshot()
            for _ in range(2):
                result = run_import()
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(json.loads(result.stdout)["changedRecords"], [])
                self.assertEqual(snapshot(), before, "Unchanged-source import changed catalog bytes")

            # Commit independent source edits for every authored record, including
            # chain references and equity workflows, without editing the catalog.
            for name, field in (("processes/corpus.json", "description"),
                                ("journeys/chains.json", "tagline")):
                path = work / name
                records = json.loads(path.read_text())
                for record in records:
                    if record["id"] in authored_ids:
                        record[field] += " Synthetic source change for conflict protection."
                path.write_text(json.dumps(records))
            for path in (work / "processes/equity").rglob("*.json"):
                record = json.loads(path.read_text())
                if record["id"] in authored_ids:
                    record["summary"] += " Synthetic source change for conflict protection."
                    path.write_text(json.dumps(record))
            commit()
            result = run_import()
            self.assertNotEqual(result.returncode, 0, "Source changes silently replaced authored content")
            report = json.loads(result.stderr)
            self.assertEqual(set(report["editedRecordsWithSourceChanges"]), authored_ids)
            self.assertEqual(snapshot(), before, "Conflict wrote part of the catalog")


if __name__ == "__main__":
    unittest.main()
