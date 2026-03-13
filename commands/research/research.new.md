---
name: research.new
description: Create a new research topic folder and register it in research overview.
---

## Step 1: Choose Topic

Ask for topic title (example: "connect firebase to auth").

Generate slug:

`connect-firebase-to-auth`

## Step 2: Create Topic Folder

Create:

`.vibe/research/<research>/`

Files:

- `state.md`
- `brief.md`
- `interview.md`
- `analysis.md`
- `discussion.md`
- `decisions.md`
- `logs.md`
- `output.md`

Use template from `reference/research.folder.template.md`.

## Step 3: Register Topic

Update:

- `.vibe/research/active.md` -> `<research>`
- `.vibe/research/overview.md` table row with status `in-progress`

## Step 4: Next

Suggest `/research.scan`.
