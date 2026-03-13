---
name: vibe.setup
description: Bootstrap AI Vibe Coding stack. Resume-safe — dừng ở đâu chạy lại từ đó. State lưu tại .vibe/state.md
---

Bạn là AI infrastructure orchestrator. **Luôn đọc `.vibe/state.md` trước** để biết đang ở đâu.

---

## Bước 0: Đọc State (LUÔN làm đầu tiên)

```bash
cat .vibe/state.md 2>/dev/null || echo "NO_STATE"
```

**Nếu file tồn tại:** Phân tích các `status:` → bỏ qua bước đã `✅ done` → tiếp tục từ bước đầu tiên chưa xong.

Thông báo:

```
▶ Resuming from [BƯỚC] — [X/6] bước đã hoàn thành
  ✅ scan · ✅ interview · 🔄 detect · ⏸ install · ⏸ docs · ⏸ skills
```

**Nếu không có file:** Tạo mới và bắt đầu từ đầu:

```bash
mkdir -p .vibe
```

Tạo `.vibe/state.md` theo template ở cuối file này.

---

## Bước 1: Scan

> Skip nếu `[SCAN] status: ✅ done`

```bash
echo "=== WORKSPACE ===" && pwd
echo "=== STACK ==="
[ -f package.json ] && cat package.json | python3 -c "import sys,json; d=json.load(sys.stdin); print('Node:', d.get('name'), list(d.get('dependencies',{}).keys())[:12])"
[ -f pyproject.toml ] && head -20 pyproject.toml
[ -f requirements.txt ] && head -15 requirements.txt
echo "=== EXISTING SETUP ==="
for f in AGENTS.md ARCHITECTURE.md CONVENTIONS.md .opencode/ .vexp/ .specify/ .planning/ .codex/; do
  [ -e "$f" ] && echo "✓ $f" || echo "✗ $f"
done
echo "=== TOOLS ==="
which specify 2>/dev/null && echo "✓ specify" || echo "✗ specify"
npx get-shit-done-cc --version 2>/dev/null && echo "✓ gsd" || echo "✗ gsd"
which vexp 2>/dev/null && echo "✓ vexp" || echo "✗ vexp"
echo "=== SOURCE ===" && find . -type f \( -name "*.py" -o -name "*.ts" -o -name "*.go" \) | grep -v node_modules | grep -v .git | head -20
echo "=== INFRA ===" && ls docker-compose*.yml Dockerfile* .env.example 2>/dev/null
git log --oneline -5 2>/dev/null
```

✍️ **Ghi vào state sau khi xong:**

```
## [SCAN] status: ✅ done
stack: {tên tech stack}
phase: {greenfield | brownfield | refactor}
source_files: {count}
infra: {docker-compose / none}
```

---

## Bước 2: Interview

> Skip nếu `[INTERVIEW] status: ✅ done`
> Nếu một số câu đã có → đọc lại, chỉ hỏi câu còn `~`

Hỏi tuần tự, đợi từng câu. ✍️ Ghi vào state ngay sau mỗi câu:

**[1/8]** Project giải quyết vấn đề gì? User là ai?
→ ghi: `- [1/8] problem: {answer}`

**[2/8]** Đang ở giai đoạn nào? 🌱 Greenfield · 🏗️ Brownfield · 🔄 Refactor
→ ghi: `- [2/8] phase: {answer}`

**[3/8]** Data flow? (`A → B → C → D`)
→ ghi: `- [3/8] data_flow: {answer}`

**[4/8]** 2–4 quyết định kỹ thuật lớn + trade-offs?
→ ghi: `- [4/8] adrs: {answer}`

**[5/8]** Domain rules đặc thù? Thuật ngữ ngành?
→ ghi: `- [5/8] domain: {answer}`

**[6/8]** Iteration speed? ⚡ Fast · 📐 Structured · 🔀 Mixed
→ ghi: `- [6/8] iteration: {answer}`

**[7/8]** Anti-patterns cấm? Hard boundaries?
→ ghi: `- [7/8] constraints: {answer}`

**[8/8]** Agent nào đang dùng? (opencode / codex / claude / gemini)
→ ghi: `- [8/8] agents: {answer}`

Sau câu cuối: update `## [INTERVIEW] status: ✅ done`

---

## Bước 3: Spawn Agents Song Song

> Skip từng agent nếu status tương ứng đã `✅ done`

Đọc toàn bộ state → build CONTEXT → spawn:

| Agent | Command                 | Skip nếu       |
| ----- | ----------------------- | -------------- |
| **A** | `/vibe.detect`          | `[DETECT] ✅`  |
| **B** | `/vibe.docs`            | `[DOCS] ✅`    |
| **C** | `/vibe.skills`          | `[SKILLS] ✅`  |
| **D** | `/vibe.install` (sau A) | `[INSTALL] ✅` |

Sau khi tất cả xong → `/vibe.verify`

---

## Edge Cases

- **Resume:** chạy lại `/vibe.setup` → tự đọc state, bỏ qua bước đã xong
- **Chạy lại 1 bước:** gọi thẳng `/vibe.detect`, `/vibe.docs`, v.v. — đọc state độc lập
- **Chạy lại 1 bước từ đầu:** xóa dòng status tương ứng trong `.vibe/state.md` → chạy lại
- **Reset hoàn toàn:** `rm .vibe/state.md` → chạy lại `/vibe.setup`
- **Tool lỗi:** ghi `❌ failed: {lý do}`, tiếp tục bước khác, báo lại ở verify
- **Đổi model/tool:** state vẫn đọc được vì plain markdown

---

## State File Template

Tạo `.vibe/state.md` khi không có file:

```markdown
# .vibe/state.md

# Checkpoint — AI đọc để resume. Đừng xóa.

# status: ✅ done | 🔄 in-progress | ⏸ pending | ❌ failed

## Meta

- created: {datetime}
- last_updated: {datetime}
- project: {name}
- workspace: {pwd}

## [SCAN] status: ⏸ pending

stack: ~
phase: ~
source_files: ~
infra: ~

## [INTERVIEW] status: ⏸ pending

- [1/8] problem: ~
- [2/8] phase: ~
- [3/8] data_flow: ~
- [4/8] adrs: ~
- [5/8] domain: ~
- [6/8] iteration: ~
- [7/8] constraints: ~
- [8/8] agents: ~

## [DETECT] status: ⏸ pending

gsd_score: ~
speckit_score: ~
recommendation: ~
confirmed: false

## [INSTALL] status: ⏸ pending

- opencode VEXP MCP: ⏸
- codex VEXP MCP: ⏸
- speckit opencode: ⏸
- speckit codex: ⏸
- gsd opencode: ⏸
- gsd codex: ⏸

## [DOCS] status: ⏸ pending

- ARCHITECTURE.md: ⏸
- CONVENTIONS.md: ⏸
- AGENTS.md: ⏸

## [SKILLS] status: ⏸ pending

- .agents/context/domain.md: ⏸
- .agents/context/tech-decisions.md: ⏸
- .agents/context/workflow.md: ⏸
- skills: []

## [VERIFY] status: ⏸ pending
```
