<div align="center">

# VIBE

**A lightweight, open-source workflow CLI for AI-assisted research, design, and implementation handoff.**
**Install once, run across OpenCode, Claude Code, Gemini CLI, Codex, Cursor, Windsurf, Qwen, Kiro CLI, and Continue.**

[![npm version](https://img.shields.io/npm/v/ai-vibe?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/ai-vibe)
[![npm downloads](https://img.shields.io/npm/dm/ai-vibe?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/ai-vibe)
[![CI](https://img.shields.io/github/actions/workflow/status/genius-wizard-dev/vibe/ci.yml?branch=main&style=for-the-badge&logo=github&label=CI)](https://github.com/genius-wizard-dev/vibe/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/genius-wizard-dev/vibe?style=for-the-badge&logo=github)](https://github.com/genius-wizard-dev/vibe/releases)
[![GitHub stars](https://img.shields.io/github/stars/genius-wizard-dev/vibe?style=for-the-badge&logo=github&color=181717)](https://github.com/genius-wizard-dev/vibe)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

<br>

```bash
npm exec --yes --package=ai-vibe -- vibe setup
```

**Works on macOS, Linux, and Windows (Node.js 22+).**

<br>

[Why vibe](#why-vibe) · [Getting Started](#getting-started) · [How It Works](#how-it-works) · [Commands](#commands) · [Release Flow](#release-flow-github--npm) · [Changes Log](CHANGES.LOG)

</div>

---

## Why vibe

Most AI coding workflows break when context gets too noisy or teams skip structure.

`vibe` gives you a practical layer between idea and implementation:

- `research` pack for topic discovery and analysis
- `design` pack for architecture and decision outputs
- `resource` pack for implementation bridge/bootstrap

You can use only what you need (research-only, design-only, or full flow).

## Who this is for

- Developers who want cleaner pre-implementation flow
- Researchers who need structured outputs without coding setup
- Designers/architects who want reusable handoff artifacts
- Open-source maintainers who need repeatable contributor workflows

## Getting Started

### Option 1: Run directly from npm (recommended)

```bash
npm exec --yes --package=ai-vibe -- vibe setup
```

### Option 2: Install globally

```bash
npm install -g ai-vibe
vibe --version
vibe setup
```

### Option 3: Run latest directly from GitHub source

```bash
npm exec --yes --package=github:genius-wizard-dev/vibe -- vibe setup
```

## Setup Profiles

### Dev (full packs)

```bash
vibe setup --all-packs --all-runtimes --prompts --local --symlink --keep
```

### Research-only

```bash
vibe setup --research --opencode --local --symlink --prompts --keep
```

### Design-only

```bash
vibe setup --design --opencode --local --symlink --prompts --keep
```

### Resource-only

```bash
vibe setup --resource --opencode --local --symlink --keep
```

## Setup Wizard Controls

- `Space`: toggle option (multi-select)
- `Enter`: confirm step
- `Up/Down`: move cursor
- `B`: go back to previous step (step 2 onward)

## Settings Center (`vibe setup`)

- Full TUI menu with back navigation (no auto-hide flow)
- Built-in AI tool scan for: OpenCode, Claude Code, Gemini CLI, Codex CLI, Kiro CLI
- If no tool is installed, menu actions are blocked with `(no tools setup)`
- Convo menu stays available and shows `(resource setup recommended)` when setup is incomplete
- Realtime monitor mode to watch conversations live: join + stream + exit with `q`

## Supported Runtimes

- OpenCode (`--opencode`)
- Claude Code (`--claude`)
- Gemini CLI (`--gemini`)
- Codex CLI (`--codex`)
- Cursor (`--cursor`)
- Windsurf (`--windsurf`)
- Qwen Code (`--qwen`)
- Kiro CLI (`--kirocli`)
- Continue (`--continue`)

Use `--all-runtimes` to install for all detected runtimes.

## How It Works

1. Run `vibe setup` to open the full settings center menu.
2. Continue with workspace setup wizard (packs/runtimes/location/install mode).
3. Open your AI runtime and run pack commands.
4. Keep state and outputs under `.vibe/` for resume/handoff.

Recommended full flow:

1. `/research.new` -> `/research.setup`
2. `/design.new` -> `/design.setup`
3. `/resource.setup`
4. `/resource.findskills`
5. `/resource.base`
6. Implement with Spec-Kit / GSD / BMAD
7. `/resource.changelogs`

## Commands

```bash
# core
vibe --version
vibe setup
vibe setup --help
vibe list
vibe update
vibe remove --yes

# research
vibe research new <topic>
vibe research new --name <topic> --root <project-root>
vibe research new --name <topic> --global
vibe research result .
vibe research result <project-root>
vibe research global

# design
vibe design new <topic>
vibe design new --name <topic> --root <project-root>
vibe design new --name <topic> --global
vibe design result .
vibe design result <project-root>
vibe design global

# resource
vibe resource status .
vibe resource status <project-root>

# conversation
vibe convo init
vibe convo list
vibe convo list --active-only
vibe convo monitor <conversation_id> --join --actor observer --type human

# agents
vibe agents create-many squad --count 4 --runtime opencode --role specialist --yes
```

## Useful Setup Flags

```bash
# packs
vibe setup --resource --research --design
vibe setup --packs resource,research,design
vibe setup --all-packs

# runtimes
vibe setup --opencode --claude --gemini --codex --cursor --windsurf --qwen --kirocli --continue
vibe setup --all-runtimes

# install behavior
vibe setup --symlink
vibe setup --local-files
vibe setup --keep
vibe setup --force
vibe setup --dry-run

# scope
vibe setup --local
vibe setup --global

# prompts and resource mode
vibe setup --prompts
vibe setup --no-prompts
vibe setup --fastsetup
vibe setup --extra
```

## Release Flow (GitHub + npm)

This repository uses GitHub Actions for CI and release automation:

- CI: `.github/workflows/ci.yml`
- Release: `.github/workflows/release.yml`

On push to `main`, release workflow does:

1. `npm install`
2. `npm run ci`
3. Detect release scope (`src/**` or `package.json` changed)
4. Read `name` and `version` from `package.json`
5. Publish to npm if version does not exist
6. Create git tag `v<version>` if missing
7. Generate changelog notes from commits + changed files
8. Create GitHub Release if missing
9. Upload `RELEASE_NOTES.md` as release asset

If a merge only changes docs/config (no `src/**` and no `package.json`), npm publish and GitHub release are skipped automatically.

Contributors in release notes are auto-linked to GitHub profiles when detectable from commit metadata.

### Required secret

Add `NPM_TOKEN` in GitHub repo settings:

1. npmjs.com -> Account Settings -> Access Tokens
2. Create token type `Automation`
3. GitHub repo -> Settings -> Secrets and variables -> Actions
4. Add repository secret:
   - Name: `NPM_TOKEN`
   - Value: your npm automation token

See `RELEASING.md` for full details and troubleshooting.

### Recommended contributor release branch flow

1. Create `release/vX.Y.Z` from `main`
2. Merge contributor PRs into that release branch
3. Bump version in `package.json`
4. Merge `release/vX.Y.Z` into `main`
5. CI/CD auto-publishes npm + creates GitHub Release with changelog notes

## Source Structure

- `src/index.js`: CLI entry + command routing
- `src/commands/*`: command handlers (`setup`, `agents`, `research`, `design`, `resource`, `convo`, `list`, `remove`)
- `src/core/*`: shared runtime/core modules (`registry`, flags parsing, TUI, remote fetch, agent registry)
- `src/system/*`: environment and setup preflight checks
- `src/conversation/*`: convo DB, services, realtime monitor, workflow execution

## Open-source Docs

- Contributing: `CONTRIBUTING.md`
- Code of Conduct: `CODE_OF_CONDUCT.md`
- Security Policy: `SECURITY.md`
- Release Guide: `RELEASING.md`

## Roadmap (Priority Levels)

### Level 0 - Release-critical

- [x] Gate `vibe setup` with AI tool preflight scan (OpenCode, Claude, Gemini, Codex, Kiro)
- [x] Add Settings Center TUI with state hints (`no tools setup`, `resource setup recommended`)
- [x] Add non-blocking convo workspace recommendation before convo actions
- [x] Add realtime convo monitor (`vibe convo monitor`) for live multi-agent visibility
- [ ] Add end-to-end tests for setup/menu/convo-monitor gating behavior

### Level 1 - Core reliability

- [x] Introduce `src/system/*` modules for tool detection and workspace readiness checks
- [ ] Split `src/commands/setup-center.command.js` into menu/action/state modules for easier maintenance
- [x] Move command handlers into `src/commands/*` domain structure
- [ ] Add integration tests for local/global x symlink/local-files matrix
- [ ] Harden broken symlink and partial install recovery

### Level 2 - Multi-domain expansion

- [x] Add Kiro CLI runtime support (`--kirocli`)
- [ ] Add runtime capability matrix (tool -> command packs -> monitor support)
- [ ] Add health checks for major AI CLIs (auth, version, executable status)
- [ ] Expand research-only and design-only templates
- [ ] Add machine-readable export schema for downstream tools

### Level 3 - Open-source readiness

- [x] Add `CONTRIBUTING.md`
- [x] Add `CODE_OF_CONDUCT.md`
- [x] Add `SECURITY.md`
- [x] Add CI workflow
- [x] Add automated GitHub + npm release workflow
- [x] Add changelog automation for release notes quality
- [ ] Add architecture docs for `/src` domains and contributor onboarding map
- [ ] Add contributor guide for TUI patterns and menu state conventions

### Level 4 - Ecosystem scale

- [ ] Add plugin API for community packs/runtimes
- [ ] Add compatibility matrix testing across runtimes
- [ ] Add optional privacy-first telemetry
- [ ] Add template versioning and migration contracts
- [ ] Add large-repo performance benchmark suite

## Security

- Do not commit secrets (`.env`, credentials, keys, tokens)
- Prefer `--keep` in existing repositories
- Use `--dry-run` for high-risk environments
- Report vulnerabilities via `SECURITY.md`

## License

MIT License. See `LICENSE` for details.
