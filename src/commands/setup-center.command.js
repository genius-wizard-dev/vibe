import chalk from "chalk";
import inquirer from "inquirer";
import { AGENT_RUNTIMES } from "../core/agent-registry.js";
import { runAgents } from "./agents.command.js";
import { runConvo } from "./conversation.command.js";
import { runSetupStatus } from "./setup-status.command.js";
import { runSetupWizard } from "./setup.command.js";
import {
  BACK_ACTION,
  printHeader,
  printStep,
  singleSelect,
  VIBE_ART,
} from "../core/tui.js";
import { detectInstalledTools } from "../system/tools.js";
import { getWorkspaceStatus } from "../system/workspace-status.js";
import { evaluateWorkflowReadiness } from "../system/workflow-status.js";

// Setup Center is a persistent TUI menu used to orchestrate
// workspace setup, agent management, conversation management, and monitoring.

function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H");
}

async function waitForEnter(message = "Press Enter or B to go back") {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    return;
  }

  process.stdout.write(`\n  ${chalk.dim(message)} `);

  await new Promise((resolve) => {
    const onKeypress = (buf) => {
      const key = buf.toString();
      const normalized = key.toLowerCase();

      if (key === "\x03") {
        process.exit();
      }

      if (key === "\r" || key === "\n" || normalized === "b") {
        process.stdin.off("data", onKeypress);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        console.log();
        resolve();
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onKeypress);
  });
}

function buildMenuSuffix({
  noTools = false,
  needWorkspace = false,
  needWorkflow = false,
}) {
  const tags = [];
  if (noTools) tags.push("no tools setup");
  if (needWorkspace) tags.push("setup init recommended");
  if (needWorkflow) tags.push("workflow setup recommended");
  return tags.length > 0 ? ` ${chalk.dim(`(${tags.join(", ")})`)}` : "";
}

function printSettingFrame() {
  clearScreen();
  console.log(VIBE_ART);
  printHeader("Settings Center");
}

function getRuntimeChoices() {
  return Object.keys(AGENT_RUNTIMES).map((runtime) => ({
    name: `${AGENT_RUNTIMES[runtime].label} (${runtime})`,
    value: runtime,
  }));
}

function buildMainMenuOptions() {
  const tools = detectInstalledTools();
  const installedTools = tools.filter((tool) => tool.installed);
  const noTools = installedTools.length === 0;
  const workspace = getWorkspaceStatus(process.cwd());
  const needWorkspace = !workspace.convoReady;
  const needWorkflow = workspace.hasSetupState && !workspace.workflowReady;

  return {
    tools,
    noTools,
    needWorkspace,
    needWorkflow,
    options: [
      {
        value: "tools",
        label: "Setup AI tools / model",
        desc: "Scan installed CLI tools and show install links",
      },
      {
        value: "workspace_setup",
        label: `Setup workspace${buildMenuSuffix({ noTools, needWorkflow })}`,
        desc: "Run vibe setup wizard",
        blocked: noTools,
      },
      {
        value: "agents_setup",
        label: `Setup agents${buildMenuSuffix({ noTools })}`,
        desc: "Create and manage local AI agents",
        blocked: noTools,
      },
      {
        value: "convo_setup",
        label: `Setup convo${buildMenuSuffix({ noTools, needWorkspace })}`,
        desc: "Initialize convo DB and start meetings",
        blocked: noTools,
      },
      {
        value: "convo_list",
        label: `Conversation list${buildMenuSuffix({ noTools, needWorkspace })}`,
        desc: "Show all conversations",
        blocked: noTools,
      },
      {
        value: "convo_active",
        label: `Active conversations${buildMenuSuffix({ noTools, needWorkspace })}`,
        desc: "Show active conversation threads",
        blocked: noTools,
      },
      {
        value: "convo_monitor",
        label: `Realtime AI monitor${buildMenuSuffix({ noTools, needWorkspace })}`,
        desc: "Join/watch realtime AI conversation stream",
        blocked: noTools,
      },
      {
        value: "agents_list",
        label: `Agent list${buildMenuSuffix({ noTools })}`,
        desc: "List existing agents",
        blocked: noTools,
      },
      {
        value: "setup_status",
        label: `Workspace setup status${buildMenuSuffix({ noTools, needWorkflow })}`,
        desc: "Check workspace readiness and next actions",
        blocked: noTools,
      },
      {
        value: "exit",
        label: "Exit",
        desc: "Close settings center",
      },
    ],
  };
}

async function showToolSetupScreen(tools) {
  printSettingFrame();
  printHeader("AI Tool Setup");
  const workflowStatus = evaluateWorkflowReadiness(process.cwd());

  const installed = tools.filter((tool) => tool.installed);
  tools.forEach((tool) => {
    if (tool.installed) {
      printStep(
        tool.label,
        "done",
        `${tool.detectedCommand} (${tool.detectedPath})`,
      );
      return;
    }
    printStep(tool.label, "skip", "not found");
  });

  console.log();
  if (installed.length === 0) {
    console.log(chalk.red("  No tools detected. Install at least one tool first."));
    tools.forEach((tool) => {
      console.log(chalk.dim(`  - ${tool.label}: ${tool.installHint}`));
    });
  } else {
    console.log(chalk.green(`  Ready: ${installed.length} tools detected.`));
    console.log(chalk.dim("  You can continue with workspace setup and menu actions."));
  }

  printHeader("Workflow Tooling");
  workflowStatus.checks.forEach((check) => {
    const status = check.selected ? (check.ready ? "done" : "fail") : "skip";
    printStep(check.label, status, check.detail);
  });

  console.log();
  if (workflowStatus.missingSelected.length > 0) {
    console.log(
      chalk.yellow(
        `  Missing selected workflows: ${workflowStatus.missingSelected.join(", ")}.`,
      ),
    );
    console.log(
      chalk.dim(
        "  Run /setup.install to finish setup. Already-installed workflows are auto-skipped.",
      ),
    );
  } else {
    console.log(chalk.green("  Workflow tooling check passed for selected flows."));
  }

  await waitForEnter();
}

async function runAgentSetupMenu() {
  const menuOptions = [
    {
      value: "create",
      label: "Create agent",
      desc: "Interactive quick create",
    },
    {
      value: "create_many",
      label: "Create sub-agents",
      desc: "Batch create many sub-agents",
    },
    {
      value: "list",
      label: "List agents",
      desc: "Show all agents",
    },
    {
      value: "back",
      label: "Back",
      desc: "Return to settings",
    },
  ];

  while (true) {
    const action = await singleSelect({
      title: "Agents Setup",
      subtitle: "Create/manage local AI agents",
      options: menuOptions,
      allowBack: true,
    });

    if (action === BACK_ACTION || action === "back") {
      return;
    }

    if (action === "list") {
      await runAgents(["list"]);
      await waitForEnter();
      continue;
    }

    if (action === "create") {
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Agent name (slug):",
          validate: (value) =>
            String(value || "").trim().length > 0 || "Agent name is required",
        },
        {
          type: "list",
          name: "runtime",
          message: "Runtime:",
          choices: getRuntimeChoices(),
          default: "opencode",
        },
        {
          type: "input",
          name: "role",
          message: "Role:",
          default: "specialist",
        },
        {
          type: "input",
          name: "goal",
          message: "Goal:",
          default:
            "Analyze assigned topic and collaborate with other agents to reach practical decisions.",
        },
        {
          type: "input",
          name: "skills",
          message: "Skills (csv, optional):",
          default: "",
        },
      ]);

      const args = [
        "create",
        answers.name,
        "--runtime",
        answers.runtime,
        "--role",
        answers.role,
        "--goal",
        answers.goal,
        "--yes",
      ];

      if (String(answers.skills || "").trim()) {
        args.push("--skills", answers.skills);
      }

      await runAgents(args);
      await waitForEnter();
      continue;
    }

    if (action === "create_many") {
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "prefix",
          message: "Sub-agent prefix:",
          default: "sub-agent",
          validate: (value) =>
            String(value || "").trim().length > 0 || "Prefix is required",
        },
        {
          type: "input",
          name: "count",
          message: "How many sub-agents:",
          default: "3",
          validate: (value) => {
            const parsed = Number.parseInt(String(value), 10);
            if (Number.isNaN(parsed) || parsed <= 0) {
              return "Count must be a positive integer";
            }
            if (parsed > 50) {
              return "Maximum count is 50";
            }
            return true;
          },
        },
        {
          type: "list",
          name: "runtime",
          message: "Runtime:",
          choices: getRuntimeChoices(),
          default: "opencode",
        },
        {
          type: "input",
          name: "role",
          message: "Role:",
          default: "specialist",
        },
        {
          type: "input",
          name: "goal",
          message: "Goal (optional):",
          default: "",
        },
        {
          type: "input",
          name: "skills",
          message: "Skills (csv, optional):",
          default: "",
        },
      ]);

      const args = [
        "create-many",
        answers.prefix,
        "--count",
        String(answers.count),
        "--runtime",
        answers.runtime,
        "--role",
        answers.role,
        "--yes",
      ];

      if (String(answers.goal || "").trim()) {
        args.push("--goal", answers.goal);
      }

      if (String(answers.skills || "").trim()) {
        args.push("--skills", answers.skills);
      }

      await runAgents(args);
      await waitForEnter();
    }
  }
}

async function runConvoSetupMenu() {
  const menuOptions = [
    {
      value: "init",
      label: "Init convo DB",
      desc: "Create and migrate conversation database",
    },
    {
      value: "create",
      label: "Create conversation",
      desc: "Open a new conversation thread",
    },
    {
      value: "add",
      label: "Add agent to convo",
      desc: "Join agent into conversation",
    },
    {
      value: "start",
      label: "Start AI meeting",
      desc: "Run workflow on selected conversation",
    },
    {
      value: "back",
      label: "Back",
      desc: "Return to settings",
    },
  ];

  while (true) {
    const action = await singleSelect({
      title: "Conversation Setup",
      subtitle: "Init and operate multi-agent conversations",
      options: menuOptions,
      allowBack: true,
    });

    if (action === BACK_ACTION || action === "back") {
      return;
    }

    if (action === "init") {
      await runConvo(["init"]);
      await waitForEnter();
      continue;
    }

    if (action === "create") {
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "title",
          message: "Conversation title:",
          validate: (value) =>
            String(value || "").trim().length > 0 || "Conversation title is required",
        },
        {
          type: "input",
          name: "createdBy",
          message: "Created by actor id:",
          default: "lead-agent",
        },
        {
          type: "list",
          name: "type",
          message: "Actor type:",
          choices: ["agent", "human", "system"],
          default: "agent",
        },
      ]);

      await runConvo([
        "create",
        answers.title,
        "--by",
        answers.createdBy,
        "--type",
        answers.type,
        "--yes",
      ]);
      await waitForEnter();
      continue;
    }

    if (action === "add") {
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "conversationId",
          message: "Conversation id:",
          validate: (value) =>
            String(value || "").trim().length > 0 || "conversation_id is required",
        },
        {
          type: "input",
          name: "agent",
          message: "Agent name:",
          validate: (value) =>
            String(value || "").trim().length > 0 || "Agent name is required",
        },
        {
          type: "input",
          name: "role",
          message: "Role (optional):",
          default: "",
        },
      ]);

      const args = [
        "add",
        answers.conversationId,
        "--agent",
        answers.agent,
        "--yes",
      ];
      if (String(answers.role || "").trim()) {
        args.push("--role", answers.role);
      }

      await runConvo(args);
      await waitForEnter();
      continue;
    }

    if (action === "start") {
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "conversationId",
          message: "Conversation id:",
          validate: (value) =>
            String(value || "").trim().length > 0 || "conversation_id is required",
        },
        {
          type: "input",
          name: "topic",
          message: "Topic:",
          validate: (value) => String(value || "").trim().length > 0 || "Topic is required",
        },
      ]);

      await runConvo([
        "start",
        answers.conversationId,
        "--topic",
        answers.topic,
        "--yes",
      ]);
      await waitForEnter();
    }
  }
}

async function runConvoMonitorFlow() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "conversationId",
      message: "Conversation id to monitor:",
      validate: (value) =>
        String(value || "").trim().length > 0 || "conversation_id is required",
    },
    {
      type: "confirm",
      name: "join",
      message: "Join as watcher before monitoring?",
      default: true,
    },
    {
      type: "input",
      name: "actor",
      message: "Watcher actor id:",
      default: "observer",
      when: (values) => values.join,
    },
    {
      type: "list",
      name: "type",
      message: "Watcher actor type:",
      choices: ["human", "agent", "system"],
      default: "human",
      when: (values) => values.join,
    },
  ]);

  const args = ["monitor", answers.conversationId];
  if (answers.join) {
    args.push("--join", "--actor", answers.actor, "--type", answers.type);
  }

  await runConvo(args);
  await waitForEnter();
}

/**
 * Opens and manages the interactive Setup Center menu.
 */
export async function runSetupCenter(args) {
  const autoYes = args.includes("--yes") || args.includes("-y");

  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    printSettingFrame();
    console.log(chalk.yellow("  Interactive menu requires a TTY terminal."));
    console.log(chalk.dim("  Use direct commands: vibe setup, vibe agents ..., vibe convo ..."));
    console.log();
    return;
  }

  if (autoYes) {
    printSettingFrame();
    console.log(chalk.dim("  Auto-confirm enabled (--yes)."));
  }

  while (true) {
    const { tools, noTools, options } = buildMainMenuOptions();

    const selectedValue = await singleSelect({
      title: "Main Menu",
      subtitle: "Everything stays in menu until you choose Exit",
      options,
      allowBack: true,
    });

    if (selectedValue === BACK_ACTION || selectedValue === "exit") {
      printSettingFrame();
      console.log(chalk.green("  Settings closed.\n"));
      return;
    }

    const selected = options.find((option) => option.value === selectedValue);
    if (!selected) continue;

    if (selected.blocked) {
      printSettingFrame();
      printHeader("Unavailable");
      if (noTools) {
        console.log(chalk.yellow("  This action is blocked because no tools are setup."));
        console.log(chalk.dim("  Open 'Setup AI tools / model' and install at least one CLI tool."));
      }
      await waitForEnter();
      continue;
    }

    try {
      if (selectedValue === "tools") {
        await showToolSetupScreen(tools);
        continue;
      }

      if (selectedValue === "workspace_setup") {
        const setupResult = await runSetupWizard(["--yes"]);
        if (setupResult !== BACK_ACTION) {
          await waitForEnter();
        }
        continue;
      }

      if (selectedValue === "agents_setup") {
        await runAgentSetupMenu();
        continue;
      }

      if (selectedValue === "convo_setup") {
        await runConvoSetupMenu();
        continue;
      }

      if (selectedValue === "convo_list") {
        await runConvo(["list"]);
        await waitForEnter();
        continue;
      }

      if (selectedValue === "convo_active") {
        await runConvo(["list", "--active-only"]);
        await waitForEnter();
        continue;
      }

      if (selectedValue === "convo_monitor") {
        await runConvoMonitorFlow();
        continue;
      }

      if (selectedValue === "agents_list") {
        await runAgents(["list"]);
        await waitForEnter();
        continue;
      }

      if (selectedValue === "setup_status") {
        await runSetupStatus(["."]);
        await waitForEnter();
      }
    } catch (error) {
      printSettingFrame();
      printHeader("Error");
      console.log(chalk.red(`  ${error.message}`));
      await waitForEnter();
    }
  }
}
