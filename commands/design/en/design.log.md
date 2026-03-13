---
name: design.log
description: Append structured log entries for active design topic and sync overview.
---

Read:

- `.vibe/design/active.md`
- `.vibe/design/<design>/state.md`
- `.vibe/design/overview.md`

Append delta row to `.vibe/design/<design>/logs.md`:

| timestamp | step | change | next |

Update `.vibe/design/overview.md` row:

- topic
- stage
- status
- updated_at
- output path
