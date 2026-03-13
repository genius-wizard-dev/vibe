---
name: resource.detect
description: Recommend workflow strategy (GSD/Spec-Kit/BMAD) for implementation and lock a confirmed selection.
---

Read:

```bash
cat .vibe/resource/state.md
```

Score based on speed vs structure, governance, and complexity.

Ask final user choice and write:

```markdown
## [DETECT] status: done
recommendation: {gsd | speckit | bmad | hybrid}
selected_workflows: {final selection}
confirmed: true
```

Hard rule:

- `/resource.install` requires `confirmed: true`

## Anti-duplication contract

Keep responsibilities clear:

- research/design folders own discovery and architecture context
- Spec-Kit owns implementation spec/plan/tasks
- GSD owns fast execution loops
- BMAD owns broader agile orchestration

Resource flow must bridge these tools, not duplicate their core outputs.
