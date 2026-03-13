import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
import { VIBE_ART, printHeader } from "../core/tui.js";

function shortenHome(input) {
  return input.replace(os.homedir(), "~");
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function collectTopicOutputs(baseDir, fileNames = ["output.md"]) {
  if (!fs.existsSync(baseDir)) return [];

  const dirs = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("."));

  const outputs = [];
  for (const topic of dirs) {
    for (const fileName of fileNames) {
      const filePath = path.join(baseDir, topic, fileName);
      if (fs.existsSync(filePath)) {
        outputs.push(filePath);
        break;
      }
    }
  }

  return outputs;
}

function parseSectionStatuses(stateFile) {
  if (!fs.existsSync(stateFile)) return {};
  const content = fs.readFileSync(stateFile, "utf8");
  const matches = content.matchAll(/## \[(.*?)\] status:\s*(.+)/g);
  const statuses = {};

  for (const match of matches) {
    const key = String(match[1] || "").trim().toUpperCase();
    statuses[key] = String(match[2] || "").trim();
  }

  return statuses;
}

function isDoneStatus(value) {
  return String(value || "").toLowerCase().includes("done");
}

function printCheck(label, ok, detail = "") {
  const icon = ok ? chalk.green("✓") : chalk.red("✗");
  const text = ok ? chalk.white(label) : chalk.yellow(label);
  const suffix = detail ? chalk.dim(` — ${detail}`) : "";
  console.log(`  ${icon}  ${text}${suffix}`);
}

function printUsage() {
  console.log(`
Usage:
  vibe resource status .
  vibe resource status <project-root>
`);
}

async function runResourceStatus(args) {
  const target = args[0] || ".";
  const projectRoot = path.resolve(process.cwd(), target);

  const researchRoot = path.join(projectRoot, ".vibe", "research");
  const designRoot = path.join(projectRoot, ".vibe", "design");
  const resourceRoot = path.join(projectRoot, ".vibe", "resource");

  const paths = {
    researchOverview: path.join(researchRoot, "overview.md"),
    designOverview: path.join(designRoot, "overview.md"),
    resourceState: path.join(resourceRoot, "state.md"),
    bridge: path.join(resourceRoot, "context", "bridge.md"),
    changelog: path.join(projectRoot, "CHANGE_LOGS.md"),
    agents: path.join(projectRoot, "AGENTS.md"),
    promptsRoot: path.join(projectRoot, ".vibe", "prompts"),
    config: path.join(projectRoot, ".vibe", "config.json"),
  };

  const researchOutputs = collectTopicOutputs(researchRoot, [
    "output.md",
    "research.output.md",
  ]);
  const designOutputs = collectTopicOutputs(designRoot, [
    "output.md",
    "design.output.md",
  ]);

  const statuses = parseSectionStatuses(paths.resourceState);
  const skillDone = isDoneStatus(statuses.SKILL_FIND);
  const baseDone = isDoneStatus(statuses.BASE);
  const verifyDone = isDoneStatus(statuses.VERIFY);

  const config = readJson(paths.config);
  const setupMode = config.setupMode || "extra";

  const promptFiles = fs.existsSync(paths.promptsRoot)
    ? fs.readdirSync(paths.promptsRoot).filter((file) => file.endsWith(".md"))
    : [];

  process.stdout.write("\x1b[2J\x1b[H");
  console.log(VIBE_ART);
  printHeader("Resource Status");
  console.log(chalk.dim(`  Project: ${shortenHome(projectRoot)}`));
  console.log(chalk.dim(`  Preferred mode: ${setupMode}`));
  console.log();

  printCheck(
    "Research overview",
    fs.existsSync(paths.researchOverview),
    shortenHome(paths.researchOverview),
  );
  printCheck(
    "Research outputs",
    researchOutputs.length > 0,
    `${researchOutputs.length} found`,
  );
  printCheck(
    "Design overview",
    fs.existsSync(paths.designOverview),
    shortenHome(paths.designOverview),
  );
  printCheck(
    "Design outputs",
    designOutputs.length > 0,
    `${designOutputs.length} found`,
  );
  printCheck(
    "Resource state",
    fs.existsSync(paths.resourceState),
    shortenHome(paths.resourceState),
  );
  printCheck(
    "Bridge context",
    fs.existsSync(paths.bridge),
    shortenHome(paths.bridge),
  );
  printCheck(
    "Root changelog",
    fs.existsSync(paths.changelog),
    shortenHome(paths.changelog),
  );
  printCheck(
    "Skill discovery",
    skillDone,
    statuses.SKILL_FIND || "pending",
  );
  printCheck("Base scaffold", baseDone, statuses.BASE || "pending");

  const promptDetail =
    promptFiles.length > 0
      ? `${promptFiles.length} files in ${shortenHome(paths.promptsRoot)}`
      : "not installed";
  printCheck("Prompt library", promptFiles.length > 0, promptDetail);

  const ready =
    fs.existsSync(paths.researchOverview) &&
    fs.existsSync(paths.designOverview) &&
    researchOutputs.length > 0 &&
    designOutputs.length > 0 &&
    fs.existsSync(paths.resourceState) &&
    fs.existsSync(paths.bridge) &&
    fs.existsSync(paths.changelog) &&
    skillDone &&
    baseDone;

  console.log();
  printHeader("Next Actions");

  const actions = [];
  if (!fs.existsSync(paths.researchOverview)) {
    actions.push("Run /research.new then /research.setup");
  } else if (researchOutputs.length === 0) {
    actions.push("Run /research.setup to produce output.md");
  }

  if (!fs.existsSync(paths.designOverview)) {
    actions.push("Run /design.new then /design.setup");
  } else if (designOutputs.length === 0) {
    actions.push("Run /design.setup to produce output.md");
  }

  if (!fs.existsSync(paths.resourceState) || !fs.existsSync(paths.bridge)) {
    actions.push("Run /resource.setup");
  }

  if (fs.existsSync(paths.resourceState) && !skillDone) {
    actions.push("Run /resource.findskills");
  }

  if (fs.existsSync(paths.resourceState) && !baseDone) {
    actions.push("Run /resource.base");
  }

  if (ready && !verifyDone) {
    actions.push("Run /resource.verify");
  }

  if (ready) {
    console.log(chalk.green("  Ready for implementation with Spec-Kit/GSD/BMAD."));
  }

  if (actions.length === 0 && !ready) {
    console.log(chalk.yellow("  No single next step inferred. Re-run /resource.setup."));
  } else {
    actions.forEach((action, idx) => {
      console.log(`  ${chalk.cyan(String(idx + 1) + ".")} ${action}`);
    });
  }

  console.log();
}

/**
 * Routes `vibe resource ...` subcommands.
 */
export async function runResource(args) {
  const [subcmd, ...rest] = args;

  if (!subcmd || subcmd === "--help" || subcmd === "-h") {
    printUsage();
    return;
  }

  if (subcmd === "status") {
    await runResourceStatus(rest);
    return;
  }

  console.error(chalk.red(`\nUnknown resource command: ${subcmd}\n`));
  printUsage();
  process.exitCode = 1;
}
