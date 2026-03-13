---
name: research.scan
description: Scan repository and existing workflow artifacts for active research topic.
---

Read active topic and topic state:

- `.vibe/research/active.md`
- `.vibe/research/<research>/state.md`

Run scan:

```bash
echo "=== workspace ===" && pwd
ls src app services backend frontend 2>/dev/null
ls .specify .planning _bmad _bmad-output AGENTS.md ARCHITECTURE.md CONVENTIONS.md 2>/dev/null
git log --oneline -10 2>/dev/null
```

Write findings to `.vibe/research/<research>/brief.md`:

- known stack
- known boundaries
- existing plans/specs
- obvious unknowns

Set `scan: done` in topic `state.md`.
