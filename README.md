<div align="center">

# VIBE

**A lightweight, open-source workflow CLI for AI setup, SDD framework bootstrapping, and multi-agent execution.**
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

[Why vibe](#why-vibe) · [Getting Started](#getting-started) · [How It Works](#how-it-works) · [Commands](#commands) · [Release Flow](#release-flow-github--npm) · [Changes Log](CHANGE_LOGS.md)

</div>

---

## Why vibe

Most AI coding workflows break when context gets too noisy or teams skip structure.

`vibe` gives you a practical layer between idea and implementation:

- `setup` pack for resume-safe project initialization and workflow tooling
- `conversation` pack for local multi-agent coordination

You can use only what you need (setup-only or setup+conversation).

## Who this is for

- Developers who want clean setup + implementation workflows
- Teams running multiple AI runtimes in one repo
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
vibe setup --all-packs --all-runtimes --local --keep --workflows speckit,gsd
```

### Setup-only (lean)

```bash
vibe setup --init --opencode --local --keep --workflows speckit,gsd
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
- Convo menu stays available and shows `(setup init recommended)` when setup is incomplete
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

1. `/setup.init`
2. `/setup.detect`
3. `/setup.install`
4. `/setup.verify`
5. Implement with Spec-Kit / GSD / BMAD
6. `/setup.update` (after major coding cycles)
7. `/setup.changelogs`

## Commands

```bash
# core
vibe --version
vibe setup
vibe setup --help
vibe list
vibe update
vibe remove --yes

# setup status
vibe setup status .
vibe setup status <project-root>

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
vibe setup --init --conversation
vibe setup --packs setup,conversation
vibe setup --all-packs

# runtimes
vibe setup --opencode --claude --gemini --codex --cursor --windsurf --qwen --kirocli --continue
vibe setup --all-runtimes

# install behavior
vibe setup --keep
vibe setup --force
vibe setup --dry-run

# scope
vibe setup --local
vibe setup --global

# workflow CLI selection + setup profile
vibe setup --speckit --gsd --bmad
vibe setup --workflows speckit,gsd
vibe setup --install-workflows
vibe setup --no-install-workflows
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
- `src/commands/*`: command handlers (`setup`, `setup status`, `agents`, `convo`, `list`, `remove`)
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
- [x] Add Settings Center TUI with state hints (`no tools setup`, `setup init recommended`)
- [x] Add non-blocking convo workspace recommendation before convo actions
- [x] Add realtime convo monitor (`vibe convo monitor`) for live multi-agent visibility
- [ ] Add end-to-end tests for setup/menu/convo-monitor gating behavior

### Level 1 - Core reliability

- [x] Introduce `src/system/*` modules for tool detection and workspace readiness checks
- [ ] Split `src/commands/setup-center.command.js` into menu/action/state modules for easier maintenance
- [x] Move command handlers into `src/commands/*` domain structure
- [ ] Add integration tests for local/global install matrix
- [ ] Harden partial setup recovery

### Level 2 - Multi-domain expansion

- [x] Add Kiro CLI runtime support (`--kirocli`)
- [ ] Add runtime capability matrix (tool -> command packs -> monitor support)
- [ ] Add health checks for major AI CLIs (auth, version, executable status)
- [ ] Expand setup profiles and workflow presets
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
