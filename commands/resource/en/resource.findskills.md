---
name: resource.findskills
description: Discover, recommend, and install relevant skills from project context.
---

Read:

- `.vibe/resource/state.md`
- `.vibe/resource/context/bridge.md`
- latest research/design outputs

## Step 1: Infer Stack Keywords

Build stack query from context (for example: `nextjs node postgres`, `react python fastapi`, `go grpc`).

## Step 2: Find Skills

Run:

```bash
npx skills find <stack-query>
```

## Step 3: Recommend Minimal Set

Recommend only high-fit skills:

- required
- optional
- skip

Ask user which skills to install.

Common skill installs:

```bash
npx skills add https://github.com/softaworks/agent-toolkit --skill mermaid-diagrams
npx skills add https://github.com/google-labs-code/stitch-skills --skill stitch-loop
npx skills add https://github.com/figma/mcp-server-guide --skill implement-design
```

## Step 4: Install Confirmed Skills

Run per confirmed skill:

```bash
npx skills add <repo-url> --skill <skill-name>
```

Record install results in:

- `.vibe/resource/state.md`
- `CHANGE_LOGS.md`

Set `[SKILL_FIND] status: done`.
