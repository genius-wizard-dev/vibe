---
name: vibe.verify
description: Verify toàn bộ setup, hiển thị trạng thái từ .vibe/state.md, in commit command.
---

## Bước 0: Đọc State

```bash
cat .vibe/state.md
```

In bảng tiến độ:

```
Step         Status    Detail
──────────── ───────── ──────────────────────
[SCAN]       ✅ done   stack: FastAPI + LangGraph
[INTERVIEW]  ✅ done   8/8 câu
[DETECT]     ✅ done   → speckit (score 9 vs 5)
[INSTALL]    🔄 partial opencode ✅ · codex ❌ failed
[DOCS]       ✅ done   3/3 files
[SKILLS]     ✅ done   5 skills
[VERIFY]     🔄 now
```

---

## Verify Files Thực Tế

```bash
echo "=== CORE FILES ==="
for f in ARCHITECTURE.md CONVENTIONS.md AGENTS.md; do
  [ -f "$f" ] && echo "✓ $f ($(wc -l < $f)L)" || echo "✗ $f — MISSING"
done

echo "=== INFRA ==="
[ -f .opencode/opencode.json ] && echo "✓ opencode VEXP MCP" || echo "✗ opencode config"
[ -f ~/.codex/config.json ] && echo "✓ codex VEXP MCP" || echo "✗ codex config"
[ -f .vexp/manifest.json ] && echo "✓ .vexp/" || echo "✗ vexp (run: vexp setup)"

echo "=== WORKFLOW TOOL ==="
[ -d ".specify" ] && echo "✓ Spec-Kit (.specify/)"
[ -d ".planning" ] && echo "✓ GSD (.planning/)"

echo "=== KNOWLEDGE BASE ==="
ls .agents/skills/ 2>/dev/null | sed 's/^/  skill: /'
ls .agents/context/ 2>/dev/null | sed 's/^/  context: /'
```

---

## Báo Lỗi Nếu Có

Với mỗi item `❌ failed` trong state → hiển thị lý do + lệnh fix:

```
⚠️  Cần fix:
  - codex VEXP MCP: ❌ → chạy /vibe.install --codex-only
  - AGENTS.md: ❌ → chạy /vibe.docs
```

---

## Summary + Commit

```
╔══════════════════════════════════╗
║  ✅ vibe.setup hoàn tất!         ║
╚══════════════════════════════════╝
Tool: {recommendation} · {N} skills · {N} context files
```

```bash
git add .vibe/ .opencode/ .vexp/manifest.json .agents/ \
        ARCHITECTURE.md CONVENTIONS.md AGENTS.md \
        $([ -d .specify ] && echo ".specify/") \
        $([ -d .planning ] && echo ".planning/")
git commit -m "chore: setup AI vibe coding infrastructure"
```

**Next steps** (từ state.recommendation):

- Spec-Kit: `/speckit.constitution` → `/speckit.specify`
- GSD: `/gsd:map-codebase` → `/gsd:new-project`
- Hybrid: `/speckit.constitution` → `/gsd:discuss-phase 1`

---

## Ghi State Sau Khi Xong

```
## [VERIFY] status: ✅ done
```
