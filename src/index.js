#!/usr/bin/env node
// vibe — AI vibe bootstrap CLI
// Commands fetched from GitHub at runtime — repo is auto-resolved

import fs from "fs";

const [, , cmd, ...args] = process.argv;

function getCliVersion() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    );
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const CLI_VERSION = getCliVersion();

const HELP = `
  ██╗   ██╗██╗██████╗ ███████╗
  ██║   ██║██║██╔══██╗██╔════╝
  ██║   ██║██║██████╔╝█████╗
  ╚██╗ ██╔╝██║██╔══██╗██╔══╝
   ╚████╔╝ ██║██████╔╝███████╗
    ╚═══╝  ╚═╝╚═════╝ ╚══════╝

  AI vibe Bootstrap

  Usage:
    vibe --version       Show CLI version
    vibe setup           Interactive TUI setup wizard
    vibe setup --force   Re-download + overwrite existing files
    vibe setup --dry-run Preview without writing files
    vibe setup --offline Use embedded fallback (no network)
    vibe research ...    Research result and global listing
    vibe design ...      Design result and global listing
    vibe resource ...    Resource readiness and status checks
    vibe remove          Remove installed managed command files
    vibe list            Show installed commands + state
    vibe update          Re-sync all files from GitHub

  Options:
    --opencode --claude --gemini --codex --cursor --windsurf --qwen --continue
    --all / --all-tools / --all-runtimes
    --resource --research --design
    --packs resource,research,design
    --all-packs
    --fastsetup / --extra
    --prompts / --no-prompts
    --symlink / --local-files
    --force / --keep
    --local / --global
    --yes (for non-interactive remove)

  Runtime aliases:
    --open-code --opencode-cli --claude-code --gemini-cli --codex-cli
    --cursor-ide --windsurf-ide --qwen-code --continue-dev

  After setup:
    Open your AI tool and run /research.setup
    Continue with /design.setup and /resource.setup

  Research CLI:
    vibe research result .
    vibe research result <project-root>
    vibe research global

  Design CLI:
    vibe design result .
    vibe design result <project-root>
    vibe design global

  Resource CLI:
    vibe resource status .
    vibe resource status <project-root>
`;

switch (cmd) {
  case "version":
  case "--version":
  case "-v":
    console.log(`vibe v${CLI_VERSION}`);
    break;
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
  case "research": {
    const { runResearch } = await import("./research.js");
    await runResearch(args);
    break;
  }
  case "design": {
    const { runDesign } = await import("./design.js");
    await runDesign(args);
    break;
  }
  case "resource": {
    const { runResource } = await import("./resource.js");
    await runResource(args);
    break;
  }
  default:
    console.log(HELP);
    if (cmd && cmd !== "--help" && cmd !== "-h") {
      console.error(`  Unknown command: ${cmd}\n`);
      process.exit(1);
    }
}
