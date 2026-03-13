---
name: setup.install
description: Detect selected tools, install VEXP MCP wiring, and initialize selected workflow CLIs.
---

Read:

```bash
cat .vibe/state.md
cat .vibe/config.json 2>/dev/null || true
```

Guards:

- if `[DETECT] confirmed: false` -> stop and request `/setup.detect`
- if `[INSTALL] status: ✅ done` -> show summary and ask rerun

Set install status to in-progress before running.

Use details from:

- `reference/setup.install.tools.md`

## Flow

1. detect + confirm selected tools
2. init `vexp` once
3. apply MCP config for each selected tool (merge, never overwrite whole file)
4. initialize workflows based on recommendation/selection:
   - Spec-Kit: ensure `uv`, run `uvx ... specify init --here`
   - GSD/BMAD: run `npx get-shit-done-cc --<runtime> --local|--global`
5. optional skills only if explicitly selected in state

Write per-item status and set `[INSTALL]` done when finished.
