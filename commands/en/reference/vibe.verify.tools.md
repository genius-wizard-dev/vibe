# vibe.verify Tool Checks Reference

Use this file from `/vibe.verify` Step 3.

## Check Matrix

| Tool       | Path                             | Validation                               |
| ---------- | -------------------------------- | ---------------------------------------- |
| opencode   | `.opencode/opencode.json`        | valid JSON and `mcp.vexp` exists         |
| claudecode | `.claude/settings.json`          | valid JSON and `mcpServers.vexp` exists  |
| codex      | `~/.codex/config.json`           | valid JSON and `mcp.vexp` exists         |
| cursor     | `.cursor/mcp.json`               | valid JSON and `mcpServers.vexp` exists  |
| windsurf   | `.windsurf/mcp.json`             | valid JSON and `mcpServers.vexp` exists  |
| kilocode   | `.kilocode/mcp.json`             | valid JSON and `mcpServers.vexp` exists  |
| continue   | `.continue/mcpServers/vexp.yaml` | file exists and contains `command: vexp` |
| aider      | CLI check only                   | `command -v aider` (bridge-based MCP)    |

---

## JSON Verification Pattern

Use equivalent logic for each JSON-based tool:

```python
import json

cfg = json.load(open("path/to/file.json"))
ok = "vexp" in cfg.get("mcpServers", {})
print("pass" if ok else "missing-key")
```

For tools using `mcp` root key, replace `mcpServers` with `mcp`.

---

## Output Convention

- Pass: `✓ <tool> -> <path> [vexp ✓]`
- Missing key: `⚠ <tool> -> vexp key missing`
- Invalid JSON: `✗ <tool> -> invalid JSON: {error}`
- Missing file: `✗ <tool> -> <path> missing`
- Bridge info (aider): `ℹ aider -> MCP via bridge`

---

## Notes

- Continue check is string-based (`command: vexp`) because file is YAML.
- Aider does not consume MCP directly; treat bridge status as informational unless user explicitly requires bridge tooling.
