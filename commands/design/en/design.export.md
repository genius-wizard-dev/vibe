---
name: design.export
description: Export active design topic to .vibe/design/<design>/output.md and optional global mirror.
---

Read:

- `.vibe/design/active.md`
- `.vibe/design/<design>/state.md`

Require:

- `arch: done`
- `mcp: done`
- `review: done`

Write:

- `.vibe/design/<design>/output.md`
- `.vibe/design/<design>/handoff.resource.md`

Optional global mirror:

- `~/.config/vibe/design/<design>/output.md`

Update:

- `.vibe/design/<design>/state.md` -> `export: done`
- `.vibe/design/overview.md` row
- `.vibe/design/<design>/logs.md`

Then print:

`design export complete -> run /resource.setup`
