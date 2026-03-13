---
name: setup.detect
description: Recommend minimal workflow (`gsd|speckit|hybrid|bmad`) and confirm selection.
---

Read:

```bash
cat .vibe/state.md
cat .vibe/config.json 2>/dev/null || true
```

Score quickly by:

- speed need
- complexity
- governance

Recommendation rule:

- fast delivery -> `gsd`
- strong planning -> `speckit`
- both -> `hybrid` (`speckit+gsd`)
- heavy orchestration -> `bmad`

Ask one confirmation question with options and write:

```markdown
## [DETECT] status: ✅ done
recommendation: {gsd|speckit|hybrid|bmad}
selected_workflows: {final selection}
confirmed: true
```

Hard guard:

- `/setup.install` requires `confirmed: true`
