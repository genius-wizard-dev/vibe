# Contributing to vibe

Thanks for contributing to `vibe`.

This project is an open-source Node.js CLI for setup-first SDD workflow orchestration and multi-agent conversation across runtimes (OpenCode, Claude, Gemini, Codex, Cursor, Windsurf, Qwen, Continue).

## Project scope

`vibe` focuses on:

- reliable CLI setup and runtime installation
- clear setup and conversation command packs
- resumable setup state and multi-agent execution flow

Out of scope for normal PRs:

- large unrelated refactors
- breaking behavior without migration notes
- tooling bloat without clear value

## Types of contributions

- Bug fixes (logic, path handling, setup issues, regressions)
- Features (new options, better UX, pack/runtime improvements)
- Docs (README, command docs, contributor docs)
- Reliability hardening (error messages, validation, safer defaults)
- Issue triage and reproduction support

## Before you start

1. Check existing issues/PRs to avoid duplicate work.
2. For non-trivial changes, open an issue first with problem + proposed approach.
3. Keep PRs focused to one concern.

## Local setup

```bash
npm install
```

## Validate changes locally

This repo currently has no dedicated test script in `package.json`, so use syntax checks and smoke checks.

### 1) Syntax checks

Run `node --check` for every changed JS file.

Examples:

```bash
node --check src/index.js
node --check src/commands/setup.command.js
node --check src/core/tui.js
```

### 2) CLI smoke checks

```bash
node src/index.js --help
node src/index.js --version
node src/index.js list
```

If your change touches setup flow, run:

```bash
node src/index.js setup
```

and verify the interactive flow manually.

## Issue triage guidance

When triaging issues, collect:

- Node version and OS
- exact command used
- expected behavior vs actual behavior
- minimal reproduction steps

Suggested severity tags:

- `critical`: security/data loss/common hard failure
- `high`: major workflow blocked
- `medium`: broken behavior with workaround
- `low`: docs/UX/minor issue

## Branch and PR workflow

1. Fork and create a branch from `main`.
2. Use clear branch names:
   - `fix/<short-name>`
   - `feat/<short-name>`
   - `docs/<short-name>`
3. Keep commits focused and reviewable.
4. Open a PR with:
   - summary
   - why this change is needed
   - validation steps you ran
   - migration notes (if behavior changes)

## Coding standards

- Prefer small and explicit changes.
- Keep behavior consistent with existing CLI patterns.
- Avoid hidden side effects and silent fallback changes.
- Return actionable error messages.
- Do not add dependencies unless necessary.

## Docs standards

- Keep docs copy-paste friendly.
- Use real command examples.
- Update docs in same PR when behavior or flags change.
- Explain user impact for any non-trivial change.

## Updating `commands/*` and `prompts/*`

Template changes are high impact because they affect runtime behavior immediately after sync.

Required checklist:

- [ ] Path and filename are correct
- [ ] Referenced variables/context exist
- [ ] Related docs updated (`README.md` and affected command docs)
- [ ] At least one end-to-end manual flow tested

## Adding a new runtime safely

If adding a runtime:

1. Add runtime definition in `src/core/registry.js`.
2. Add/verify runtime flag aliases in `src/core/runtime-flags.js`.
3. Ensure setup selection/install flow supports it (`src/commands/setup.command.js`).
4. Verify list/remove behavior for local and global scope.
5. Update README runtime docs.

## Adding a new pack safely

If adding a pack:

1. Add pack manifest in `src/core/registry.js`.
2. Add corresponding files under `commands/<pack>/<lang>/`.
3. Validate pack argument parsing (`src/core/pack-flags.js`).
4. Verify installation in both install scopes (`local`, `global`).
5. Update README pack and flow docs.

## Commit message guidance

Use short imperative commit subjects, for example:

- `fix: handle invalid pack selection in setup`
- `feat: add back navigation in setup wizard`
- `docs: add security reporting policy`

Prefer explaining the reason (why), not only the change (what).

## PR checklist (contributor)

- [ ] Scope is focused
- [ ] Syntax checks passed for touched JS files
- [ ] Manual CLI smoke checks completed
- [ ] Docs updated if needed
- [ ] No secrets or local machine artifacts committed

## Maintainer merge criteria

PRs should be merged when:

- behavior and user impact are clear
- validation steps are sufficient and reproducible
- backward compatibility is preserved (or migration is documented)
- docs are updated for user-facing changes

## Release-impacting changes

Mark PR as release-impacting if it changes:

- CLI flags/defaults
- setup flow behavior
- pack/runtime contracts
- command/prompt template contracts
- output format consumed by scripts

For release-impacting PRs, include:

- migration notes
- rollback consideration
- explicit testing notes

Thanks for helping make `vibe` better.
