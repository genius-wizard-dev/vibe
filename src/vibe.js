#!/usr/bin/env node
// vibe — AI Vibe Coding bootstrap CLI
// Commands fetched from GitHub at runtime — repo is auto-resolved

const [, , cmd, ...args] = process.argv;

const HELP = `
  ██╗   ██╗██╗██████╗ ███████╗
  ██║   ██║██║██╔══██╗██╔════╝
  ██║   ██║██║██████╔╝█████╗
  ╚██╗ ██╔╝██║██╔══██╗██╔══╝
   ╚████╔╝ ██║██████╔╝███████╗
    ╚═══╝  ╚═╝╚═════╝ ╚══════╝

  AI Vibe Coding Bootstrap

  Usage:
    vibe setup           Interactive TUI setup wizard
    vibe setup --force   Re-download + overwrite existing files
    vibe setup --dry-run Preview without writing files
    vibe setup --offline Use embedded fallback (no network)
    vibe remove          Remove installed vibe command files
    vibe list            Show installed commands + state
    vibe update          Re-sync all files from GitHub

  Options:
    --opencode --claude --gemini --codex
    --local / --global
    --lang en|vi
    --yes (for non-interactive remove)

  After setup:
    Open opencode/codex and run /vibe.setup
    Check progress anytime with /vibe.resume
`;

switch (cmd) {
  case "setup": {
    const { runSetup } = await import("./setup.js");
    await runSetup(args);
    break;
  }
  case "list": {
    const { runList } = await import("./list.js");
    await runList();
    break;
  }
  case "remove": {
    const { runRemove } = await import("./remove.js");
    await runRemove(args);
    break;
  }
  case "update": {
    const { runUpdate } = await import("./list.js");
    await runUpdate(args);
    break;
  }
  default:
    console.log(HELP);
    if (cmd && cmd !== "--help" && cmd !== "-h") {
      console.error(`  Unknown command: ${cmd}\n`);
      process.exit(1);
    }
}
