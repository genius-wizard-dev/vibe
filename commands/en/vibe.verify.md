---
name: vibe.verify
description: Verify the full setup, show status from .vibe/state.md, and print the commit command.
---

## Step 0: Read State

```bash
cat .vibe/state.md
```

Print progress table:

```
Step         Status    Detail
──────────── ───────── ──────────────────────
[SCAN]       ✅ done   stack: FastAPI + LangGraph
[INTERVIEW]  ✅ done   8/8 answers
[DETECT]     ✅ done   -> speckit (score 9 vs 5)
[INSTALL]    🔄 partial opencode ✅ · codex ❌ failed
[DOCS]       ✅ done   3/3 files
[SKILLS]     ✅ done   5 skills
[VERIFY]     🔄 now
```

---

## Verify Actual Files

```bash
echo "=== CORE FILES ==="
for f in ARCHITECTURE.md CONVENTIONS.md AGENTS.md; do
  [ -f "$f" ] && echo "✓ $f ($(wc -l < $f)L)" || echo "✗ $f - MISSING"
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

## Report Errors If Any

For each `❌ failed` item in state -> show reason + fix command:

```
⚠️  Needs fixes:
  - codex VEXP MCP: ❌ -> run /vibe.install --codex-only
  - AGENTS.md: ❌ -> run /vibe.docs
```

---

## Summary + Commit

```
╔══════════════════════════════════╗
║  ✅ vibe.setup complete!         ║
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

**Next steps** (from `state.recommendation`):

- Spec-Kit: `/speckit.constitution` -> `/speckit.specify`
- GSD: `/gsd:map-codebase` -> `/gsd:new-project`
- Hybrid: `/speckit.constitution` -> `/gsd:discuss-phase 1`

---

## Write State After Completion

```
## [VERIFY] status: ✅ done
```
