# vibe

```text
██╗   ██╗██╗██████╗ ███████╗
██║   ██║██║██╔══██╗██╔════╝
██║   ██║██║██████╔╝█████╗
╚██╗ ██╔╝██║██╔══██╗██╔══╝
 ╚████╔╝ ██║██████╔╝███████╗
  ╚═══╝  ╚═╝╚═════╝ ╚══════╝
  AI vibe Bootstrap  v0.1.0
```

> Bootstrap AI vibe stack - opencode + codex + claude + gemini commands, state management.

```bash
# run directly from GitHub (recommended)
npm exec --yes --package=github:genius-wizard-dev/vibe -- vibe setup

# if published to npm
npx vibe setup
```

---

## How it works

```
vibe setup  →  TUI wizard  →  fetch files from this repo  →  inject into your project
```

CLI downloads command files **at runtime from GitHub** — no rebuild needed when you update `.md` files. Just push to `main` and users get the latest next time they run `vibe update`.

---

## Repository Structure

```
vibe/
├── src/
│   ├── vibe.js              ← CLI entry point
│   ├── registry.js          ← All remote paths defined here
│   ├── setup.js             ← TUI setup wizard
│   ├── fetch.js             ← GitHub fetcher
│   ├── list.js              ← list + update commands
│   ├── remove.js            ← remove command files
│   └── tui.js               ← VIBE ASCII art + interactive widgets
│
├── command/                 ← Agent command files (outside src)
│   ├── en/
│   └── vi/
```

---

## CLI Usage

```bash
# Interactive TUI setup (recommended)
npm exec --yes --package=github:genius-wizard-dev/vibe -- vibe setup

# Options
vibe setup --force      # Re-download + overwrite
vibe setup --dry-run    # Preview without writing
vibe setup --offline    # Skip network (use cached)
vibe setup --lang en    # Set preferred language (en/vi)

# Target specific runtime
vibe setup --opencode --codex
vibe setup --global     # Recommended: install once for all projects

# After setup
vibe list               # Show installed commands + state
vibe update             # Re-sync all files from GitHub
vibe remove             # Remove installed vibe command files
```

## After Setup

Open your agent (opencode/codex) in the project and run:

```
/vibe.setup     ← Start or resume bootstrap
/vibe.resume    ← Check progress, continue from any step
```

State is saved to `.vibe/state.md` — plain markdown, commit it. If you stop midway, just run `/vibe.setup` again and it resumes from where you left off.

---

## Updating Command Files

Just edit files in `command/` and push to `main`. No CLI rebuild needed.

Users get updates via:

```bash
vibe update
# or
npm exec --yes --package=github:genius-wizard-dev/vibe -- vibe setup --force
```

---

## Config

No registry edits needed for normal forks.

`GITHUB_REPO` is auto-resolved in this order:

1. `VIBE_GITHUB_REPO`
2. `package.json` -> `vibe.githubRepo`
3. `package.json` -> `repository.url`
4. `git remote origin`

Optional overrides:

```bash
VIBE_GITHUB_REPO=owner/repo
VIBE_GITHUB_BRANCH=main
```

You can also pin in `package.json`:

```json
{
  "vibe": {
    "githubRepo": "owner/repo",
    "githubBranch": "main"
  }
}
```

---

## License

MIT
