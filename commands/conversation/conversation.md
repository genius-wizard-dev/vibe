---
name: conversation
description: Plan, add members, and run a real multi-agent meeting workflow.
---

Use this workflow for structured AI discussions that end with a concrete summary.

## Step 1: Define meeting context

Collect:

- topic/problem statement
- expected outcome
- constraints and decision deadline

Ask user to confirm before creating or starting the meeting.

## Step 2: Prepare agents

Create and inspect agents:

```bash
vibe agents create planner --runtime opencode --skills sqlite,workflow
vibe agents create reviewer --runtime claude --skills review,risk
vibe agents list
```

If `.agents/skills` exists, map relevant skill docs into each agent brain.

## Step 3: Create conversation room

```bash
vibe convo init
vibe convo create "<meeting-title>" --by <owner> --type human
```

## Step 4: Pick and add members

Use topic-based suggestion:

```bash
vibe convo suggest <conversation_id> --topic "<problem>"
```

Add selected members:

```bash
vibe convo add <conversation_id> --agent <agent_name>
```

## Step 5: Start meeting

```bash
vibe convo start <conversation_id> --topic "<problem>"
```

`vibe convo start` runs each agent turn, records mentions and workflow steps,
and writes a final meeting summary message.

## Step 6: Review outputs

```bash
vibe convo history <conversation_id> --limit 200
vibe convo history <conversation_id> --tool sqlite
vibe convo runs <conversation_id>
```
