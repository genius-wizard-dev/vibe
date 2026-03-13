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
    vibe setup           Setup Center (TUI)
    vibe setup --help    Show setup command help
    vibe setup --menu    Force open Setup Center menu
    vibe setup --force   Re-download + overwrite existing files
    vibe setup --dry-run Preview without writing files
    vibe research ...    Research result and global listing
    vibe design ...      Design result and global listing
    vibe agents ...      Local AI agent profile management
    vibe convo ...       Local multi-AI conversation commands
    vibe resource ...    Resource readiness and status checks
    vibe remove          Remove .vibe and managed command files
    vibe list            Show installed commands + state
    vibe update          Re-sync all files from GitHub

  Options:
    --opencode --claude --gemini --codex --cursor --windsurf --qwen --kirocli --continue
    --all / --all-tools / --all-runtimes
    --resource --research --design --conversation
    --packs resource,research,design,conversation
    --all-packs
    --fastsetup / --extra
    --prompts / --no-prompts
    --symlink / --local-files
    --force / --keep
    --local / --global
    --yes (skip setup ready confirmation; non-interactive remove)

  Runtime aliases:
    --open-code --opencode-cli --claude-code --gemini-cli --codex-cli
    --cursor-ide --windsurf-ide --qwen-code --kiro --kiro-cli --continue-dev

  After setup:
    Open your AI tool and run /research.setup
    Continue with /design.setup and /resource.setup

  Research CLI:
    vibe research new <topic>
    vibe research result .
    vibe research result <project-root>
    vibe research global

  Design CLI:
    vibe design new <topic>
    vibe design result .
    vibe design result <project-root>
    vibe design global

  Agents CLI:
    vibe agents create planner --runtime opencode --skills sqlite,workflow
    vibe agents create-many squad --count 4 --runtime opencode --role specialist --yes
    vibe agents edit planner --runtime claude --mode arg --args '["run","{prompt}"]' --sync-brain
    vibe agents list
    vibe agents suggest --topic "database migration strategy"

  Resource CLI:
    vibe resource status .
    vibe resource status <project-root>

  Conversation CLI:
    vibe convo init
    vibe convo list --active-only
    vibe convo create "feature thread" --by lead-agent --type agent --yes
    vibe convo suggest <conversation_id> --topic "implement feature"
    vibe convo add <conversation_id> --agent planner --yes
    vibe convo start <conversation_id> --topic "implement feature" --yes
    vibe convo run <conversation_id> --prompt "implement feature" --yes
    vibe convo history <conversation_id> --tool sqlite
    vibe convo join <conversation_id> --actor planner --type agent
    vibe convo send <conversation_id> --actor planner --text "drafted plan" --mention sqlite,tool-x
    vibe convo unread <conversation_id> --actor reviewer --type agent
    vibe convo monitor <conversation_id> --join --actor observer --type human
`;

switch (cmd) {
  case "version":
  case "--version":
  case "-v":
    console.log(`vibe v${CLI_VERSION}`);
    break;
  case "setup": {
    const { runSetup } = await import("./commands/setup.command.js");
    await runSetup(args);
    break;
  }
  case "init": {
    console.error("  Command removed: vibe init\n");
    console.error("  Use: vibe setup\n");
    process.exit(1);
    break;
  }
  case "list": {
    const { runList } = await import("./commands/list.command.js");
    await runList();
    break;
  }
  case "remove": {
    const { runRemove } = await import("./commands/remove.command.js");
    await runRemove(args);
    break;
  }
  case "update": {
    const { runUpdate } = await import("./commands/list.command.js");
    await runUpdate(args);
    break;
  }
  case "research": {
    const { runResearch } = await import("./commands/research.command.js");
    await runResearch(args);
    break;
  }
  case "design": {
    const { runDesign } = await import("./commands/design.command.js");
    await runDesign(args);
    break;
  }
  case "agents": {
    const { runAgents } = await import("./commands/agents.command.js");
    await runAgents(args);
    break;
  }
  case "resource": {
    const { runResource } = await import("./commands/resource.command.js");
    await runResource(args);
    break;
  }
  case "convo":
  case "conversation": {
    const { runConvo } = await import("./commands/conversation.command.js");
    await runConvo(args);
    break;
  }
  default:
    console.log(HELP);
    if (cmd && cmd !== "--help" && cmd !== "-h") {
      console.error(`  Unknown command: ${cmd}\n`);
      process.exit(1);
    }
}
