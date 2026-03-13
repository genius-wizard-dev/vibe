---
name: design.resume
description: Resume active design topic from .vibe/design/<design>/state.md.
---

Read:

```bash
cat .vibe/design/active.md 2>/dev/null || echo "NO_ACTIVE"
cat .vibe/design/overview.md 2>/dev/null || echo "NO_OVERVIEW"
```

If active topic exists:

```bash
cat .vibe/design/<design>/state.md
```

Display:

```text
design topic: <design>
  arch   {status}
  mcp    {status}
  review {status}
  export {status}
```

Route:

- no active topic -> `/design.new`
- unfinished step -> run matching command
- completed -> ask for new design topic or handoff to resource setup
