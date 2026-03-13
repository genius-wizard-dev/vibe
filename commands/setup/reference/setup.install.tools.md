# setup.install Tool Reference

## Tool detection map

| # | Tool | Detect when |
| --- | --- | --- |
| 1 | opencode | `command -v opencode` or `.opencode/opencode.json` |
| 2 | claudecode | `command -v claude` |
| 3 | codex | `command -v codex` or `~/.codex/config.json` |
| 4 | cursor | `.cursor/mcp.json` |
| 5 | windsurf | `command -v windsurf` or `.windsurf/mcp.json` |
| 6 | kilocode | `command -v kilocode` or `.kilocode/mcp.json` |
| 7 | continue | `.continue/` or `~/.continue/config.yaml|json` |
| 8 | aider | `command -v aider` |

## VEXP bootstrap

```bash
if ! command -v vexp >/dev/null 2>&1; then
  echo "vexp cli missing: npm install -g vexp-cli"
else
  [ -f .vexp/manifest.json ] || vexp setup
fi
```

## MCP merge rules

- merge only `vexp` key
- never overwrite whole config file
- idempotent: if already configured, keep as success

## Workflow init

### Spec-Kit

```bash
command -v uv >/dev/null 2>&1 || curl -LsSf https://astral.sh/uv/install.sh | sh
uvx --from git+https://github.com/github/spec-kit.git specify init --here --ai claude
```

### GSD / BMAD runtime bootstrap

```bash
npx get-shit-done-cc --local
```

Runtime-specific examples:

```bash
npx get-shit-done-cc --claude --local
npx get-shit-done-cc --opencode --global
npx get-shit-done-cc --gemini --global
npx get-shit-done-cc --codex --local
```
