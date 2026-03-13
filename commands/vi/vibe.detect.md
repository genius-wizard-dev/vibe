---
name: vibe.detect
description: Chạy scoring matrix → recommend GSD/Spec-Kit/Hybrid. Đọc CONTEXT từ .vibe/state.md, ghi kết quả lại.
---

## Bước 0: Đọc State

```bash
cat .vibe/state.md
```

- Nếu `[DETECT] status: ✅ done` → hiển thị kết quả cũ, hỏi "Chạy lại không?"
- Nếu `[INTERVIEW] status: ⏸ pending` → báo "Cần hoàn thành interview trước. Chạy `/vibe.setup`"
- Ghi: `## [DETECT] status: 🔄 in-progress`

Lấy CONTEXT từ state: `phase`, `data_flow`, `adrs`, `domain`, `iteration`, `agents`.

---

## Scoring Matrix

| Signal                      | GSD | Spec-Kit |
| --------------------------- | --- | -------- |
| phase = brownfield/refactor | +2  | +1       |
| phase = greenfield          | +1  | +2       |
| iteration = fast            | +3  | 0        |
| iteration = structured      | 0   | +3       |
| iteration = mixed           | +1  | +1       |
| data_flow hops ≥ 4          | +1  | +2       |
| domain rules phức tạp       | 0   | +2       |
| adrs ≥ 3                    | 0   | +2       |
| agents ≥ 2 runtimes         | +2  | +1       |

Tính điểm → in bảng → recommend:

- Chênh ≥ 3: tool thắng
- Chênh ≤ 2: **Hybrid**

Hỏi confirm: "Recommend **[X]**. Đồng ý không?"

---

## Ghi State Sau Khi Confirm

```
## [DETECT] status: ✅ done
gsd_score: {X}
speckit_score: {Y}
recommendation: {gsd | speckit | hybrid}
confirmed: true
```

Update `last_updated` trong Meta.
