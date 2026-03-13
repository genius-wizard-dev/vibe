---
name: resource.setup
description: Initialize reusable AI resources for coding workflows (Spec-Kit, GSD, BMAD).
---

Always read `.vibe/resource/state.md` first.

## Purpose

`/resource.setup` is bootstrap-only.

After bootstrap, implementation should run in Spec-Kit/GSD/BMAD commands directly.

## Step 0: Initialize Resource Workspace

```bash
cat .vibe/resource/state.md 2>/dev/null || echo "NO_STATE"
mkdir -p .vibe/resource/context .vibe/resource/logs
```

Create missing files:

- `.vibe/resource/state.md`
- `.vibe/resource/context/bridge.md`
- `CHANGE_LOGS.md` (project root)
- `AGENTS.md` baseline guidance (if missing)

If `AGENTS.md` is created or updated, include mandatory rule:

- after coding updates, run `/resource.changelogs` to keep `CHANGE_LOGS.md` current

If `.vibe/prompts/` exists, add quick usage note in `AGENTS.md` for `@fast.md`, `@implement.md`, and `@parallel.md`.

Prompt library is optional and installed by CLI setup (`--prompts` or interactive confirmation).

Ensure upstream overview files exist:

- `.vibe/research/overview.md`
- `.vibe/design/overview.md`

Ask setup mode (or reuse existing state value):

- `fastsetup`
- `extra`

Mode default priority:

1. existing `mode` in `.vibe/resource/state.md`
2. `.vibe/config.json` -> `setupMode` (written by `vibe setup --fastsetup|--extra`)
3. fallback `extra`

Write selected mode to `.vibe/resource/state.md`.

If any overview file is missing:

1. create missing overview file
2. continue by selected mode

Mode behavior:

- `fastsetup` -> ask 10 GSD baseline questions, then auto-create one research topic and one design topic summary
- `extra` -> run `/research.new` + `/research.setup`, then `/design.new` + `/design.setup`

Fastsetup 10 questions:

1. system goal
2. target users
3. success criteria
4. frontend preference
5. backend preference
6. data/storage preference
7. integrations
8. security/compliance
9. scale/performance target
10. hard boundaries

Resource setup must not continue until research/design overview exists.

## Step 1: Link Upstream Context

Read latest:

- `.vibe/research/*/output.md`
- `.vibe/design/*/output.md`

If no research output exists -> trigger `/research.new` then `/research.setup`.

If no design output exists -> trigger `/design.new` then `/design.setup`.

Create compact bridge context at `.vibe/resource/context/bridge.md`:

- active research topic
- active design topic
- constraints
- architecture boundaries
- workflow preference

Do not duplicate full outputs; store path references and concise deltas.

## Step 2: Detect Workflow Strategy

Run `/resource.detect`.

## Step 3: Find and Install Skills First

Run `/resource.findskills`.

Hard rule: do not run `/resource.base` before skills are selected and installed.

## Step 4: Generate Shared Docs and Skill Context

Run:

- `/resource.docs`
- `/resource.skills`

## Step 5: Install Runtime Tooling and Verify

Ask user whether to run now:

- `/resource.install`
- `/resource.verify`

## Step 6: Create/Refresh Codebase Skeleton

Run `/resource.base` to scaffold or refine project source structure from research + design.

## Step 7: Finish

Set `bootstrap: done` and print quick start:

- Spec-Kit flow: `/speckit.specify` -> `/speckit.plan` -> `/speckit.tasks` -> `/speckit.implement`
- GSD flow: run local gsd task commands
- BMAD flow: run sprint and role commands
- After implementation chunks: `/resource.changelogs`

## State Template

```markdown
# .vibe/resource/state.md

bootstrap: pending
mode: extra

## Meta
- created: {datetime}
- last_updated: {datetime}
- workspace: {pwd}

## [CONTEXT] status: pending
- research_output: ~
- design_output: ~
- research_overview: .vibe/research/overview.md
- design_overview: .vibe/design/overview.md
- bridge: .vibe/resource/context/bridge.md
- changelog: CHANGE_LOGS.md

## [DETECT] status: pending
recommendation: ~
selected_workflows: ~
confirmed: false

## [SKILL_FIND] status: pending
selected_skills: []

## [BASE] status: pending
base_path: ~
base_stack: ~

## [TOOLS] status: pending
selected: ~

## [INSTALL] status: pending
## [DOCS] status: pending
## [SKILLS] status: pending
## [VERIFY] status: pending
```
