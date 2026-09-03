# Product Feedback & Intent arena — report

Category `product-feedback` added (11th arena): foreloop, canny, featurebase, productboard.
65 canonical stories (36 LLM-authored + 29 canonical lens), 260/260 verdict cells, 0 `na`
(every axis applies to all four SaaS feedback tools), 6 battles. Community stage: 0 HN
items qualified for any product (verified — "canny" noise correctly filtered by domain/vendor
match in the LLM prompt).

Leaderboard (INIT score / agentReady):
- canny: 28.5 / 38.5
- productboard: 26.4 / 43.4
- foreloop: 18.5 / 29.1
- featurebase: 17.0 / 19.3

Foreloop: real npm package `foreloop` (v0.14.0, verified on npm registry), install
`npm i -g foreloop`. Public pages: /, /install, /docs (+4 subpages). No real llms.txt
(returns HTML app-shell, not text/plain — probe correctly excluded it). /mcp, /api,
/changelog, /pricing, /waitlist all soft-200 client-shell routes, not verifiable via curl.

Affiliation finding: foreloop's npm package repo is github.com/ultrametricai/foreloop-js
(maintainer hello@ultrametric.ai); this very repo (productarena/initdotdog) is owned by the
same GitHub org "ultrametricai" (blog ultrametric.ai, "Build your dream business",
info@ultrametric.ai). Foreloop and this arena tool are built by the same company.

Widget snippet (requires a write-only `flpk_...` key, sign-in required — not a keyless
public embed; NOT added to the site):
<script src="https://cdn.jsdelivr.net/npm/@foreloop/feedback@latest/dist/foreloop-feedback.js"
  data-api-key="flpk_YOUR_WRITE_ONLY_KEY" async></script>

Gates: pnpm test 297/297, pnpm build green (+1 arena, +4 products, +6 battles, +6 /vs/
confirmed in .next output), recompute-check 11/11 MATCH, README stats regenerated
(11 arenas, 57 products, 4,141 verdicts). Commit d45952f pushed to main; CI run 33703726274
green (test, build, rankings determinism).
