---
name: resource.skills
description: Build shared skills and workflow context for coding agents.
---

Run this after `/resource.findskills`.

Read:

```bash
cat .vibe/resource/state.md
mkdir -p .agents/skills .agents/context
```

Use bridge context and selected workflows to create/update:

- `.agents/context/workflow.md`
- `.agents/context/domain.md`
- `.agents/context/tech-decisions.md`

Do not reinstall skills here. Use this command to build context files from installed skills.

Set `[SKILLS] status: done`.
