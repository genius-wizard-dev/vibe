---
name: resource.docs
description: Generate reusable docs for coding agents with research/design context bridge.
---

Read:

- `.vibe/resource/state.md`
- `.vibe/resource/context/bridge.md`

Generate/update:

- `ARCHITECTURE.md`
- `CONVENTIONS.md`
- `AGENTS.md`

In `AGENTS.md`, add mandatory rule:

- before Spec-Kit/GSD/BMAD implementation, read `.vibe/resource/context/bridge.md`
- if research/design changed, refresh bridge through `/resource.setup` or `/resource.docs`
- after implementation chunks, run `/resource.changelogs` to update `CHANGE_LOGS.md`

Set `[DOCS] status: done`.
