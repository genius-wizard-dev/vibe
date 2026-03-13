---
name: resource.changelogs
description: Update project root CHANGE_LOGS.md from completed work and git history.
---

Read:

- `CHANGE_LOGS.md` (create if missing)
- `.vibe/resource/state.md`
- latest commit messages

Flow:

1. detect recent commits related to current feature/topic
2. summarize into concise changelog entries
3. append/update `CHANGE_LOGS.md` without duplicating previous entries

Entry format:

```markdown
## YYYY-MM-DD
- [area] short change summary
  - impact
  - references: commit hash / file paths
```

Rule for coding agents:

- after each meaningful implementation chunk, run `/resource.changelogs`
