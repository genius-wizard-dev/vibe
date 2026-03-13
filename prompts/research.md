# Research Accelerator

Use this prompt to start or continue research with minimal friction.

Input:

- topic intent: {{YOUR_REQUEST}}
- mode: fastsetup or extra

Rules:

1. Ensure `.vibe/research/overview.md` and active topic exist.
2. If missing, create topic via research.new flow.
3. Ask clarifying questions first when intent is ambiguous; do not guess missing requirements.
4. In fastsetup mode, ask the 10 GSD baseline questions and wait for user answers.
5. Produce concise outputs in `brief.md`, `analysis.md`, and `output.md`.
6. Log changes in topic `logs.md` and update overview.

Deliverables:

- clarified problem statement
- options and trade-offs
- recommendation
- open questions for design
