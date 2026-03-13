---
name: research.log
description: Append structured logs for active research topic and sync overview table.
---

Read:

- `.vibe/research/active.md`
- `.vibe/research/<research>/state.md`
- `.vibe/research/overview.md`

Append delta entry to `.vibe/research/<research>/logs.md`:

| timestamp | step | change | next |

Then update `.vibe/research/overview.md` row:

- topic id
- stage
- status
- updated_at
- output path
