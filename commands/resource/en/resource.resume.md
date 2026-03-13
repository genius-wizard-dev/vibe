---
name: resource.resume
description: Show bootstrap resource status and suggest next command.
---

```bash
cat .vibe/resource/state.md 2>/dev/null || echo "No resource state yet. Run /resource.setup"
```

Display:

```text
resource flow
  mode   {fastsetup|extra}
  CONTEXT {status}
  DETECT  {status}
  SKILL_FIND {status}
  DOCS    {status}
  SKILLS  {status}
  BASE    {status}
  INSTALL {status}
  VERIFY  {status}
```

Route:

- if bootstrap incomplete -> `/resource.setup`
- if skills missing -> `/resource.findskills`
- if base missing -> `/resource.base`
- after coding chunks -> `/resource.changelogs`
- if complete -> continue in Spec-Kit/GSD/BMAD commands

Prompt helper:

- if `.vibe/prompts/` exists, suggest `@fast.md`, `@implement.md`, or `@parallel.md` based on user intent
