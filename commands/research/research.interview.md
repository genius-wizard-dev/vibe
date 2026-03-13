---
name: research.interview
description: Run structured interview for active research topic using GSD baseline.
---

Read:

- `.vibe/research/active.md`
- `.vibe/research/<research>/state.md`
- `.vibe/research/<research>/brief.md`

Use `reference/research.interview.gsd.md`.

Interview must be interactive:

- ask user questions directly (do not fabricate answers)
- ask follow-up when answers are vague or conflicting
- ask at most 3 questions per turn, then wait for reply
- after each reply batch, restate understanding in 2-4 bullets for confirmation

Capture answers in `.vibe/research/<research>/interview.md` using sections:

- problem
- users
- desired outcomes
- tech preferences
- constraints
- risks

Also include:

- assumptions (only when user did not provide data)
- unresolved questions (to carry into `/research.discuss`)

Update topic `state.md`:

- `interview: done`
