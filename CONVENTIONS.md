# CONVENTIONS

## Language and Runtime

- Use Node.js 22+ and ESM modules (`"type": "module"`).
- Keep CLI behavior deterministic and compatible across supported runtimes.

## Source Organization

- Keep command handlers in `src/commands` with `*.command.js` naming.
- Keep shared utilities in `src/core` and system checks in `src/system`.
- Keep conversation logic split by layer: `repo`, `service`, `migrations`.

## Setup Workflow

- Keep implementation planning in Spec-Kit, execution loops in GSD, and sprint orchestration in BMAD when needed.
- Read `.vibe/context/bridge.md` before implementation work.
- If setup context changes, refresh the bridge via `/setup.init` or `/setup.docs`.
- Run `/setup.changelogs` after meaningful implementation chunks.

## Change Safety

- For existing codebase setup, use refine-only changes by default.
- Avoid destructive folder rewrites in `src/` unless explicitly requested.
- Record setup and architecture-impacting changes in `CHANGE_LOGS.md`.

## Conversation Persistence Conventions

- Keep phase-1 storage local with SQLite and WAL mode enabled.
- Prefer normalized relational entities and deterministic read-cursor semantics.
- Keep retry/backoff and query tuning incremental and benchmark-informed.
