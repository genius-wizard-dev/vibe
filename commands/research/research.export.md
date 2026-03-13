---
name: research.export
description: Export active research topic to .vibe/research/<research>/output.md and optional global mirror.
---

Read:

- `.vibe/research/active.md`
- `.vibe/research/<research>/state.md`

Require statuses:

- `scan: done`
- `interview: done`
- `analyze: done`
- `discuss: done`

Use schema in `reference/research.export.schema.md`.

Write:

- `.vibe/research/<research>/output.md`
- `.vibe/research/<research>/handoff.design.md`

Optional global mirror (when scope is global):

- `~/.config/vibe/research/<research>/output.md`

Update:

- `.vibe/research/<research>/state.md` -> `export: done`
- `.vibe/research/overview.md` row for this topic
- `.vibe/research/<research>/logs.md`

Then print:

```text
research export complete
next: /design.new (from this research topic)
list: vibe research result .
```
