---
name: resource.base
description: Scaffold or refine a production-ready source base from research and design outputs.
---

Read first:

- `.vibe/resource/state.md`
- `.vibe/resource/context/bridge.md`
- `.vibe/research/overview.md`
- `.vibe/design/overview.md`
- latest `.vibe/research/*/output.md`
- latest `.vibe/design/*/output.md`

Guard:

- require `[SKILL_FIND] status: done`
- require both overview files to exist
- if any overview/output missing: trigger research/design creation before scaffolding

## Step 1: Detect Target Stack

Infer target stack from research + design + user constraints.

If ambiguous, ask one focused question and proceed.

## Step 2: Build Base Blueprint

Generate `.vibe/resource/base-blueprint.md` with:

- selected language(s)
- repo layout
- module boundaries
- build/test/lint setup
- env/config strategy
- docs and onboarding files

## Step 3: Scaffold Source Base

Rules:

- if repository is empty -> create full base
- if repository exists -> merge safely, no destructive overwrite
- keep structure deterministic and minimal

Language-aware behavior examples:

- Next.js FE -> `app/`, `components/`, `features/`, `lib/`, `tests/`, `styles/`, typed config, env template
- Python BE -> `src/`, `api/`, `domain/`, `infra/`, tests, pyproject, lint/format config
- Mixed FE+BE -> clear mono-repo boundaries and shared contracts

## Step 4: Wire Workflow Bridges

Create/update:

- `.vibe/resource/context/bridge.md`
- `AGENTS.md` references for research/design context
- flow notes for Spec-Kit/GSD/BMAD interoperability

## Step 5: Update State

Set:

```markdown
## [BASE] status: done
base_path: {repo root}
base_stack: {detected stack}
```

Append a delta log entry to `CHANGE_LOGS.md` (project root).
