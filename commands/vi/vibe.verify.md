---
name: vibe.verify
description: Verify toàn bộ setup dựa trên .vibe/state.md, gồm MCP của tool đã chọn, workflow tooling, và docs đã tạo.
---

## Bước 0: Đọc State

```bash
cat .vibe/state.md
```

Parse từ state:

- `[TOOLS] selected`
- `recommendation`
- Tất cả block `## [STEP] status:`
- Các dòng chi tiết cài đặt có `✅ / ❌ / ℹ️`

---

## Bước 1: In bảng tiến độ

Dựng bảng theo giá trị state thực tế (không hardcode):

```text
Step          Status        Detail
───────────── ───────────── ─────────────────────────────
[SCAN]        ✅ done       stack: Node + Express
[INTERVIEW]   ✅ done       8/8 câu trả lời
[DETECT]      ✅ done       -> hybrid
[TOOLS]       ✅ selected   opencode · codex
[INSTALL]     🔄 partial    opencode ✅ · codex ❌
[DOCS]        ✅ done       3/3 files
[SKILLS]      ✅ done       4 skills
[VERIFY]      🔄 now
```

---

## Bước 2: Verify core files + VEXP

```bash
echo "=== CORE DOCS ==="
for f in ARCHITECTURE.md CONVENTIONS.md AGENTS.md; do
  [ -f "$f" ] && echo "✓ $f" || echo "✗ $f missing"
done

echo ""
echo "=== VEXP ==="
command -v vexp >/dev/null 2>&1 && echo "✓ vexp CLI" || echo "✗ thiếu vexp"
[ -f .vexp/manifest.json ] && echo "✓ .vexp/manifest.json" || echo "✗ .vexp chưa init"
grep -q ".vexp/index.db" .gitignore 2>/dev/null && echo "✓ .gitignore patched" || echo "✗ .gitignore thiếu block VEXP"
```

---

## Bước 3: Verify MCP theo tool đã chọn

Đọc file reference cùng cấp:

`reference/vibe.verify.tools.md`

Rules:

- Chỉ check các tool có trong `[TOOLS] selected`
- Với JSON: check file tồn tại, JSON hợp lệ, có key `vexp` ở vị trí đúng
- Với Continue: check `.continue/mcpServers/vexp.yaml` tồn tại và có `command: vexp`
- Với Aider: check CLI; MCP là dạng bridge (`ℹ️`, không có file config trực tiếp)

In kết quả khi check:

- `✓ <tool> ...` nếu pass
- `⚠ <tool> ...` nếu thiếu key/partial
- `✗ <tool> ...` nếu thiếu file hoặc JSON lỗi

---

## Bước 4: Verify workflow tooling

Nếu `recommendation` có `speckit`:

```bash
command -v specify >/dev/null 2>&1 && echo "✓ specify CLI" || echo "✗ thiếu specify"
[ -d .specify ] && echo "✓ .specify/" || echo "✗ thiếu .specify/"
```

Nếu `recommendation` có `gsd`:

```bash
[ -d .planning ] && echo "✓ .planning/" || echo "✗ thiếu .planning/"
```

---

## Bước 5: Verify knowledge base

```bash
echo "=== KNOWLEDGE BASE ==="
SKILLS=$(ls .agents/skills/ 2>/dev/null | wc -l | tr -d ' ')
CTX=$(ls .agents/context/ 2>/dev/null | wc -l | tr -d ' ')
echo "skills:  $SKILLS"
echo "context: $CTX"
```

---

## Bước 6: Báo lỗi

Nhóm tất cả lỗi thành block có thể hành động ngay:

```text
⚠️ Issues found

MCP:
  codex -> ~/.codex/config.json missing
  Fix: chạy /vibe.install và chọn lại codex

Docs:
  AGENTS.md missing
  Fix: chạy /vibe.docs
```

Nếu không có lỗi: in `✅ Everything looks good`.

---

## Bước 7: Summary + commit command

In tóm tắt ngắn:

```text
✅ vibe.verify complete
Tools: opencode · codex
Flow: hybrid
Skills: 4
```

Build commit command động (chỉ thêm path đang tồn tại):

```bash
PATHS=".vibe/"
[ -f .vexp/manifest.json ] && PATHS="$PATHS .vexp/manifest.json"
[ -d .agents ] && PATHS="$PATHS .agents/"
[ -f ARCHITECTURE.md ] && PATHS="$PATHS ARCHITECTURE.md"
[ -f CONVENTIONS.md ] && PATHS="$PATHS CONVENTIONS.md"
[ -f AGENTS.md ] && PATHS="$PATHS AGENTS.md"
[ -d .specify ] && PATHS="$PATHS .specify/"
[ -d .planning ] && PATHS="$PATHS .planning/"

git add $PATHS
git commit -m "chore: setup AI vibe coding infrastructure"
```

---

## Bước 8: Ghi state cuối

```markdown
## [VERIFY] status: ✅ done
```

Update `Meta.last_updated`.
