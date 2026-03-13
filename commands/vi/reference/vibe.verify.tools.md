# Reference Check Tool Cho vibe.verify

Dùng file này ở Bước 3 của `/vibe.verify`.

## Ma trận kiểm tra

| Tool       | Path                             | Validation                          |
| ---------- | -------------------------------- | ----------------------------------- |
| opencode   | `.opencode/opencode.json`        | JSON hợp lệ và có `mcp.vexp`        |
| claudecode | `.claude/settings.json`          | JSON hợp lệ và có `mcpServers.vexp` |
| codex      | `~/.codex/config.json`           | JSON hợp lệ và có `mcp.vexp`        |
| cursor     | `.cursor/mcp.json`               | JSON hợp lệ và có `mcpServers.vexp` |
| windsurf   | `.windsurf/mcp.json`             | JSON hợp lệ và có `mcpServers.vexp` |
| kilocode   | `.kilocode/mcp.json`             | JSON hợp lệ và có `mcpServers.vexp` |
| continue   | `.continue/mcpServers/vexp.yaml` | file tồn tại và có `command: vexp`  |
| aider      | chỉ check CLI                    | `command -v aider` (MCP qua bridge) |

---

## Pattern check JSON

Dùng logic tương đương cho từng tool JSON:

```python
import json

cfg = json.load(open("path/to/file.json"))
ok = "vexp" in cfg.get("mcpServers", {})
print("pass" if ok else "missing-key")
```

Với tool dùng key gốc `mcp` thì thay `mcpServers` bằng `mcp`.

---

## Quy ước output

- Pass: `✓ <tool> -> <path> [vexp ✓]`
- Thiếu key: `⚠ <tool> -> thiếu key vexp`
- JSON lỗi: `✗ <tool> -> invalid JSON: {error}`
- Thiếu file: `✗ <tool> -> <path> missing`
- Bridge info (aider): `ℹ aider -> MCP via bridge`

---

## Notes

- Continue check dạng string (`command: vexp`) vì file YAML.
- Aider không dùng MCP trực tiếp; bridge là thông tin tham khảo trừ khi user yêu cầu bắt buộc kiểm bridge tooling.
