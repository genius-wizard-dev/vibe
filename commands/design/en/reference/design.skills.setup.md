# design.setup Skill Installation Reference

Use this file in `/design.setup` Step 3.

Install flow:

1. Find suitable skills first:

```bash
npx skills find <project stack>
```

2. Recommend only relevant skills.

3. Install selected skills:

## Mermaid diagrams (recommended for architecture visualization)

```bash
npx skills add https://github.com/softaworks/agent-toolkit --skill mermaid-diagrams
```

## Stitch loop (install only when Stitch MCP workflow is requested)

```bash
npx skills add https://github.com/google-labs-code/stitch-skills --skill stitch-loop
```

## Figma implement-design (install only when Figma MCP is requested)

```bash
npx skills add https://github.com/figma/mcp-server-guide --skill implement-design
```

Recording format in topic state (`.vibe/design/<design>/state.md`):

- `mermaid_skill: done|failed`
- `stitch_skill: done|failed|not-selected`
- `figma_skill: done|failed|not-selected`
