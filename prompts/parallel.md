# Parallel Agent Execution

Use this prompt when the request can be broken into independent lanes.

Input:

- objective: {{YOUR_REQUEST}}

Rules:

1. Build lane map first.
2. Run independent lanes in parallel.
3. Merge only after all critical lanes are complete.
4. Stop and ask exactly one targeted question if blocked.
5. Keep token use low: no repeated context blocks.

Output:

- lane definitions
- parallel execution status
- merge summary
- residual risks
