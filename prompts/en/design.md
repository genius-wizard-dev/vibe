# Design Accelerator

Use this prompt to create or refine architecture from research outputs.

Input:

- design goal: {{YOUR_REQUEST}}

Rules:

1. Require `.vibe/research/overview.md` and linked research output.
2. Ensure `.vibe/design/<design>/` topic files exist.
3. Build architecture with explicit boundaries and interfaces.
4. Resolve ambiguities with focused questions (max 1 at a time).
5. Export concise `output.md` for resource bootstrap.

Deliverables:

- architecture summary
- integration/MCP choices
- risk and fallback plan
- implementation slices for resource/base
