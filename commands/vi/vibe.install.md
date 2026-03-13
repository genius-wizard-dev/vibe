---
name: vibe.install
description: Cài workflow tool + VEXP MCP vào opencode & codex. Đọc tool từ .vibe/state.md, ghi từng sub-step.
---

## Bước 0: Đọc State

```bash
cat .vibe/state.md
```

- Nếu `[INSTALL] status: ✅ done` → hiển thị gì đã cài, hỏi "Chạy lại không?"
- Nếu `[DETECT] confirmed: false` → báo "Cần confirm tool trước. Chạy `/vibe.detect`"
- Ghi: `## [INSTALL] status: 🔄 in-progress`

Đọc: `recommendation`, `agents`, `workspace` từ state.

---

## 1. VEXP MCP — opencode

> Skip nếu `- opencode VEXP MCP: ✅`

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

✍️ Ghi: `- opencode VEXP MCP: ✅`

---

## 2. VEXP MCP — codex

> Skip nếu `- codex VEXP MCP: ✅`

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

✍️ Ghi: `- codex VEXP MCP: ✅`

---

## 3. VEXP Init

```bash
which vexp 2>/dev/null || echo "⚠️  npm install -g vexp-cli"
[ ! -f .vexp/manifest.json ] && vexp setup 2>/dev/null || true
grep -q ".vexp/index.db" .gitignore 2>/dev/null || printf "\n# VEXP\n.vexp/index.db\n.vexp/daemon.*\n.vexp/mcp.port\n" >> .gitignore
```

---

## 4. Spec-Kit (nếu recommendation = speckit | hybrid)

> Skip sub-step nếu đã `✅`

```bash
# opencode
[ -d ".specify" ] && specify init . --here --ai opencode --force || specify init . --here --ai opencode
```

✍️ Ghi: `- speckit opencode: ✅`

```bash
# codex — dùng /prompts:speckit.* prefix
specify init . --here --ai codex 2>/dev/null || echo "ℹ️  codex: /prompts:speckit.constitution"
```

✍️ Ghi: `- speckit codex: ✅`

---

## 5. GSD (nếu recommendation = gsd | hybrid)

> Skip sub-step nếu đã `✅`

```bash
npx get-shit-done-cc --local 2>/dev/null || echo "⚠️  npx get-shit-done-cc"
# codex: commands dùng hyphen — /gsd-plan-phase (không phải /gsd:plan-phase)
```

✍️ Ghi: `- gsd opencode: ✅` và `- gsd codex: ✅`

---

## Ghi State Sau Khi Xong

```
## [INSTALL] status: ✅ done
```

Update `last_updated` trong Meta.
