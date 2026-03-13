---
name: design.setup
description: Orchestrate topic-based design flow under .vibe/design/<design>/ from research outputs.
---

## Interaction Contract (Mandatory)

Do not finalize architecture when requirements are still ambiguous.

- Ask focused clarification questions before proposing final design choices.
- Wait for user answers before advancing uncertain steps.
- If assumptions are required, label them explicitly as `assumption` in `architecture.md` and `review.md`.
- Before `/design.export`, confirm a short recap with user:
  - scope boundaries
  - chosen architecture direction
  - unresolved risks or trade-offs

Always read:

- `.vibe/design/overview.md`
- `.vibe/design/active.md`
- `.vibe/research/overview.md`

## Step 0: Ensure Design Workspace

```bash
mkdir -p .vibe/design
```

Create missing:

- `.vibe/design/overview.md`
- `.vibe/design/active.md`

`overview.md` must contain:

- a short architecture summary
- a topic status table

## Step 1: Resolve Active Design Topic

If no active topic, run `/design.new`.

Topic folder:

`.vibe/design/<design>/`

Required files:

- `state.md`
- `input.md`
- `architecture.md`
- `mcp.md`
- `review.md`
- `decisions.md`
- `logs.md`
- `output.md`

## Step 2: Resume by Status

Read `.vibe/design/<design>/state.md` and run next unfinished step:

1. `/design.arch`
2. `/design.mcp`
3. `/design.review`
4. `/design.export`

After each step run `/design.log`.

During arch/review steps:

- ask in small batches (1-3 questions per turn)
- prioritize blockers first (scope, constraints, success criteria)
- avoid filling gaps from guesswork

## Step 3: Handoff

When export is done, print:

`Design ready. Continue with /resource.setup then your Spec-Kit/GSD/BMAD implementation flow.`

If no research overview exists, stop and trigger `/research.new` + `/research.setup` first.
