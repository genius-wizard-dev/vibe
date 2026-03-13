---
name: vibe.verify
description: Verify full vibe setup from .vibe/state.md, including selected MCP targets, workflow tooling, and generated docs.
---

## Step 0: Read State

```bash
cat .vibe/state.md
```

Parse from state:

- `[TOOLS] selected`
- `recommendation`
- All `## [STEP] status:` blocks
- Any `✅ / ❌ / ℹ️` install detail lines

---

## Step 1: Print Progress Table

Build table from state values (no hardcoded statuses):

```text
Step          Status        Detail
───────────── ───────────── ─────────────────────────────
[SCAN]        ✅ done       stack: Node + Express
[INTERVIEW]   ✅ done       8/8 answers
[DETECT]      ✅ done       -> hybrid
[TOOLS]       ✅ selected   opencode · codex
[INSTALL]     🔄 partial    opencode ✅ · codex ❌
[DOCS]        ✅ done       3/3 files
[SKILLS]      ✅ done       4 skills
[VERIFY]      🔄 now
```

---

## Step 2: Verify Core Files + VEXP

```bash
echo "=== CORE DOCS ==="
for f in ARCHITECTURE.md CONVENTIONS.md AGENTS.md; do
  [ -f "$f" ] && echo "✓ $f" || echo "✗ $f missing"
done

echo ""
echo "=== VEXP ==="
command -v vexp >/dev/null 2>&1 && echo "✓ vexp CLI" || echo "✗ vexp missing"
[ -f .vexp/manifest.json ] && echo "✓ .vexp/manifest.json" || echo "✗ .vexp not initialized"
grep -q ".vexp/index.db" .gitignore 2>/dev/null && echo "✓ .gitignore patched" || echo "✗ .gitignore missing VEXP block"
```

---

## Step 3: Verify MCP Per Selected Tool

Read sibling reference file:

`reference/vibe.verify.tools.md`

Rules:

- Run checks only for tools in `[TOOLS] selected`
- For JSON configs: verify file exists, valid JSON, and `vexp` key exists at expected location
- For Continue: verify `.continue/mcpServers/vexp.yaml` exists and contains `command: vexp`
- For Aider: verify CLI exists; MCP is bridge-based (`ℹ️`, no direct config file)

Write result lines as you verify:

- `✓ <tool> ...` for pass
- `⚠ <tool> ...` for partial/missing key
- `✗ <tool> ...` for missing file/invalid config

---

## Step 4: Verify Workflow Tooling

If `recommendation` includes `speckit`:

```bash
command -v specify >/dev/null 2>&1 && echo "✓ specify CLI" || echo "✗ specify missing"
[ -d .specify ] && echo "✓ .specify/" || echo "✗ .specify/ missing"
```

If `recommendation` includes `gsd`:

```bash
[ -d .planning ] && echo "✓ .planning/" || echo "✗ .planning/ missing"
```

---

## Step 5: Verify Knowledge Base

```bash
echo "=== KNOWLEDGE BASE ==="
SKILLS=$(ls .agents/skills/ 2>/dev/null | wc -l | tr -d ' ')
CTX=$(ls .agents/context/ 2>/dev/null | wc -l | tr -d ' ')
echo "skills:  $SKILLS"
echo "context: $CTX"
```

---

## Step 6: Report Issues

Group all failures into actionable blocks:

```text
⚠️ Issues found

MCP:
  codex -> ~/.codex/config.json missing
  Fix: run /vibe.install and reselect codex

Docs:
  AGENTS.md missing
  Fix: run /vibe.docs
```

If no failures, print: `✅ Everything looks good`.

---

## Step 7: Summary + Commit Command

Print compact summary:

```text
✅ vibe.verify complete
Tools: opencode · codex
Flow: hybrid
Skills: 4
```

Build commit command dynamically (include only existing paths):

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

## Step 8: Write Final State

```markdown
## [VERIFY] status: ✅ done
```

Update `Meta.last_updated`.
