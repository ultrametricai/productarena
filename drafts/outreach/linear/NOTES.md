# Gift draft: Linear certification — maintainer review notes

**Status: draft. Nothing has been posted anywhere.** These files exist for a human to review,
edit, and send (or discard).

## The status change (be honest about this)

The gift list mandated Linear because our certification audit recorded it as "one file from
certified — llms.txt returns HTML". **That is no longer true.** Re-verified 2026-09-11:

- `https://linear.app/llms.txt` → HTTP 200, `text/plain; charset=utf-8`, 10,119 bytes of real
  markdown. Linear fixed it upstream between our audit and now.
- Full certify suite re-run 2026-09-11 (`pnpm --dir cli exec tsx src/index.ts certify
  https://linear.app`): **4 pass, 1 fail (openapi), 1 skip (structured-errors) → level earned:
  Certified Agent-Ready.** Machine-verifiable report: `cert-report.json` in this directory.
- `https://mcp.linear.app/mcp` answered the JSON-RPC initialize with a 401 + OAuth
  protected-resource metadata (a passing MCP signal per the suite).
- `https://linear.app/developers/graphql.md` and `/developers/agents.md` → 200 text/markdown.

So the artifact is no longer an llms.txt — it is the passing cert report plus an invitation.

## Why still worth sending

- Linear is #2 of 6 in project-management (Arena Score 36.9) with only notion certified in
  that arena (`data/project-management/certifications.json`). A vendor-initiated (or
  maintainer-initiated) Linear certification is a strong story for both sides.
- Their agent story is loud right now (agents.md, AIG docs, MCP server) — a third-party
  verified badge is genuinely useful to them, zero work required.
- The Agent-Native gap (machine-readable spec at a conventional path) maps to our
  `api-machine-spec: none` verdict — if the conversation lands, that flips too.

## Venue (verified 2026-09-11, read-only)

- Docs source is **not public**: developers.linear.app 301s into linear.app/developers (closed
  app). No docs repo to PR — issue draft it is, exactly as the task anticipated.
- `github.com/linear/linear` (SDK monorepo): issues enabled, MIT, 1,597 stars, pushed
  2026-09-09. Reasonable venue; email/Slack are alternatives for a less public first touch.

## What it flips on our side

- `project-management/certifications.json`: eligible for a `linear` entry, level
  `agent-ready`, `initiatedBy: "maintainer"` (or `vendor` if they submit) — the report in this
  directory is the exact artifact the registry commits. Recommended follow-up regardless of
  outreach: commit the maintainer-initiated cert per docs/CERTIFICATION.md.
- `project-management` / `linear` / `agentic-agent-docs`: currently `partial` q6 — the fixed
  llms.txt is new evidence for a re-judge (probably → `full`).
- `api-machine-spec`: currently `none` q0 — only flips if they publish the SDL/spec at a
  stable URL (the issue suggests it).

## Review checklist before sending

1. Re-run `certify https://linear.app` the day of sending; attach the fresh report.
2. Confirm no existing thread in linear/linear about certification/llms.txt.
3. Decide venue (GitHub issue vs email) and whether to commit the maintainer-initiated cert
   first so the linked product page already shows it.
