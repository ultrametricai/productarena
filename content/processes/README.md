# Shared process source

These records are the additive successor to the operational corpus, chains, and jurisdiction workflows. Existing pages and manifests keep their current loaders. `lib/shared-processes/load.ts` is the opt-in reader.

Edit one JSON file per record under `records/`. Guidance and notes support Markdown. A record can be a situation or a process; the importer does not infer that a legacy chain is a situation. Outcomes describe useful results. `when` is optional prose applicability, interpreted by the agent. User selections and company context stay in API memory.

Parts have stable IDs and contain a step, a reference to another record, or a decision with options. A connection uses `from`, `to`, and optionally `option` and `when`. `option` must belong to its source decision. Later branch connections can rejoin ordinary parts. A referenced process supplies its own graph. Options can also contain local parts and connections. The validator rejects unresolved process references, duplicate identities, invalid option connections, and graph/nesting cycles. It does not evaluate conditions or execute work.

Notes use `{ "text": "...", "references": [] }`; references are optional. They can explain evidence, uncertainty, exceptions, or UM opinions. URLs use `url`, `title`, and `description`, with a retained reference role. Null means a migration value is unknown. Favicons are generated presentation data. Review-status and runtime-state fields are excluded.

`metadata` preserves temporary legacy annotations. It is not included in API instructions. Unverified operation strings are retained only in `legacy-audit.json`. Six standalone legal decisions remain in metadata because the source does not specify their graph position. No decisions, outcomes, vendor claims, or instructions are invented during import. Source provenance is optional for new records. It identifies copied content, not factual support.

## Commands

- `pnpm shared:import` imports new or unedited generated records. It preserves authored edits; if their legacy source changes, it reports conflicts before writing any file. Removed source records also require reconciliation.
- `pnpm shared:check` validates the catalog, schema, and legacy source drift.
- `python3 scripts/shared-processes/check-import.py` checks the initial migration's full value preservation. Run before authoring changes to imported fields; it intentionally rejects such changes.
- `pnpm exec tsx scripts/shared-processes/check.ts --write-schema` updates the JSON Schema generated from the TypeScript source.
- `pnpm shared:export --output /path/to/catalog.json` exports a committed, validated catalog with its Git revision, JSON Schema, and content hash.
- Add `--example` to export only the two synthetic staging records in `fixtures/shared-processes/staging.json`. They demonstrate option branches, a nested process, and a shared downstream step. They are excluded from the real catalog and current site.

The initial mapping contains 149 records, 694 operational nodes and 522 original connections. The audit lists missing outcomes, guidance, vendor keys, and placement questions. A valid mapped record is not automatically a useful published guide.

Private UM additions live in the API database. They refer to these record/part IDs and exact target content hashes. API publication assembles public guidance and specific private versions without an LLM rewrite. The public export contains no private additions. Production promotes the exact prepared artifact after staging validation.
