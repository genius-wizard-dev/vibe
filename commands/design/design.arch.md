---
name: design.arch
description: Build architecture draft for active design topic.
---

Read:

- `.vibe/design/active.md`
- `.vibe/design/<design>/input.md`
- linked research output

If key requirements are missing (scope boundary, NFR constraints, integration constraints), ask clarifying questions first and update `input.md` before drafting architecture.

Write `.vibe/design/<design>/architecture.md` with:

1. context boundaries
2. component map
3. API/event contracts
4. data model direction
5. deployment and operational model

Keep content concise; link to deeper docs where needed.

Keep unknowns explicit; do not convert unknowns into facts.

Set `arch: done` in topic state.
