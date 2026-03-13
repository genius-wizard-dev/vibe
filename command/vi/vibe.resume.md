---
name: vibe.resume
description: Shortcut — đọc .vibe/state.md, hiển thị tiến độ, hỏi muốn tiếp tục hay chạy lại bước nào.
---

```bash
cat .vibe/state.md 2>/dev/null || echo "Chưa có state. Chạy /vibe.setup để bắt đầu."
```

Phân tích và hiển thị:

```
📋 vibe.setup progress — {project}
Last updated: {datetime}

  ✅ SCAN       stack: {stack}
  ✅ INTERVIEW  8/8 câu đã trả lời
  ✅ DETECT     → {recommendation}
  🔄 INSTALL    opencode ✅ · codex ❌
  ⏸ DOCS       chưa chạy
  ⏸ SKILLS     chưa chạy
  ⏸ VERIFY     chưa chạy

Muốn làm gì?
  1. Tiếp tục từ bước tiếp theo (INSTALL)
  2. Chạy lại một bước cụ thể
  3. Reset và bắt đầu lại
```

Đợi user chọn:

- **1 / tiếp tục / continue:** gọi `/vibe.setup` (sẽ tự skip bước đã xong)
- **2 / chọn bước:** gọi thẳng command tương ứng (`/vibe.install`, `/vibe.docs`, v.v.)
- **3 / reset:** `rm .vibe/state.md` → gọi `/vibe.setup`
- **"chạy lại [bước]":** xóa status của bước đó trong state → gọi command đó
