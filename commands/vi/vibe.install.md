---
name: vibe.install
description: Detect tool AI đã chọn, cài VEXP MCP cho từng tool, rồi khởi tạo workflow theo recommendation.
---

Giữ file này ngắn gọn, tập trung orchestration. Chi tiết từng tool đặt trong `reference/`.

## Bước 0: Đọc State (bắt buộc)

```bash
cat .vibe/state.md
```

Guards:

- Nếu `[DETECT] confirmed: false` -> dừng: `Cần confirm tool trước. Chạy /vibe.detect`.
- Nếu `[INSTALL] status: ✅ done` -> hiển thị tóm tắt hiện tại và hỏi `Chạy lại không? (y/n)`.
- Ghi: `## [INSTALL] status: 🔄 in-progress`.

Đọc từ state: `recommendation`, `workspace`, `[TOOLS] selected` (nếu có).

---

## Bước 1: Detect + Confirm danh sách tool

Dùng các kiểm tra nhanh:

| # | Tool | Detect khi |
|---|---|---|
| 1 | opencode | `command -v opencode` HOẶC `.opencode/opencode.json` |
| 2 | claudecode | `command -v claude` |
| 3 | codex | `command -v codex` HOẶC `~/.codex/config.json` |
| 4 | cursor | `.cursor/mcp.json` HOẶC có Cursor settings |
| 5 | windsurf | `command -v windsurf` HOẶC `.windsurf/mcp.json` |
| 6 | kilocode | `command -v kilocode` HOẶC `.kilocode/mcp.json` |
| 7 | continue | `.continue/` HOẶC `~/.continue/config.yaml|json` |
| 8 | aider | `command -v aider` |

Hiển thị danh sách detect được, sau đó hỏi user confirm hoặc override:

- Enter = giữ nguyên detect
- Number = `1..8` theo mapping trên
- Name = `opencode claudecode codex cursor windsurf kilocode continue aider`

Rule parse:

- Bỏ giá trị không hợp lệ
- Loại trùng
- Nếu rỗng thì hỏi lại một lần để chọn ít nhất 1 tool hợp lệ

Ghi/cập nhật state:

```markdown
## [TOOLS]
selected: opencode codex cursor
```

---

## Bước 2: Init VEXP một lần

```bash
if ! command -v vexp >/dev/null 2>&1; then
  echo "⚠️ chưa có vexp CLI: npm install -g vexp-cli"
  echo "Tạm bỏ qua bước setup VEXP"
else
  [ -f .vexp/manifest.json ] || vexp setup
  grep -q ".vexp/index.db" .gitignore 2>/dev/null || \
    printf "\n# VEXP\n.vexp/index.db\n.vexp/daemon.*\n.vexp/mcp.port\n" >> .gitignore
fi
```

---

## Bước 3: Cài MCP cho từng tool đã chọn

Đọc file reference cùng cấp trước:

`reference/vibe.install.tools.md`

Với mỗi tool trong `[TOOLS] selected`:

1. Áp dụng block config tương ứng trong file reference.
2. Với JSON có sẵn: merge key `vexp`, không overwrite toàn bộ file.
3. Ghi state:
   - thành công: `- <tool> VEXP MCP: ✅`
   - info (aider): `- aider VEXP MCP: ℹ️ via bridge`
   - lỗi: `- <tool> VEXP MCP: ❌ failed: {reason}`

Idempotent:

- Nếu config `vexp` đã đúng thì giữ nguyên và vẫn mark `✅`.
- Một tool fail không được chặn các tool còn lại.

---

## Bước 4: Khởi tạo workflow tooling

### 4A) Nếu recommendation = `speckit` hoặc `hybrid`

Pre-check:

```bash
command -v specify >/dev/null 2>&1 || echo "⚠️ thiếu specify: npm install -g specify-cli"
```

Chạy theo từng tool đã chọn:

| Tool | Command |
|---|---|
| opencode | `specify init . --here --ai opencode` |
| claudecode | `specify init . --here --ai claude` |
| codex | `specify init . --here --ai codex` |
| cursor / windsurf / kilocode / continue / aider | `specify init . --here` |

Ghi state:

- `- speckit <tool>: ✅` khi thành công
- `- speckit <tool>: ❌ failed: {reason}` khi lỗi

### 4B) Nếu recommendation = `gsd` hoặc `hybrid`

```bash
npx get-shit-done-cc --version >/dev/null 2>&1 || echo "ℹ️ lần đầu sẽ tải package"
npx get-shit-done-cc --local || echo "⚠️ gsd init failed"
```

Ghi:

- `- gsd: ✅` khi thành công
- `- gsd: ❌ failed: {reason}` khi lỗi

Nhắc cú pháp command:

- OpenCode: `/gsd:plan-phase`
- Claude Code: `/project:gsd:plan-phase`
- Codex: `/gsd-plan-phase` (dùng dấu gạch ngang)

---

## Bước 5: State cuối + output

Ghi:

```markdown
## [INSTALL] status: ✅ done
```

Update `Meta.last_updated`.

In tóm tắt ngắn:

```text
✅ vibe.install complete
Tools: opencode · codex · cursor
Workflow: hybrid
Next: run /vibe.verify
```
