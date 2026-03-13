# Design Accelerator

Use this prompt to create or refine architecture from research outputs.

Input:

- design goal: {{YOUR_REQUEST}}

Rules:

1. Require `.vibe/research/overview.md` and linked research output.
2. Ensure `.vibe/design/<design>/` topic files exist.
3. Ask clarifying questions first when intent is ambiguous; do not guess missing requirements.
4. Build architecture with explicit boundaries and interfaces.
5. Resolve ambiguities with focused questions (max 1-3 per turn), then wait for user answers.
6. Export concise `output.md` for resource bootstrap after user confirms the recap.

Deliverables:

- architecture summary
- integration/MCP choices
- risk and fallback plan
- implementation slices for resource/base
