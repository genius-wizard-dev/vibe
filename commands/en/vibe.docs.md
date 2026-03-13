---
name: vibe.docs
description: Create ARCHITECTURE.md + CONVENTIONS.md + AGENTS.md from .vibe/state.md. Track each file independently so any file can be regenerated.
---

## Step 0: Read State

```bash
cat .vibe/state.md
```

- If `[DOCS] status: ✅ done` -> show generated files and ask "Which file should be regenerated?"
- If `[INTERVIEW] status: ⏸ pending` -> show "Interview must be completed first"
- Write: `## [DOCS] status: 🔄 in-progress`

Read from state: `problem`, `data_flow`, `adrs`, `constraints`, `agents`, `stack`, `recommendation`.

---

## Scan Code Patterns (run before writing)

```bash
rg "^(def |async def |export (const|function|async function))" src/ 2>/dev/null | head -20
rg "^(class |export class )" src/ 2>/dev/null | head -10
rg "^(import |from |require)" src/ 2>/dev/null | sort | uniq | head -15
```

---

## ARCHITECTURE.md

> Skip if `- ARCHITECTURE.md: ✅` and overwrite is not requested

If file exists -> read and merge new ADRs while keeping old ADRs.

```markdown
# ARCHITECTURE.md

> Read before refactoring. Update whenever there is a new ADR.

## Overview

**Purpose:** {state[1/8]}

**Data Flow:**
{state[3/8] - ASCII}

## Service Map

| Module | Owns | Does Not Own |
| ------ | ---- | ------------ |

## ADRs

### ADR-001: {from state[4/8]}

- Status: Active
- Context / Decision / Reasoning / Consequences / Rejected

## Hard Boundaries

{state[7/8] - ❌ format}

## External Services

| Service | Purpose | Config |
```

✍️ Write: `- ARCHITECTURE.md: ✅`

---

## CONVENTIONS.md

> Skip if `- CONVENTIONS.md: ✅`

```markdown
# CONVENTIONS.md

> Read before creating new files/functions/classes.

## Naming

### Files / Functions / Classes / DB / API Routes

{from real scan results}

## Error Handling

{standard patterns from scan}

## Anti-Patterns ❌

| Avoid | Use Instead | Why |
{state[7/8] + research}

## Import Order / Logging
```

✍️ Write: `- CONVENTIONS.md: ✅`

---

## AGENTS.md

> Skip if `- AGENTS.md: ✅`

```markdown
# AGENTS.md

> Read BEFORE doing any task.

## Project · Stack · Workflow Tool

## Before coding: VEXP run_pipeline -> domain.md -> spec -> conventions -> rg patterns

## After coding: lint -> VEXP save_observation -> update docs

## Skills / Constraints / File Map / Quick Reference
```

✍️ Write: `- AGENTS.md: ✅`

---

## Write State After Completion

```
## [DOCS] status: ✅ done
```
