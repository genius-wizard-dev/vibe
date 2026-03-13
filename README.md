```
          ██╗   ██╗██╗██████╗ ███████╗
          ██║   ██║██║██╔══██╗██╔════╝
          ██║   ██║██║██████╔╝█████╗
          ╚██╗ ██╔╝██║██╔══██╗██╔══╝
          ╚████╔╝ ██║██████╔╝███████╗
            ╚═══╝  ╚═╝╚═════╝ ╚══════╝
```

Open-source CLI for AI workflow orchestration:

`research -> design -> resource bootstrap -> implementation`

`vibe` helps teams and solo builders keep AI-assisted work structured, resumable, and reusable across runtimes.

Inspired by:

- [github/spec-kit](https://github.com/github/spec-kit)
- [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done)

## What this project is

`vibe` is a command/bootstrap layer, not an implementation framework.

It installs workflow commands into your AI runtime (OpenCode, Claude, Gemini, Codex, etc.), then uses topic-based state under `.vibe/` to support:

- reusable research loops
- reusable design loops
- resource/bootstrap handoff before implementation

This design keeps planning context organized while still letting you implement with your preferred system (Spec-Kit, GSD, BMAD, or your own flow).

## Who this is for

- Developers who want repeatable planning before coding
- Researchers who only need research workflows (no code generation required)
- Designers/architects who need structured architecture output and handoff artifacts
- Open-source maintainers who need consistent, contributor-friendly process docs

## Core capabilities

- Multi-runtime install (`opencode`, `claude`, `gemini`, `codex`, `cursor`, `windsurf`, `qwen`, `continue`)
- Multi-pack install (`research`, `design`, `resource`) with user-selected packs
- Topic-based state and outputs per research/design thread
- Shared bridge context for implementation handoff
- Prompt library install into `.vibe/prompts/`
- Non-destructive setup modes (`--keep` vs `--force`)

## Quick start

```bash
npm exec --yes --package=github:genius-wizard-dev/vibe -- vibe setup
```

## Common setup examples

```bash
# full flow
vibe setup --all-packs --all-runtimes --prompts

# research only
vibe setup --research --opencode --local --symlink --prompts

# design only
vibe setup --design --opencode --local --symlink --prompts

# resource bootstrap only
vibe setup --resource --opencode --local --symlink
```

## Setup wizard controls

- `Space`: toggle option (multi-select)
- `Enter`: confirm current step
- `Up/Down`: move cursor
- `B`: go back to previous step (step 2 onward)

## GitHub automation (CI + npm publish)

This repo includes:

- `.github/workflows/ci.yml` for pull request and push validation
- `.github/workflows/publish-npm.yml` for auto npm publish on push to `main`

Publish behavior:

- workflow reads `name` + `version` from `package.json`
- if `${name}@${version}` already exists on npm, publish is skipped
- if not, workflow publishes with provenance

### How to set npm token in GitHub

1. Create npm automation token
   - Log in at npmjs.com
   - Go to Account Settings -> Access Tokens
   - Generate a new token of type `Automation`
2. Add token to GitHub repository secrets
   - Repo -> Settings -> Secrets and variables -> Actions
   - New repository secret
   - Name: `NPM_TOKEN`
   - Value: your npm automation token
3. Bump package version and push to `main`
   - Example: update `package.json` version (`0.2.1` -> `0.2.2`)
   - Push commit to `main`
   - GitHub Actions publishes automatically when version is new

Tip: you can also trigger publish manually via `workflow_dispatch` in Actions tab.

## CLI reference

```bash
vibe --version
vibe setup
vibe list
vibe update
vibe remove
vibe research result .
vibe research result <project-root>
vibe research global
vibe design result .
vibe design result <project-root>
vibe design global
vibe resource status .
vibe resource status <project-root>
```

### Setup flags

```bash
# packs
vibe setup --resource --research --design
vibe setup --packs resource,research,design
vibe setup --all-packs

# runtimes
vibe setup --opencode --claude --gemini --codex --cursor --windsurf --qwen --continue
vibe setup --all-runtimes

# prompt library
vibe setup --prompts
vibe setup --no-prompts

# resource mode preference
vibe setup --fastsetup
vibe setup --extra

# install mode
vibe setup --symlink
vibe setup --local-files

# existing file policy
vibe setup --keep
vibe setup --force

# scope / language
vibe setup --local
vibe setup --global
vibe setup --lang en
vibe setup --lang vi
```

## Command packs

### `research`

- `/research.setup`
- `/research.new`
- `/research.resume`
- `/research.scan`
- `/research.interview`
- `/research.analyze`
- `/research.discuss`
- `/research.log`
- `/research.export`

### `design`

- `/design.setup`
- `/design.new`
- `/design.resume`
- `/design.arch`
- `/design.mcp`
- `/design.review`
- `/design.log`
- `/design.export`

### `resource`

- `/resource.setup`
- `/resource.resume`
- `/resource.detect`
- `/resource.findskills`
- `/resource.install`
- `/resource.docs`
- `/resource.skills`
- `/resource.base`
- `/resource.changelogs`
- `/resource.verify`

## Prompt library

When enabled during setup, quick prompts are installed to `.vibe/prompts/`:

- `@fast.md`
- `@research.md`
- `@design.md`
- `@resource.md`
- `@implement.md`
- `@parallel.md`
- `@handoff.md`

## Project structure

```text
.
|-- src/
|   |-- index.js
|   |-- setup.js
|   |-- registry.js
|   |-- fetch.js
|   |-- list.js
|   |-- remove.js
|   |-- research.js
|   |-- design.js
|   |-- resource.js
|   |-- tui.js
|   |-- runtime-args.js
|   `-- pack-args.js
|-- commands/
|   |-- research/en/*.md
|   |-- design/en/*.md
|   `-- resource/en/*.md
|-- prompts/
|   `-- en/*.md
`-- README.md
```

## Runtime state model

```text
.vibe/
|-- config.json
|-- commands/
|-- prompts/
|-- research/
|   |-- overview.md
|   |-- active.md
|   `-- <topic>/
|       |-- state.md
|       |-- brief.md
|       |-- interview.md
|       |-- analysis.md
|       |-- discussion.md
|       |-- decisions.md
|       |-- logs.md
|       `-- output.md
|-- design/
|   |-- overview.md
|   |-- active.md
|   `-- <topic>/
|       |-- state.md
|       |-- input.md
|       |-- architecture.md
|       |-- mcp.md
|       |-- review.md
|       |-- decisions.md
|       |-- logs.md
|       `-- output.md
`-- resource/
    |-- state.md
    `-- context/bridge.md

CHANGE_LOGS.md
```

## Architecture notes

- `src/registry.js` is the single source of truth for runtimes, packs, prompt files, and remote asset locations.
- `src/fetch.js` syncs markdown assets from GitHub raw URLs.
- `src/setup.js` drives setup, installation mode, conflict policy, and prompt installation.
- `src/tui.js` provides keyboard-first interactive widgets.
- `src/list.js`, `src/research.js`, `src/design.js`, and `src/resource.js` provide state/result visibility.

### Remote source overrides

Use these environment variables to fetch assets from your own repo/branch:

- `VIBE_GITHUB_REPO`
- `VIBE_GITHUB_BRANCH`

## Recommended workflow variants

### Research-only

1. `/research.new`
2. `/research.setup`
3. `/research.export`

### Design-only

1. `/design.new`
2. `/design.setup`
3. `/design.export`

### Full flow

1. `/research.new` -> `/research.setup`
2. `/design.new` -> `/design.setup`
3. `/resource.setup`
4. `/resource.findskills`
5. `/resource.base`
6. implement with Spec-Kit/GSD/BMAD
7. `/resource.changelogs`

## Improvement roadmap (priority levels)

This section is intentionally explicit so contributors can pick work quickly.

### Level 0 - Release-critical

- [ ] Keep CLI/TUI version output in sync with `package.json`
- [ ] Add automated smoke tests for `setup`, `list`, `remove`
- [ ] Add fetch timeout + retry policy for remote asset sync
- [ ] Remove unused dependencies and tighten package surface
- [ ] Standardize exit codes for scripting and CI

### Level 1 - Core reliability

- [ ] Split `src/setup.js` into smaller modules (`args`, `installer`, `summary`)
- [ ] Add integration tests for `local/global` x `symlink/local-files`
- [ ] Improve conflict handling for broken symlinks and partial installs
- [ ] Validate all conflicting flags consistently
- [ ] Add deterministic non-interactive flow for CI

### Level 2 - Multi-domain expansion

- [ ] Add domain presets (`--preset dev|research|design|hybrid`)
- [ ] Add richer research-only and design-only templates
- [ ] Add machine-readable export schema for downstream tooling
- [ ] Add domain-focused packs for non-dev users (market/content/ops)
- [ ] Add localization coverage beyond current language fallback

### Level 3 - Open-source readiness

- [x] Add `CONTRIBUTING.md` with local dev + test conventions
- [x] Add `CODE_OF_CONDUCT.md`
- [x] Add `SECURITY.md` and disclosure policy
- [x] Add CI pipeline (lint, tests, package checks)
- [x] Add npm publish pipeline on push to `main`
- [ ] Add release changelog automation

### Level 4 - Ecosystem scale

- [ ] Add plugin API for community packs/runtimes
- [ ] Add compatibility test matrix across supported runtimes
- [ ] Add optional telemetry (opt-in, privacy-first)
- [ ] Add template versioning and migration path
- [ ] Add benchmark suite for large-repo performance

## Community and governance

- Contribution guide: `CONTRIBUTING.md`
- Code of Conduct: `CODE_OF_CONDUCT.md`
- Security policy: `SECURITY.md`

## Security and safety

- Do not commit secrets (`.env`, credentials, tokens).
- Prefer `--keep` when installing in existing projects.
- Use `--dry-run` when validating setup strategy in sensitive repos.
- Report vulnerabilities using `SECURITY.md` disclosure flow.

## License

MIT
