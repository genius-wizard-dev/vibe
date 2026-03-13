---
name: vibe.install
description: Install workflow tools + VEXP MCP for opencode & codex. Read tool decisions from .vibe/state.md and track each sub-step.
---

## Step 0: Read State

```bash
cat .vibe/state.md
```

- If `[INSTALL] status: ✅ done` -> show what is installed and ask "Run again?"
- If `[DETECT] confirmed: false` -> show "Tool selection must be confirmed first. Run `/vibe.detect`"
- Write: `## [INSTALL] status: 🔄 in-progress`

Read: `recommendation`, `agents`, `workspace` from state.

---

## 1. VEXP MCP - opencode

> Skip if `- opencode VEXP MCP: ✅`

```bash
mkdir -p .opencode
WORKSPACE=$(pwd)
cat > .opencode/opencode.json << EOF
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "vexp": {
      "type": "local",
      "command": ["vexp", "mcp", "--workspace", "$WORKSPACE"],
      "enabled": true
    }
  }
}
EOF
```

✍️ Write: `- opencode VEXP MCP: ✅`

---

## 2. VEXP MCP - codex

> Skip if `- codex VEXP MCP: ✅`

```bash
mkdir -p ~/.codex
WORKSPACE=$(pwd)
if [ -f ~/.codex/config.json ]; then
  python3 -c "
import json, os
p = os.path.expanduser('~/.codex/config.json')
with open(p) as f: c = json.load(f)
c.setdefault('mcp', {})['vexp'] = {'type':'local','command':['vexp','mcp','--workspace',os.getcwd()],'enabled':True}
with open(p,'w') as f: json.dump(c,f,indent=2)
print('merged')
"
else
  cat > ~/.codex/config.json << EOF
{"mcp":{"vexp":{"type":"local","command":["vexp","mcp","--workspace","$WORKSPACE"],"enabled":true}}}
EOF
fi
```

✍️ Write: `- codex VEXP MCP: ✅`

---

## 3. VEXP Init

```bash
which vexp 2>/dev/null || echo "⚠️  npm install -g vexp-cli"
[ ! -f .vexp/manifest.json ] && vexp setup 2>/dev/null || true
grep -q ".vexp/index.db" .gitignore 2>/dev/null || printf "\n# VEXP\n.vexp/index.db\n.vexp/daemon.*\n.vexp/mcp.port\n" >> .gitignore
```

---

## 4. Spec-Kit (if recommendation = speckit | hybrid)

> Skip each sub-step if already `✅`

```bash
# opencode
[ -d ".specify" ] && specify init . --here --ai opencode --force || specify init . --here --ai opencode
```

✍️ Write: `- speckit opencode: ✅`

```bash
# codex - use /prompts:speckit.* prefix
specify init . --here --ai codex 2>/dev/null || echo "ℹ️  codex: /prompts:speckit.constitution"
```

✍️ Write: `- speckit codex: ✅`

---

## 5. GSD (if recommendation = gsd | hybrid)

> Skip each sub-step if already `✅`

```bash
npx get-shit-done-cc --local 2>/dev/null || echo "⚠️  npx get-shit-done-cc"
# codex: commands use hyphen - /gsd-plan-phase (not /gsd:plan-phase)
```

✍️ Write: `- gsd opencode: ✅` and `- gsd codex: ✅`

---

## Write State After Completion

```
## [INSTALL] status: ✅ done
```

Update `last_updated` in Meta.
