import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import os from "os";
import path from "path";
import {
  AGENT_RUNTIMES,
  createAgentDefinition,
  listAgentDefinitions,
  loadAgentDefinition,
  suggestAgentsForTopic,
  updateAgentDefinition,
} from "../core/agent-registry.js";

// Agents command manages local agent profiles under `.vibe/agents`.

function shortenHome(input) {
  return input.replace(os.homedir(), "~");
}

function parseFlags(tokens) {
  const options = {};
  const positional = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const key = token.slice(2);
    if (!key) {
      throw new Error(`Invalid option: ${token}`);
    }

    if (key === "yes") {
      options.yes = true;
      continue;
    }

    if (key === "sync-brain") {
      options["sync-brain"] = true;
      continue;
    }

    const next = tokens[i + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    options[key] = next;
    i += 1;
  }

  return { options, positional };
}

async function confirmAction(message, autoYes) {
  if (autoYes) return;

  if (!process.stdin.isTTY) {
    throw new Error("Confirmation required. Re-run command with --yes");
  }

  const { accepted } = await inquirer.prompt([
    {
      type: "confirm",
      name: "accepted",
      message,
      default: true,
    },
  ]);

  if (!accepted) {
    throw new Error("Action cancelled by user");
  }
}

function printUsage() {
  console.log(`
Usage:
  vibe agents create <name> [--runtime opencode|claude|codex|gemini|kirocli] [--role <role>] [--goal <text>] [--skills <csv>] [--command <bin>] [--mode stdin|arg] [--args <template>] [--yes]
  vibe agents create-many <prefix> --count <n> [--runtime opencode|claude|codex|gemini|kirocli] [--role <role>] [--goal <text>] [--skills <csv>] [--command <bin>] [--mode stdin|arg] [--args <template>] [--yes]
  vibe agents edit <name> [--runtime opencode|claude|codex|gemini|kirocli] [--role <role>] [--goal <text>] [--skills <csv>] [--command <bin>] [--mode stdin|arg] [--args <template>] [--timeout <ms>] [--sync-brain] [--yes]
  vibe agents list
  vibe agents show <name>
  vibe agents suggest --topic <text> [--limit <n>]
`);
}

function parseLimit(value, fallback = 5) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid limit: ${value}`);
  }
  return parsed;
}

function parseCount(value, fallback = 3) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid count: ${value}`);
  }
  if (parsed > 50) {
    throw new Error("Count too large. Maximum is 50");
  }
  return parsed;
}

function ensureRuntime(value) {
  if (!value) return "opencode";
  if (!AGENT_RUNTIMES[value]) {
    throw new Error(
      `Invalid runtime: ${value}. Expected one of: ${Object.keys(AGENT_RUNTIMES).join(", ")}`,
    );
  }
  return value;
}

async function handleCreate(args) {
  const { options, positional } = parseFlags(args);
  const name = positional[0] || "";
  const runtime = ensureRuntime(options.runtime || "opencode");

  if (!name) {
    throw new Error("Missing agent name");
  }

  await confirmAction(
    `Create agent '${name}' with runtime '${runtime}' and role '${options.role || "specialist"}'?`,
    Boolean(options.yes),
  );

  const created = createAgentDefinition(process.cwd(), {
    name,
    runtime,
    role: options.role,
    goal: options.goal,
    skillsCsv: options.skills,
    command: options.command,
    mode: options.mode,
    argsTemplate: options.args,
  });

  console.log(chalk.green("\nAgent created."));
  console.log(chalk.white(`  name: ${created.profile.name}`));
  console.log(chalk.dim(`  runtime: ${created.profile.runtime}`));
  console.log(chalk.dim(`  role: ${created.profile.role}`));
  console.log(chalk.dim(`  profile: ${shortenHome(path.join(created.agentDir, "profile.json"))}`));
  console.log(chalk.dim(`  brain: ${shortenHome(path.join(created.agentDir, "brain.md"))}`));
  console.log(chalk.dim("  Next: vibe agents list"));
  console.log();
}

async function handleCreateMany(args) {
  const { options, positional } = parseFlags(args);
  const prefix = positional[0] || options.prefix || "";
  const runtime = ensureRuntime(options.runtime || "opencode");
  const count = parseCount(options.count, 3);

  if (!prefix) {
    throw new Error("Missing agent prefix");
  }

  await confirmAction(
    `Create ${count} sub-agents with prefix '${prefix}' (runtime=${runtime})?`,
    Boolean(options.yes),
  );

  const createdAgents = [];
  const failedAgents = [];

  for (let index = 1; index <= count; index += 1) {
    const name = `${prefix}-${index}`;

    try {
      const goal = options.goal
        ? `${options.goal} (sub-agent ${index}/${count})`
        : undefined;

      const created = createAgentDefinition(process.cwd(), {
        name,
        runtime,
        role: options.role,
        goal,
        skillsCsv: options.skills,
        command: options.command,
        mode: options.mode,
        argsTemplate: options.args,
      });

      createdAgents.push(created.profile.name);
    } catch (error) {
      failedAgents.push({ name, reason: error.message });
    }
  }

  console.log(chalk.green("\nSub-agents creation finished."));
  console.log(chalk.white(`  requested: ${count}`));
  console.log(chalk.green(`  created: ${createdAgents.length}`));
  if (failedAgents.length > 0) {
    console.log(chalk.red(`  failed: ${failedAgents.length}`));
    failedAgents.forEach((entry) => {
      console.log(chalk.dim(`    - ${entry.name}: ${entry.reason}`));
    });
  }
  if (createdAgents.length > 0) {
    console.log(chalk.dim(`  agents: ${createdAgents.join(", ")}`));
  }
  console.log(chalk.dim("  Next: vibe agents list"));
  console.log();
}

async function handleEdit(args) {
  const { options, positional } = parseFlags(args);
  const name = positional[0] || "";

  if (!name) {
    throw new Error("Missing agent name");
  }

  const existing = loadAgentDefinition(process.cwd(), name);
  if (!existing) {
    throw new Error(`Agent not found: ${name}`);
  }

  const runtime = options.runtime ? ensureRuntime(options.runtime) : undefined;
  const timeout = options.timeout;

  const hasUpdate = [
    runtime,
    options.role,
    options.goal,
    options.skills,
    options.command,
    options.mode,
    options.args,
    timeout,
    options["sync-brain"],
  ].some((value) => value !== undefined);

  if (!hasUpdate) {
    throw new Error("Nothing to update. Provide at least one edit flag");
  }

  const updatePreview = [
    runtime ? `runtime=${runtime}` : null,
    options.role ? `role=${options.role}` : null,
    options.goal ? "goal=updated" : null,
    options.skills !== undefined ? "skills=updated" : null,
    options.command ? `command=${options.command}` : null,
    options.mode ? `mode=${options.mode}` : null,
    options.args !== undefined ? "args=updated" : null,
    timeout !== undefined ? `timeout=${timeout}` : null,
    options["sync-brain"] ? "sync-brain=on" : null,
  ]
    .filter(Boolean)
    .join(", ");

  await confirmAction(
    `Update agent '${existing.name}' (${updatePreview})?`,
    Boolean(options.yes),
  );

  const updated = updateAgentDefinition(process.cwd(), {
    name: existing.name,
    runtime,
    role: options.role,
    goal: options.goal,
    skillsCsv: options.skills,
    command: options.command,
    mode: options.mode,
    argsTemplate: options.args,
    timeoutMs: timeout,
    syncBrain: Boolean(options["sync-brain"]),
  });

  console.log(chalk.green("\nAgent updated."));
  console.log(chalk.white(`  name: ${updated.profile.name}`));
  console.log(chalk.dim(`  runtime: ${updated.profile.runtime}`));
  console.log(chalk.dim(`  role: ${updated.profile.role}`));
  console.log(chalk.dim(`  command: ${updated.profile.executor.command}`));
  console.log(chalk.dim(`  mode: ${updated.profile.executor.mode}`));
  console.log(chalk.dim(`  args: ${JSON.stringify(updated.profile.executor.args)}`));
  console.log(chalk.dim(`  timeout_ms: ${updated.profile.executor.timeout_ms}`));
  if (updated.brainSynced) {
    console.log(chalk.dim("  brain.md metadata synced"));
  }
  console.log(chalk.dim(`  updated_at: ${updated.profile.updated_at}`));
  console.log();
}

function handleList() {
  const agents = listAgentDefinitions(process.cwd());

  if (agents.length === 0) {
    console.log(chalk.yellow("\nNo agents found."));
    console.log(chalk.dim("  Create one with: vibe agents create planner --runtime opencode"));
    console.log();
    return;
  }

  console.log(chalk.green("\nAgents"));
  for (const agent of agents) {
    const updatedAt = agent.profile.updated_at || "-";
    const skills = Array.isArray(agent.profile.skills)
      ? agent.profile.skills.slice(0, 4).join(", ")
      : "";
    console.log(
      `  - ${chalk.white(agent.name)} ${chalk.dim(`[${agent.profile.runtime}]`)} role=${agent.profile.role || "-"}`,
    );
    console.log(chalk.dim(`    updated: ${updatedAt}`));
    if (skills) {
      console.log(chalk.dim(`    skills: ${skills}`));
    }
  }
  console.log();
}

function handleShow(args) {
  const { positional } = parseFlags(args);
  const name = positional[0] || "";
  if (!name) {
    throw new Error("Missing agent name");
  }

  const agent = loadAgentDefinition(process.cwd(), name);
  if (!agent) {
    throw new Error(`Agent not found: ${name}`);
  }

  const brainPreview = fs.existsSync(agent.brainPath)
    ? fs.readFileSync(agent.brainPath, "utf8").split("\n").slice(0, 14).join("\n")
    : "(missing brain.md)";

  console.log(chalk.green(`\nAgent: ${agent.name}`));
  console.log(chalk.dim(`  runtime: ${agent.profile.runtime}`));
  console.log(chalk.dim(`  role: ${agent.profile.role || "-"}`));
  console.log(chalk.dim(`  goal: ${agent.profile.goal || "-"}`));
  console.log(chalk.dim(`  profile: ${shortenHome(agent.profilePath)}`));
  console.log(chalk.dim(`  brain: ${shortenHome(agent.brainPath)}`));
  console.log();
  console.log(brainPreview);
  console.log();
}

function handleSuggest(args) {
  const { options } = parseFlags(args);
  const topic = options.topic || "";
  const limit = parseLimit(options.limit, 5);

  if (!topic.trim()) {
    throw new Error("Missing --topic for suggestion");
  }

  const suggestions = suggestAgentsForTopic(process.cwd(), topic, limit);
  if (suggestions.length === 0) {
    console.log(chalk.yellow("\nNo agents available for suggestion."));
    console.log();
    return;
  }

  console.log(chalk.green("\nSuggested agents"));
  console.log(chalk.dim(`  topic: ${topic}`));

  for (const entry of suggestions) {
    const matched = entry.matched.length > 0 ? entry.matched.join(", ") : "none";
    console.log(
      `  - ${chalk.white(entry.name)} ${chalk.dim(`[score=${entry.score}]`)} runtime=${entry.profile.runtime} role=${entry.profile.role || "-"}`,
    );
    console.log(chalk.dim(`    matched: ${matched}`));
  }
  console.log();
}

/**
 * Routes `vibe agents ...` subcommands.
 */
export async function runAgents(args) {
  const [subcmd, ...rest] = args;

  if (!subcmd || subcmd === "--help" || subcmd === "-h") {
    printUsage();
    return;
  }

  try {
    if (subcmd === "create") {
      await handleCreate(rest);
      return;
    }

    if (subcmd === "create-many") {
      await handleCreateMany(rest);
      return;
    }

    if (subcmd === "edit") {
      await handleEdit(rest);
      return;
    }

    if (subcmd === "list") {
      handleList(rest);
      return;
    }

    if (subcmd === "show") {
      handleShow(rest);
      return;
    }

    if (subcmd === "suggest") {
      handleSuggest(rest);
      return;
    }

    throw new Error(`Unknown agents command: ${subcmd}`);
  } catch (error) {
    console.error(chalk.red(`\n${error.message}\n`));
    printUsage();
    process.exitCode = 1;
  }
}
