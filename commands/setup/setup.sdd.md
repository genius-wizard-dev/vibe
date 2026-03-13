---
name: setup.sdd
description: Optional Spec-Driven Development bootstrap for selected runtime/tools.
---

Read:

```bash
cat .vibe/state.md
cat .vibe/config.json 2>/dev/null || true
```

If user confirms SDD bootstrap:

- ensure `uv` exists (install if missing)
- run `uvx --from git+https://github.com/github/spec-kit.git specify init --here --ai <tool>`

If skipped, keep state unchanged except note that SDD is optional.

On success, record under install state:

- `workflow_speckit: ✅`
