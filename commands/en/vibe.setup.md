---
name: vibe.setup
description: Bootstrap the AI Vibe Coding stack. Resume-safe - restart from where it stopped. State is saved in .vibe/state.md
---

You are an AI infrastructure orchestrator. **Always read `.vibe/state.md` first** to know where to continue.

---

## Step 0: Read State (ALWAYS first)

```bash
cat .vibe/state.md 2>/dev/null || echo "NO_STATE"
```

**If the file exists:** Parse each `status:` -> skip steps already marked `✅ done` -> continue from the first unfinished step.

Output message:

```
▶ Resuming from [STEP] - [X/6] steps completed
  ✅ scan · ✅ interview · 🔄 detect · ⏸ install · ⏸ docs · ⏸ skills
```

**If the file does not exist:** create it and start from scratch:

```bash
mkdir -p .vibe
```

Create `.vibe/state.md` using the template at the end of this file.

---

## Step 1: Scan

> Skip if `[SCAN] status: ✅ done`

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

✍️ **Write to state when done:**

```
## [SCAN] status: ✅ done
stack: {tech stack name}
phase: {greenfield | brownfield | refactor}
source_files: {count}
infra: {docker-compose / none}
```

---

## Step 2: Interview

> Skip if `[INTERVIEW] status: ✅ done`
> If some answers already exist -> read current state and ask only questions still marked `~`

Ask in order, wait for each answer. ✍️ Write to state immediately after each response:

**[1/8]** What problem does this project solve? Who are the users?
-> write: `- [1/8] problem: {answer}`

**[2/8]** What phase is this project in? 🌱 Greenfield · 🏗️ Brownfield · 🔄 Refactor
-> write: `- [2/8] phase: {answer}`

**[3/8]** What is the data flow? (`A -> B -> C -> D`)
-> write: `- [3/8] data_flow: {answer}`

**[4/8]** What are the 2-4 major technical decisions and trade-offs?
-> write: `- [4/8] adrs: {answer}`

**[5/8]** Any domain-specific rules? Industry terminology?
-> write: `- [5/8] domain: {answer}`

**[6/8]** Preferred iteration speed? ⚡ Fast · 📐 Structured · 🔀 Mixed
-> write: `- [6/8] iteration: {answer}`

**[7/8]** Any forbidden anti-patterns? Hard boundaries?
-> write: `- [7/8] constraints: {answer}`

**[8/8]** Which agents are in use? (opencode / codex / claude / gemini)
-> write: `- [8/8] agents: {answer}`

After the last question: update `## [INTERVIEW] status: ✅ done`

---

## Step 3: Spawn Parallel Agents

> Skip each agent if its matching status is already `✅ done`

Read full state -> build CONTEXT -> spawn:

| Agent | Command                 | Skip when      |
| ----- | ----------------------- | -------------- |
| **A** | `/vibe.detect`          | `[DETECT] ✅`  |
| **B** | `/vibe.docs`            | `[DOCS] ✅`    |
| **C** | `/vibe.skills`          | `[SKILLS] ✅`  |
| **D** | `/vibe.install` (after A) | `[INSTALL] ✅` |

After all finish -> run `/vibe.verify`

---

## Edge Cases

- **Resume:** run `/vibe.setup` again -> auto-reads state and skips completed steps
- **Rerun one step:** call `/vibe.detect`, `/vibe.docs`, etc. directly - each command reads state independently
- **Rerun one step from scratch:** delete that step's status line in `.vibe/state.md` -> run command again
- **Full reset:** `rm .vibe/state.md` -> run `/vibe.setup` again
- **Tool failure:** write `❌ failed: {reason}`, continue other steps, report in verify
- **Switch model/tool:** state remains readable because it is plain markdown

---

## State File Template

Create `.vibe/state.md` when no state file exists:

```markdown
# .vibe/state.md

# Checkpoint - AI reads this to resume. Do not delete.

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
