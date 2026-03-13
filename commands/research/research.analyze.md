---
name: research.analyze
description: Build analytical model, trade-offs, and risk table for active research topic.
---

Read:

- `.vibe/research/<research>/brief.md`
- `.vibe/research/<research>/interview.md`

If critical information is missing (scope, constraints, success metric), ask clarifying questions first and update `interview.md` before analysis.

Produce `.vibe/research/<research>/analysis.md` with:

1. assumptions vs facts table
2. option matrix (3 options max)
3. trade-off table
4. risk table (impact, likelihood, mitigation)
5. recommended direction

Token optimization:

- no repeated paragraphs from interview
- summarize and link to source sections
- keep unknowns explicit; do not convert unknowns into facts

Set `analyze: done` in topic state.
