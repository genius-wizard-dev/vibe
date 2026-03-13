---
name: vibe.install
description: Detect selected AI tools, install VEXP MCP for each selected tool, then initialize workflow tooling based on recommendation.
---

Keep this file orchestration-first. Put long per-tool snippets in `reference/`.

## Step 0: Read State (required)

```bash
cat .vibe/state.md
```

Guards:

- If `[DETECT] confirmed: false` -> stop: `Tool selection must be confirmed first. Run /vibe.detect`.
- If `[INSTALL] status: ✅ done` -> show current install summary and ask `Run again? (y/n)`.
- Write: `## [INSTALL] status: 🔄 in-progress`.

Read from state: `recommendation`, `workspace`, `[TOOLS] selected` (if present).

---

## Step 1: Detect + Confirm Tool Targets

Use these quick checks:

| # | Tool | Detect when |
|---|---|---|
| 1 | opencode | `command -v opencode` OR `.opencode/opencode.json` |
| 2 | claudecode | `command -v claude` |
| 3 | codex | `command -v codex` OR `~/.codex/config.json` |
| 4 | cursor | `.cursor/mcp.json` OR Cursor settings file exists |
| 5 | windsurf | `command -v windsurf` OR `.windsurf/mcp.json` |
| 6 | kilocode | `command -v kilocode` OR `.kilocode/mcp.json` |
| 7 | continue | `.continue/` OR `~/.continue/config.yaml|json` |
| 8 | aider | `command -v aider` |

Show detected list, then ask user to confirm or override:

- Enter = keep detected list
- Numbers = `1..8` mapping above
- Names = `opencode claudecode codex cursor windsurf kilocode continue aider`

Validation rules:

- Remove unknown values
- Remove duplicates
- If result is empty, ask once for at least one valid tool

Write/update state:

```markdown
## [TOOLS]
selected: opencode codex cursor
```

---

## Step 2: Init VEXP Once

```bash
if ! command -v vexp >/dev/null 2>&1; then
  echo "⚠️ vexp CLI not found: npm install -g vexp-cli"
  echo "Skipping VEXP setup for now"
else
  [ -f .vexp/manifest.json ] || vexp setup
  grep -q ".vexp/index.db" .gitignore 2>/dev/null || \
    printf "\n# VEXP\n.vexp/index.db\n.vexp/daemon.*\n.vexp/mcp.port\n" >> .gitignore
fi
```

---

## Step 3: Install MCP Per Selected Tool

Read sibling reference file first:

`reference/vibe.install.tools.md`

For each tool in `[TOOLS] selected`:

1. Apply the tool-specific config from the reference file.
2. Preserve unrelated keys in existing JSON files (merge, do not replace whole file).
3. Write status line in state:
   - success: `- <tool> VEXP MCP: ✅`
   - partial/info (aider): `- aider VEXP MCP: ℹ️ via bridge`
   - failure: `- <tool> VEXP MCP: ❌ failed: {reason}`

Idempotency:

- If exact `vexp` config already exists, keep it and still mark as `✅`.
- Continue installing other tools even if one tool fails.

---

## Step 4: Initialize Workflow Tooling

### 4A) If recommendation = `speckit` or `hybrid`

Pre-check:

```bash
command -v specify >/dev/null 2>&1 || echo "⚠️ specify missing: npm install -g specify-cli"
```

Run per selected tool:

| Tool | Command |
|---|---|
| opencode | `specify init . --here --ai opencode` |
| claudecode | `specify init . --here --ai claude` |
| codex | `specify init . --here --ai codex` |
| cursor / windsurf / kilocode / continue / aider | `specify init . --here` |

Write status lines:

- `- speckit <tool>: ✅` on success
- `- speckit <tool>: ❌ failed: {reason}` on failure

### 4B) If recommendation = `gsd` or `hybrid`

```bash
npx get-shit-done-cc --version >/dev/null 2>&1 || echo "ℹ️ first run will download package"
npx get-shit-done-cc --local || echo "⚠️ gsd init failed"
```

Write:

- `- gsd: ✅` on success
- `- gsd: ❌ failed: {reason}` on failure

Command syntax reminder:

- OpenCode: `/gsd:plan-phase`
- Claude Code: `/project:gsd:plan-phase`
- Codex: `/gsd-plan-phase` (hyphen format)

---

## Step 5: Final State + Output

Write:

```markdown
## [INSTALL] status: ✅ done
```

Update `Meta.last_updated`.

Print concise summary:

```text
✅ vibe.install complete
Tools: opencode · codex · cursor
Workflow: hybrid
Next: run /vibe.verify
```
