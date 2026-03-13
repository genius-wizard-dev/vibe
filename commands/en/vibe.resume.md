---
name: vibe.resume
description: Shortcut - read .vibe/state.md, show progress, ask whether to continue or rerun a specific step.
---

```bash
cat .vibe/state.md 2>/dev/null || echo "No state yet. Run /vibe.setup to start."
```

Analyze and display:

```
📋 vibe.setup progress - {project}
Last updated: {datetime}

  ✅ SCAN       stack: {stack}
  ✅ INTERVIEW  8/8 questions answered
  ✅ DETECT     -> {recommendation}
  🔄 INSTALL    opencode ✅ · codex ❌
  ⏸ DOCS       not started
  ⏸ SKILLS     not started
  ⏸ VERIFY     not started

What do you want to do?
  1. Continue from the next step (INSTALL)
  2. Rerun a specific step
  3. Reset and start over
```

Wait for user selection:

- **1 / continue:** call `/vibe.setup` (it will auto-skip completed steps)
- **2 / choose step:** call the matching command directly (`/vibe.install`, `/vibe.docs`, etc.)
- **3 / reset:** `rm .vibe/state.md` -> call `/vibe.setup`
- **"rerun [step]":** delete that step status in state -> call that command
