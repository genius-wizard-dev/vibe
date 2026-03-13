---
name: vibe.docs
description: Tạo ARCHITECTURE.md + CONVENTIONS.md + AGENTS.md từ .vibe/state.md. Từng file track riêng — tạo lại file nào cũng được.
---

## Bước 0: Đọc State

```bash
cat .vibe/state.md
```

- Nếu `[DOCS] status: ✅ done` → hiển thị files đã tạo, hỏi "Tạo lại file nào?"
- Nếu `[INTERVIEW] status: ⏸ pending` → báo "Cần hoàn thành interview trước"
- Ghi: `## [DOCS] status: 🔄 in-progress`

Đọc từ state: `problem`, `data_flow`, `adrs`, `constraints`, `agents`, `stack`, `recommendation`.

---

## Scan Code Patterns (chạy trước khi viết)

```bash
rg "^(def |async def |export (const|function|async function))" src/ 2>/dev/null | head -20
rg "^(class |export class )" src/ 2>/dev/null | head -10
rg "^(import |from |require)" src/ 2>/dev/null | sort | uniq | head -15
```

---

## ARCHITECTURE.md

> Skip nếu `- ARCHITECTURE.md: ✅` và không yêu cầu overwrite

Nếu đã tồn tại → đọc, merge ADRs mới vào, giữ ADRs cũ.

```markdown
# ARCHITECTURE.md

> Đọc trước khi refactor. Cập nhật khi có ADR mới.

## Overview

**Purpose:** {state[1/8]}

**Data Flow:**
{state[3/8] — ASCII}

## Service Map

| Module | Owns | Không owns |
| ------ | ---- | ---------- |

## ADRs

### ADR-001: {từ state[4/8]}

- Status: Active
- Context / Decision / Reasoning / Consequences / Rejected

## Hard Boundaries

{state[7/8] — ❌ format}

## External Services

| Service | Purpose | Config |
```

✍️ Ghi: `- ARCHITECTURE.md: ✅`

---

## CONVENTIONS.md

> Skip nếu `- CONVENTIONS.md: ✅`

```markdown
# CONVENTIONS.md

> Đọc trước khi tạo file/function/class mới.

## Naming

### Files / Functions / Classes / DB / API Routes

{từ scan thực tế}

## Error Handling

{pattern chuẩn từ scan}

## Anti-Patterns ❌

| Đừng làm | Thay bằng | Lý do |
{state[7/8] + research}

## Import Order / Logging
```

✍️ Ghi: `- CONVENTIONS.md: ✅`

---

## AGENTS.md

> Skip nếu `- AGENTS.md: ✅`

```markdown
# AGENTS.md

> Đọc TRƯỚC KHI làm bất cứ việc gì.

## Project · Stack · Workflow Tool

## Trước khi code: VEXP run_pipeline → domain.md → spec → conventions → rg pattern

## Sau khi code: lint → VEXP save_observation → update docs

## Skills / Constraints / File Map / Quick Reference
```

✍️ Ghi: `- AGENTS.md: ✅`

---

## Ghi State Sau Khi Xong

```
## [DOCS] status: ✅ done
```
