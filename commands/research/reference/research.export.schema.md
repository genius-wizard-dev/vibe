# research.export Output Schema

Use this schema to generate `.vibe/research/<research>/output.md`.

```markdown
# Research Output: {title}

## Metadata
- research: {slug}
- created_at: {datetime}
- scope: {local|global}
- source_state: .vibe/research/<research>/state.md

## Executive Summary

## Problem and User Context

## Goals and Success Criteria

## Constraints and Assumptions

## Existing Artifacts
- spec_kit: {path or none}
- gsd: {path or none}
- bmad: {path or none}

## Preferred Technology Directions

## Candidate System Directions
- Option A
- Option B
- Option C

## Risk Register
- Risk
- Impact
- Mitigation

## Recommendation

## Phase Plan
- Phase 1
- Phase 2
- Phase 3

## Open Questions for Design

## Links
- brief: .vibe/research/<research>/brief.md
- interview: .vibe/research/<research>/interview.md
- analysis: .vibe/research/<research>/analysis.md
- discussion: .vibe/research/<research>/discussion.md
- decisions: .vibe/research/<research>/decisions.md
```
