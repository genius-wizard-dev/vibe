---
name: vibe.detect
description: Run scoring matrix -> recommend GSD/Spec-Kit/Hybrid. Read CONTEXT from .vibe/state.md and write results back.
---

## Step 0: Read State

```bash
cat .vibe/state.md
```

- If `[DETECT] status: ✅ done` -> show previous result and ask "Run again?"
- If `[INTERVIEW] status: ⏸ pending` -> show "Interview must be completed first. Run `/vibe.setup`"
- Write: `## [DETECT] status: 🔄 in-progress`

Use CONTEXT from state: `phase`, `data_flow`, `adrs`, `domain`, `iteration`, `agents`.

---

## Scoring Matrix

| Signal                      | GSD | Spec-Kit |
| --------------------------- | --- | -------- |
| phase = brownfield/refactor | +2  | +1       |
| phase = greenfield          | +1  | +2       |
| iteration = fast            | +3  | 0        |
| iteration = structured      | 0   | +3       |
| iteration = mixed           | +1  | +1       |
| data_flow hops >= 4         | +1  | +2       |
| complex domain rules        | 0   | +2       |
| adrs >= 3                   | 0   | +2       |
| agents >= 2 runtimes        | +2  | +1       |

Calculate scores -> print table -> recommend:

- Difference >= 3: winner tool
- Difference <= 2: **Hybrid**

Ask for confirmation: "Recommend **[X]**. Do you agree?"

---

## Write State After Confirm

```
## [DETECT] status: ✅ done
gsd_score: {X}
speckit_score: {Y}
recommendation: {gsd | speckit | hybrid}
confirmed: true
```

Update `last_updated` in Meta.
