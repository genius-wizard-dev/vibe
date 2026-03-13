# CHANGE_LOGS

## 2026-03-13
- [resource] bootstrap resource workspace and bridge context for existing codebase
  - impact: adds resource state tracking, refine-only base blueprint, and shared workflow docs for Spec-Kit/GSD/BMAD handoff
  - references: `.vibe/resource/state.md`, `.vibe/resource/context/bridge.md`, `.vibe/resource/base-blueprint.md`, `AGENTS.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `.agents/context/workflow.md`, `.agents/context/domain.md`, `.agents/context/tech-decisions.md`

## 2026-03-14
- [resource.base] refresh refine-only base blueprint from current research/design context
  - impact: reaffirms nodejs-cli + sqlite-local base strategy, updates module boundary blueprint, and records bridge/state timestamp refresh for implementation handoff
  - references: `.vibe/resource/base-blueprint.md`, `.vibe/resource/context/bridge.md`, `.vibe/resource/state.md`
- [resource.findskills] scanned skills ecosystem and kept install set minimal
  - impact: no high-fit required skill was selected for immediate install; setup continues with built-in workflow skills
  - references: `.vibe/resource/state.md`, `.agents/skills/README.md`
- [resource.install] add OpenCode MCP vexp runtime wiring and update install state
  - impact: enables `mcp.vexp` runtime config and marks install section complete in resource state
  - references: `.opencode/opencode.json`, `.vibe/resource/state.md`
- [resource.verify] bootstrap verification run reported missing Spec-Kit workflow artifacts
  - impact: verify remains pending until `.specify` and `.planning` are created via Spec-Kit flow
  - references: `.vibe/resource/state.md`
- [docs] sync changelog naming and references to `CHANGE_LOGS.md`
  - impact: consolidates changelog tracking into a single source file and removes legacy mirror usage
  - references: `README.md`, `package.json`, `CHANGE_LOGS.md`
- [setup-center] add workflow readiness checks for Spec-Kit, GSD, and BMAD
  - impact: setup menu now surfaces selected-workflow readiness with skip-aware details and explicit action hints when tooling is missing
  - references: `src/commands/setup-center.command.js`, `src/system/workspace-status.js`, `src/system/workflow-status.js`
- [resource] make status and verify flow skip-aware for already-installed workflows
  - impact: `/resource.status` now checks workflow readiness from install state + CLI/artifacts, and command references now allow `already-installed; skipped` behavior
  - references: `src/commands/resource.command.js`, `commands/resource/resource.install.md`, `commands/resource/resource.verify.md`, `commands/resource/reference/resource.install.tools.md`, `commands/resource/reference/resource.verify.tools.md`
- [resource.install] make install flow state-driven instead of hardcoded workflow-only execution
  - impact: install now resolves runtimes/workflows/selected skills from state, installs only selected items, and marks unknown tokens as `manual-required`
  - references: `commands/resource/resource.install.md`, `commands/resource/reference/resource.install.tools.md`, `.vibe/commands/resource/resource.install.md`, `.vibe/commands/resource/reference/resource.install.tools.md`
- [setup] simplify setup flow and persist selected runtime/workflow CLI context in config
  - impact: removes prompt-library setup step, defaults to local file installs, adds workflow CLI selection in setup wizard, and stores `selectedRuntimes` + `selectedWorkflowCli` + `installLocation` in `.vibe/config.json`
  - references: `src/commands/setup.command.js`, `src/index.js`, `.vibe/config.json`
- [resource] tighten command specs for concise state-driven install/verify behavior
  - impact: rewrites `resource.setup/detect/findskills/install/verify` to prioritize CLI tooling (Spec-Kit + get-shit-done-cc), make skills optional/local, and reduce verbose/ambiguous instructions
  - references: `commands/resource/resource.setup.md`, `commands/resource/resource.detect.md`, `commands/resource/resource.findskills.md`, `commands/resource/resource.install.md`, `commands/resource/resource.verify.md`, `commands/resource/reference/resource.install.tools.md`, `commands/resource/reference/resource.verify.tools.md`, `.vibe/commands/resource/resource.setup.md`, `.vibe/commands/resource/resource.install.md`
- [setup] migrate command pack from `resource.*` focus to lean `setup.*` workflow
  - impact: introduces `commands/setup/*` command set, uses `.vibe/state.md` as primary checkpoint, simplifies setup flags/options, and de-emphasizes research/design-heavy bootstrap flow
  - references: `src/core/registry.js`, `src/core/pack-flags.js`, `src/commands/setup.command.js`, `src/commands/list.command.js`, `src/commands/resource.command.js`, `src/system/workflow-status.js`, `src/system/workspace-status.js`, `commands/setup/setup.init.md`, `commands/setup/setup.install.md`, `commands/setup/reference/setup.install.tools.md`
- [setup] finish compatibility cleanup for legacy `resource.*` docs and bridge references
  - impact: converts remaining `resource.resume`/`resource.changelogs` and resource reference docs into setup aliases, and updates workflow/design prompts to point to `.vibe/context/bridge.md` plus `/setup.*` commands
  - references: `commands/resource/resource.resume.md`, `commands/resource/resource.changelogs.md`, `commands/resource/reference/resource.install.tools.md`, `commands/resource/reference/resource.verify.tools.md`, `commands/resource/reference/resource.flow.bridge.md`, `prompts/implement.md`, `prompts/handoff.md`, `prompts/resource.md`, `commands/design/design.export.md`, `commands/design/design.setup.md`, `.agents/context/workflow.md`, `.agents/skills/README.md`
- [setup] remove legacy resource/research/design surfaces and keep setup-first core
  - impact: removes `vibe resource|research|design` command routes, adds first-class `vibe setup status`, and prunes obsolete command docs/prompts so runtime distribution stays focused on setup + agents + conversation
  - references: `src/index.js`, `src/commands/setup.command.js`, `src/commands/setup-status.command.js`, `src/commands/setup-center.command.js`, `src/system/workspace-status.js`, `src/system/workflow-status.js`, `src/core/pack-flags.js`, `src/commands/list.command.js`, `src/conversation/cli.js`, `package.json`, `README.md`, `CONTRIBUTING.md`, `prompts/fast.md`, `commands/resource/*`, `commands/research/*`, `commands/design/*`
- [setup] add `/setup.update` for post-implementation setup realignment
  - impact: setup pack now installs `setup.update`, enabling periodic refresh of `.vibe/state.md` and bridge/doc alignment after coding cycles before running verify/changelog updates
  - references: `src/core/registry.js`, `commands/setup/setup.update.md`, `commands/setup/setup.resume.md`, `AGENTS.md`, `.agents/context/workflow.md`, `README.md`
