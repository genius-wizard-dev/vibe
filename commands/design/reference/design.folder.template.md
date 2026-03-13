# design folder template

Root:

`.vibe/design/`

Files:

- `overview.md`
- `active.md`

Topic folder:

`.vibe/design/<design>/`

Required files:

- `state.md`
- `input.md`
- `architecture.md`
- `mcp.md`
- `review.md`
- `decisions.md`
- `logs.md`
- `output.md`

## state.md template

```markdown
# design state

topic: <design>
updated_at: {datetime}

arch: pending
mcp: pending
review: pending
export: pending
```

## overview table template

```markdown
## Architecture Summary

- system scope: ~
- active style: ~
- current focus: ~

## Topics

| topic | status | stage | updated_at | output |
| --- | --- | --- | --- | --- |
```
