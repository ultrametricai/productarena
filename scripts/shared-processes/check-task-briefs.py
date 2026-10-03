"""Audit the bounded task-brief edit against its recorded git baseline.

This checks coverage and preservation, not factual truth or legal readiness.
Run after the ordinary schema/catalog check. The audit remains an editorial
artifact; it is not an instruction-execution or applicability contract.
"""
import collections
import copy
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RECORDS = ROOT / "content/processes/records"
AUDIT_DIR = ROOT / "docs/catalog-task-briefs"


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(",", ":")).encode()).hexdigest()


def at_commit(commit, path):
    return json.loads(subprocess.check_output(
        ["git", "show", f"{commit}:{path}"], cwd=ROOT, text=True))


def slots(record):
    result = {}

    def walk(parts, parents):
        for part in parts:
            key = (record["id"], parents, part["id"], "", "guidance")
            result[key] = part
            for option in part["options"]:
                key = (record["id"], parents, part["id"], option["id"], "summary")
                result[key] = option
                walk(option["parts"], parents + ((part["id"], option["id"]),))

    walk(record["parts"], ())
    return result


def item_key(item):
    parents = tuple((p["partId"], p["optionId"]) for p in item["parentOptionPath"])
    return (item["recordId"], parents, item["partId"], item.get("optionId", ""), item["field"])


def check_references(old, new, key):
    # Previously curated references retain exact content and ordering.
    assert new[:len(old)] == old, f"Altered existing reference: {key}"
    for ref in new[len(old):]:
        assert ref["kind"] == "url", f"Added non-source reference: {key}"
        assert ref["role"] == "authored-guidance-source", key
        assert ref["url"].startswith("https://"), key
        assert ref.get("description") is None, key


def main():
    audit = json.loads((AUDIT_DIR / "audit.json").read_text())
    base_commit = audit["baseCommit"]
    baseline = {p.stem: at_commit(base_commit, f"content/processes/records/{p.name}")
                for p in sorted(RECORDS.glob("*.json"))}
    current = {p.stem: json.loads(p.read_text()) for p in sorted(RECORDS.glob("*.json"))}
    expected_ids = set(subprocess.check_output(
        ["git", "ls-tree", "--name-only", f"{base_commit}:content/processes/records"],
        cwd=ROOT, text=True).splitlines())
    assert {p.name for p in RECORDS.glob("*.json")} == expected_ids, "Record added or removed"
    corpus = at_commit(base_commit, "processes/corpus.json")
    excluded = {r["id"] for r in corpus if r.get("kind") == "situation"}
    target_ids = set(baseline) - excluded
    old_slots = {key: value for rid in target_ids for key, value in slots(baseline[rid]).items()}
    new_slots = {key: value for rid in target_ids for key, value in slots(current[rid]).items()}
    audited = {item_key(i): i for i in audit["items"]}
    assert len(audited) == len(audit["items"]), "Duplicate audit target"
    assert set(audited) == set(old_slots) == set(new_slots), "Missing/extra target"
    for rid in excluded:
        assert current[rid] == baseline[rid], f"Excluded situation changed: {rid}"

    preservation = json.loads((AUDIT_DIR / "preservation-baseline.json").read_text())
    preserved = {item_key(i): i for i in preservation["items"]}
    assert len(preserved) == len(preservation["items"]), "Duplicate preserved target"
    assert set(preserved) == {key for key, item in audited.items() if item["status"] == "preserved"}, (
        "Preserved target set changed")
    texts = collections.defaultdict(list)
    statuses = collections.Counter()
    for key, entry in audited.items():
        old, new = old_slots[key], new_slots[key]
        field = key[-1]
        text = new[field]
        assert isinstance(text, str) and text.strip(), f"Empty brief: {key}"
        assert entry["contentHash"] == digest(text), f"Audit prose mismatch: {key}"
        assert entry["wordCount"] == len(text.split()), key
        assert entry["status"] in {"authored", "preserved", "needs_review"}, key
        assert bool(entry["reviewGaps"]) == (entry["status"] == "needs_review"), key
        if entry["status"] == "preserved":
            assert digest(text) == preserved[key]["contentHash"], f"Preserved brief changed: {key}"
            if key[0] != "form_001":
                assert text == old[field], f"Existing brief changed: {key}"
        assert not re.search(r"\b(?:TODO|TBD|lorem ipsum)\b", text), key
        check_references(old["references"], new["references"], key)
        texts[re.sub(r"\s+", " ", text).strip()].append(key)
        statuses[entry["status"]] += 1

    duplicates = [keys for keys in texts.values() if len(keys) > 1]
    assert not duplicates, f"Duplicate descriptions: {duplicates}"
    # Strip only the explicitly allowed fields, then compare entire records.
    # This includes source provenance, graph/order, IDs, scores, costs, timing,
    # method metadata, notes, titles, summaries at record level and all references.
    for rid in target_ids:
        before, after = copy.deepcopy(baseline[rid]), copy.deepcopy(current[rid])
        a, b = slots(before), slots(after)
        for key in a:
            b[key][key[-1]] = a[key][key[-1]]
            b[key]["references"] = a[key]["references"]
            if rid == "form_001" and key[-1] == "guidance":
                for name in ("previewContext", "previewBriefs"):
                    expected = preservation["incorporationMetadata"].get(key[2], {}).get(name)
                    assert b[key]["metadata"].get(name) == expected, (key, name)
                    b[key]["metadata"].pop(name, None)
                    if name in a[key]["metadata"]:
                        b[key]["metadata"][name] = a[key]["metadata"][name]
        assert before == after, f"Change outside authored fields: {rid}"

    manifest_path = "content/processes/import-manifest.json"
    manifest = json.loads((ROOT / manifest_path).read_text())
    assert manifest == at_commit(base_commit, manifest_path), "Importer manifest changed"
    for rid in target_ids:
        assert digest(current[rid]) != manifest["records"][rid]["generatedHash"], (
            f"Authored record could be mistaken for generated output: {rid}")
    counts = {"processRecords": len(target_ids), "excludedSituations": len(excluded),
              "parts": sum(k[-1] == "guidance" for k in audited),
              "options": sum(k[-1] == "summary" for k in audited),
              "slots": len(audited), "statuses": dict(statuses),
              "duplicateBriefs": len(duplicates), "preservedGraphAndMetadata": True,
              "allAuthoredRecordsProtectedByImportManifest": True}
    assert counts == audit["validation"], "Audit aggregate drift"
    print(json.dumps(counts, indent=2))


if __name__ == "__main__":
    main()
