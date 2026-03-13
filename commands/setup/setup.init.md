---
name: setup.init
description: Bootstrap AI coding setup with resume-safe checkpoints in `.vibe/state.md`.
---

Always read `.vibe/state.md` first.

## Step 0: Resume-safe state

```bash
cat .vibe/state.md 2>/dev/null || echo "NO_STATE"
mkdir -p .vibe .vibe/logs .vibe/context
```

If state exists:

- skip sections already `✅ done`
- continue from first pending section

Show concise resume summary:

```text
▶ Resuming from [STEP]
  ✅ scan · ✅ interview · 🔄 detect · ⏸ install · ⏸ docs · ⏸ skills
```

If missing state:

- create `.vibe/state.md` from template in `reference/setup.verify.tools.md`

## Step 1: Scan

If `[SCAN]` is not done, run quick scan and record:

- workspace path
- stack
- phase (`greenfield|brownfield|refactor`)
- source count
- infra signals

Use concise commands only; avoid long reports.

## Step 2: Interview (GSD style)

If `[INTERVIEW]` is not done, ask only missing questions.

Ask in order and persist each answer immediately:

1. problem + users (free text)
2. phase (option): `Greenfield | Brownfield | Refactor`
3. data flow (free text: `A -> B -> C`)
4. key ADRs + trade-offs (free text)
5. domain rules/terms (free text)
6. iteration style (option): `Fast | Structured | Mixed`
7. constraints/anti-patterns (free text)
8. active agents/tools (option): `opencode | codex | claude | gemini`

For option questions, display choices explicitly and let user pick.

For descriptive questions, let user type custom answers.

Persist each answer immediately into `.vibe/state.md`.

## Step 3: Orchestrate follow-up steps

Run in order (skip already done):

1. `/setup.detect`
2. `/setup.docs`
3. `/setup.skills`
4. `/setup.install` (if requested)
5. `/setup.verify`

At finish, print short summary with done/pending statuses.
