# Reference Tool Cho vibe.install

Dùng file này ở Bước 3 của `/vibe.install`.

## Rule chung

- Set `WORKSPACE=$(pwd)` trước khi ghi config.
- Tạo parent directory nếu chưa có.
- Với JSON: chỉ merge entry `vexp`, không ghi đè key không liên quan.
- Nếu file chưa tồn tại thì tạo cấu trúc tối thiểu hợp lệ.

---

## Đích config

| Tool | Đường dẫn config | JSON root key |
|---|---|---|
| opencode | `.opencode/opencode.json` | `mcp.vexp` |
| claudecode | `.claude/settings.json` | `mcpServers.vexp` |
| codex | `~/.codex/config.json` | `mcp.vexp` |
| cursor | `.cursor/mcp.json` | `mcpServers.vexp` |
| windsurf | `.windsurf/mcp.json` | `mcpServers.vexp` |
| kilocode | `.kilocode/mcp.json` | `mcpServers.vexp` |
| continue | `.continue/mcpServers/vexp.yaml` | file YAML |
| aider | không có file MCP trực tiếp | bridge |

---

## Snippet payload MCP

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

Aider không có file MCP trực tiếp.

Bridge đề xuất:

```bash
pip install aider-mcp
uvx aider-mcp --repo-path $(pwd)
```

Sau đó MCP client (Claude/Cursor/OpenCode...) gọi Aider qua bridge.

---

## Ghi chú workflow

- Codex dùng command kiểu gạch ngang (ví dụ: `/gsd-plan-phase`).
- Continue MCP chạy trong Agent Mode.
- Cursor/Kilo thường cần reload window sau khi đổi config.

---

## Quy ước ghi state

- thành công: `- <tool> VEXP MCP: ✅`
- bridge/info: `- aider VEXP MCP: ℹ️ via bridge`
- lỗi: `- <tool> VEXP MCP: ❌ failed: {reason}`
