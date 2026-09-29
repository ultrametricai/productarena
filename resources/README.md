# Resources — the open startup-resources path

The curated registry of canonical, openly readable startup resources (`registry.json`) and the
laws distilled from them (`LAWS.md`). This is the reading-path layer of the founder-ops corpus:
`documents/` holds the usable legal forms, `rules/` holds the legal propositions, and this
directory holds the knowledge those layers assume.

## Record semantics

Every entry in `registry.json` is a dated record:

| Field | Meaning |
| --- | --- |
| `id` | Stable slug; `LAWS.md` citations and other corpus records reference it |
| `title` / `author` | As published; authorship attributed to the actual origin |
| `url` | HTTPS, curl-verified live on `checked_on` (registry policy: no dead links, no paywalls) |
| `kind` | `essay` \| `guide` \| `handbook` \| `library` \| `primary-source` \| `document-repository` |
| `topics` | Lowercase facet tags |
| `note` | Why it is canon, dated context, and honest caveats |
| `published_on` | Exact date when the source states one; otherwise `null` (month/year go in the note) |
| `checked_on` | The date a human last verified the link and description |

Inclusion bar: openly readable (no login, no purchase), primary where possible (government
sources are `primary-source` records), and canonical — the resource is what the community
actually cites, not a summary of it. Candidates that failed live verification on 2026-09-29
were left out rather than linked hopefully (`seriesseed.com` and `growth.tlb.org` were
unreachable; `sec.gov` and `dol.gov` block non-browser fetches).

## Startup laws

`LAWS.md` distills the registry into 25–40 recurring, near-universal principles, grouped by
lifecycle stage. Discipline: every law cites its source records by id; aphorisms are
attributed to their actual origin; the only literal laws (filing deadlines) also carry rule
cards in `rules/` with primary sources.

## Gates

`lib/resources.ts` loads and validates both files; `__tests__/resources.test.ts` fails on
duplicate or malformed ids, non-HTTPS URLs, future `checked_on` dates, unknown kinds, laws
without citations, citations that do not resolve to a registry id, and a law count outside
25–40. URL liveness is a human editorial check recorded via `checked_on` — the test suite is
deterministic and does not hit the network.
