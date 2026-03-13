# resource.install Tool Reference

Use this file from `/resource.install`.

## Shared Rules

- Set `WORKSPACE=$(pwd)`.
- Merge only MCP `vexp` entries; preserve unrelated config keys.

## Target Files

| Tool | Config path | Key |
| --- | --- | --- |
| opencode | `.opencode/opencode.json` | `mcp.vexp` |
| claude | `.claude/settings.json` | `mcpServers.vexp` |
| codex | `~/.codex/config.json` | `mcp.vexp` |
| cursor | `.cursor/mcp.json` | `mcpServers.vexp` |
| windsurf | `.windsurf/mcp.json` | `mcpServers.vexp` |
| qwen | `.qwen/config.json` | `mcpServers.vexp` |
| continue | `.continue/mcpServers/vexp.yaml` | YAML |
