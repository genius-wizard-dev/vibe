---
name: research.setup
description: Orchestrate reusable topic-based research flow under .vibe/research/<topic>/.
---

Research is repeatable per topic. Use folders, not one global state file.

## Interaction Contract (Mandatory)

Do not jump straight to conclusions when intent is ambiguous.

- Ask focused clarification questions before final recommendations.
- Wait for user answers before continuing to next uncertain step.
- If assumptions are required, label them explicitly as `assumption` in `interview.md` and `analysis.md`.
- Before `/research.export`, confirm a short recap with user:
  - problem framing
  - selected direction
  - open risks

Always read:

- `.vibe/research/overview.md`
- `.vibe/research/active.md`
- `.vibe/resource/state.md` (if exists)

## Step 0: Ensure Research Workspace

```bash
mkdir -p .vibe/research
```

If missing, create:

- `.vibe/research/overview.md`
- `.vibe/research/active.md`

`overview.md` must contain:

- a short system summary section
- a topic status table

Use `reference/research.folder.template.md` as structure source.

## Step 1: Resolve Active Topic

If no active topic is set, run `/research.new`.

Active topic folder format:

`.vibe/research/<research>/`

Required topic files:

- `state.md`
- `brief.md`
- `interview.md`
- `analysis.md`
- `discussion.md`
- `decisions.md`
- `logs.md`
- `output.md`

## Step 2: Resume by Status

Read `.vibe/research/<research>/state.md` and run next unfinished step:

1. `/research.scan`
2. `/research.interview`
3. `/research.analyze`
4. `/research.discuss`
5. `/research.export`

After each step, run `/research.log`.

During interview/discuss steps:

- ask in small batches (1-3 questions per turn)
- prioritize blockers first (scope, constraints, success criteria)
- avoid filling missing answers from guesswork

If resource mode is `fastsetup`, compress steps into one pass:

- ask the 10 baseline questions
- still wait for answers; do not auto-answer on behalf of user
- write brief, interview, and analysis in one compact run
- continue to `/research.export`

## Step 3: Handoff Trigger

When export is done, ask:

1. continue to design now -> `/design.new` then `/design.setup`
2. stop here and keep topic ready

## Token Rules

- Keep `output.md` concise and link to detail files.
- Put long notes into `analysis.md` and `discussion.md`.
- Keep `state.md` machine-readable and compact.
