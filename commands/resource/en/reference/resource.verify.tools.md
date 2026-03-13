# resource.verify Tool Checks Reference

Use this file from `/resource.verify`.

| Tool | Path | Validation |
| --- | --- | --- |
| opencode | `.opencode/opencode.json` | valid JSON and `mcp.vexp` |
| claude | `.claude/settings.json` | valid JSON and `mcpServers.vexp` |
| codex | `~/.codex/config.json` | valid JSON and `mcp.vexp` |
| cursor | `.cursor/mcp.json` | valid JSON and `mcpServers.vexp` |
| windsurf | `.windsurf/mcp.json` | valid JSON and `mcpServers.vexp` |
| qwen | `.qwen/config.json` | valid JSON and `mcpServers.vexp` |
| continue | `.continue/mcpServers/vexp.yaml` | contains `command: vexp` |
