# vibe.install Tool Reference

Use this file from `/vibe.install` Step 3.

## Shared Rules

- Set `WORKSPACE=$(pwd)` before writing configs.
- Create parent directories when missing.
- For JSON files: merge only the `vexp` entry; keep unrelated keys intact.
- If file does not exist, create the minimal valid structure.

---

## Target Files

| Tool | Config path | JSON root key |
|---|---|---|
| opencode | `.opencode/opencode.json` | `mcp.vexp` |
| claudecode | `.claude/settings.json` | `mcpServers.vexp` |
| codex | `~/.codex/config.json` | `mcp.vexp` |
| cursor | `.cursor/mcp.json` | `mcpServers.vexp` |
| windsurf | `.windsurf/mcp.json` | `mcpServers.vexp` |
| kilocode | `.kilocode/mcp.json` | `mcpServers.vexp` |
| continue | `.continue/mcpServers/vexp.yaml` | YAML file |
| aider | no direct MCP config file | bridge only |

---

## MCP Payload Snippets

### opencode (`mcp.vexp`)

```json
{
  "type": "local",
  "command": ["vexp", "mcp", "--workspace", "$WORKSPACE"],
  "enabled": true
}
```

### claudecode (`mcpServers.vexp`)

```json
{
  "command": "vexp",
  "args": ["mcp", "--workspace", "$WORKSPACE"],
  "env": {}
}
```

### codex (`mcp.vexp`)

```json
{
  "type": "local",
  "command": ["vexp", "mcp", "--workspace", "$WORKSPACE"],
  "enabled": true
}
```

### cursor (`mcpServers.vexp`)

```json
{
  "command": "vexp",
  "args": ["mcp", "--workspace", "$WORKSPACE"]
}
```

### windsurf (`mcpServers.vexp`)

```json
{
  "command": "vexp",
  "args": ["mcp", "--workspace", "$WORKSPACE"]
}
```

### kilocode (`mcpServers.vexp`)

```json
{
  "command": "vexp",
  "args": ["mcp", "--workspace", "$WORKSPACE"],
  "disabled": false
}
```

### continue (`.continue/mcpServers/vexp.yaml`)

```yaml
name: VEXP
version: 0.0.1
schema: v1
mcpServers:
  - name: vexp
    type: stdio
    command: vexp
    args:
      - mcp
      - --workspace
      - $WORKSPACE
```

### aider

No direct MCP config file is written for Aider.

Recommended bridge path:

```bash
pip install aider-mcp
uvx aider-mcp --repo-path $(pwd)
```

Then MCP clients (Claude/Cursor/OpenCode/etc.) call Aider via the bridge.

---

## Workflow Notes

- Codex slash command format uses hyphen style (example: `/gsd-plan-phase`).
- Continue MCP works in Agent Mode.
- Cursor/Kilo usually require window reload after config updates.

---

## State Output Convention

- success: `- <tool> VEXP MCP: ✅`
- bridge/info: `- aider VEXP MCP: ℹ️ via bridge`
- failure: `- <tool> VEXP MCP: ❌ failed: {reason}`
