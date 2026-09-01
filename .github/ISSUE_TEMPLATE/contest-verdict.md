---
name: Contest a verdict
about: Dispute a specific (product, story) verdict in INIT
title: "[verdict] <category>/<product>: <story id>"
labels: verdict-contest, contest
---

<!--
Before filing: find the exact category, product, and story ids in
data/categories.json, data/{category}/products.json, and data/{category}/stories.json.
Find the current verdict in data/{category}/verdicts.json.
-->

**Category**
<!-- e.g. ai-coding -->

**Product**
<!-- e.g. claude-code -->

**Story id**
<!-- e.g. live-app-debugging -->

**Current verdict**
<!-- tier + quality + confidence, copied from data/{category}/verdicts.json, e.g. "partial, quality 5, confidence medium" -->

**Proposed verdict**
<!-- what you think it should be, e.g. "full, quality 8" — and why -->

**Evidence URLs**
<!-- one or more source URLs supporting your proposed verdict -->

**Quotes**
<!-- verbatim excerpt(s) from each URL above — quote, don't paraphrase, so a maintainer can verify the claim directly against the source -->
