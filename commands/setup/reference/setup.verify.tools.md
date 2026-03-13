# setup.verify Checks Reference

Use with `/setup.verify`.

## Required files

- `.vibe/state.md`
- `CHANGE_LOGS.md`
- `ARCHITECTURE.md`
- `CONVENTIONS.md`
- `AGENTS.md`

## Workflow checks

| Workflow | Pass when |
| --- | --- |
| speckit | `workflow_speckit: done` in state OR `.specify` + `.planning` OR `specify` CLI exists |
| gsd | `workflow_gsd: done` in state OR `get-shit-done-cc` exists |
| bmad | `workflow_bmad: done` in state OR `_bmad` exists OR `bmad/get-shit-done-cc` exists |

## State template

Create `.vibe/state.md` when missing:

```markdown
# .vibe/state.md

# status: ✅ done | 🔄 in-progress | ⏸ pending | ❌ failed

## Meta
- created: {datetime}
- last_updated: {datetime}
- workspace: {pwd}

## [SCAN] status: ⏸ pending
stack: ~
phase: ~
source_files: ~
infra: ~

## [INTERVIEW] status: ⏸ pending
- [1/8] problem: ~
- [2/8] phase: ~
- [3/8] data_flow: ~
- [4/8] adrs: ~
- [5/8] domain: ~
- [6/8] iteration: ~
- [7/8] constraints: ~
- [8/8] agents: ~

## [DETECT] status: ⏸ pending
recommendation: ~
selected_workflows: ~
confirmed: false

## [TOOLS] status: ⏸ pending
selected: ~

## [INSTALL] status: ⏸ pending
- opencode VEXP MCP: ⏸
- codex VEXP MCP: ⏸
- speckit opencode: ⏸
- speckit codex: ⏸
- gsd opencode: ⏸
- gsd codex: ⏸

## [DOCS] status: ⏸ pending

## [SKILLS] status: ⏸ pending
skills: []

## [VERIFY] status: ⏸ pending
```
