---
name: research.resume
description: Resume active research topic from .vibe/research/<research>/state.md.
---

Read:

```bash
cat .vibe/research/active.md 2>/dev/null || echo "NO_ACTIVE"
cat .vibe/research/overview.md 2>/dev/null || echo "NO_OVERVIEW"
```

If active topic exists, read:

```bash
cat .vibe/research/<research>/state.md
```

Show:

```text
research topic: <research>
  scan      {status}
  interview {status}
  analyze   {status}
  discuss   {status}
  export    {status}
```

Route:

- no active topic -> `/research.new`
- unfinished step -> run matching research command
- finished -> ask whether to start a new topic
