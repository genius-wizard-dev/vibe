# Resource Bootstrap Accelerator

Use this prompt to prepare implementation context before coding.

Input:

- bootstrap goal: {{YOUR_REQUEST}}

Rules:

1. Require research and design overviews.
2. Run/find skills before base scaffolding.
3. Keep one canonical bridge file: `.vibe/resource/context/bridge.md`.
4. Ensure `AGENTS.md` includes changelog update rule.
5. Keep root `CHANGE_LOGS.md` synchronized.
6. Detect whether repository already has a codebase.
7. If codebase exists, run refine-only setup (no full scaffold rewrite).
8. Use research/design outputs to align context and recommendations with current structure.

Deliverables:

- selected workflow strategy (Spec-Kit/GSD/BMAD)
- selected skills and install result
- base blueprint
- scaffold/refinement result (refine-only by default for existing codebases)
