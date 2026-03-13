---
name: vibe.skills
description: Quét project, tự động gợi ý và tạo .agents/skills/ cùng context files. Linh hoạt nhận diện mọi tech stack.
---

## Bước 0: Đọc State & Setup

```bash
cat .vibe/state.md
mkdir -p .agents/skills .agents/context

```

- Nếu `[SKILLS] status: ✅ done` → hiển thị skills đã có, hỏi "Thêm skill mới hay tạo lại?"
- Ghi: `## [SKILLS] status: 🔄 in-progress`
- Đọc từ state: `stack`, `domain`, `adrs`, `constraints`.

---

## Bước 1: Quét Project & Đề xuất Skill (Dynamic Detection)

> AI tự động phân tích cấu trúc dự án (ví dụ: package.json, requirements.txt, go.mod...) và đối chiếu với `stack` trong state.

```bash
# Lệnh tìm kiếm và phân tích skill dựa trên tech stack được phát hiện
npx skills find <tech_stack_phát_hiện_được>

```

**Workflow của AI tại bước này:**

1. Đọc kết quả từ lệnh trên.
2. Hiển thị danh sách các skills phù hợp nhất với project.
3. **Hỏi User:** _"Dựa trên project của bạn, tôi đề xuất tạo các skills: [Skill A, Skill B, Skill C]. Bạn muốn tôi tự động tạo tất cả, hay chỉ chọn một vài skill cụ thể?"_

---

## Bước 2: Tạo Skill Files

> AI chỉ tạo skill cho những tech **được chốt** từ Bước 1. Skip những skill đã có tên trong `skills: [...]` của state.

Mỗi file `.agents/skills/{tên_skill}/SKILL.md` sẽ được AI tự động viết dựa trên template chuẩn sau:

```markdown
# Skill: {Tên Skill}

> Dùng khi: ... · Không dùng khi: ...

## Pattern chuẩn (Code thực tế, phù hợp với kiến trúc project hiện tại)

## Checklist triển khai

## Anti-patterns ❌ (Các lỗi cần tránh với tech này)

## Ví dụ trong project này
```

✍️ Sau khi tạo xong mỗi file: tự động cập nhật tên skill đó vào danh sách `skills: [...]` trong state.

---

## Bước 3: Context Files

### `.agents/context/domain.md`

> Skip nếu `- .agents/context/domain.md: ✅`
> Điền từ `state[5/8]`:

```markdown
# Domain Knowledge

## Business Rules · Thuật ngữ · Edge Cases
```

✍️ Ghi: `- .agents/context/domain.md: ✅`

### `.agents/context/tech-decisions.md`

> Skip nếu `- .agents/context/tech-decisions.md: ✅`
> Điền từ `state[4/8]`:

```markdown
# Technical Decisions

## Decision Log · Known Gotchas
```

✍️ Ghi: `- .agents/context/tech-decisions.md: ✅`

### `.agents/context/workflow.md`

> Skip nếu `- .agents/context/workflow.md: ✅` — cần `[DETECT] ✅` trước
> Điền từ `state.recommendation`:

```markdown
# Workflow Reference

## Tool: {Công cụ quản lý state/task đang dùng}

## Commands — (Cú pháp lệnh thực thi)

## Feature Workflow: idea → spec → plan → execute → verify
```

✍️ Ghi: `- .agents/context/workflow.md: ✅`

---

## Bước 4: Ghi State Cuối Cùng

```markdown
## [SKILLS] status: ✅ done

- .agents/context/domain.md: ✅
- .agents/context/tech-decisions.md: ✅
- .agents/context/workflow.md: ✅
- skills: [{danh_sách_tên_các_skills_vừa_được_tạo}]
```
