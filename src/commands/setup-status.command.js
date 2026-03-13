import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
import { VIBE_ART, printHeader } from "../core/tui.js";
import { evaluateWorkflowReadiness } from "../system/workflow-status.js";

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
  vibe setup status .
  vibe setup status <project-root>
`);
}

/**
 * Shows setup readiness summary and next actions.
 */
export async function runSetupStatus(args) {
  if (args[0] === "--help" || args[0] === "-h") {
    printUsage();
    return;
  }

  const target = args[0] || ".";
  const projectRoot = path.resolve(process.cwd(), target);

  const paths = {
    state: path.join(projectRoot, ".vibe", "state.md"),
    bridge: path.join(projectRoot, ".vibe", "context", "bridge.md"),
    changelog: path.join(projectRoot, "CHANGE_LOGS.md"),
    config: path.join(projectRoot, ".vibe", "config.json"),
  };

  if (!fs.existsSync(paths.state)) {
    process.stdout.write("\x1b[2J\x1b[H");
    console.log(VIBE_ART);
    printHeader("Setup Status");
    console.log(chalk.dim(`  Project: ${shortenHome(projectRoot)}`));
    console.log();
    printCheck("State file", false, shortenHome(paths.state));
    console.log();
    printHeader("Next Actions");
    console.log("  1. Run /setup.init");
    console.log();
    return;
  }

  const statuses = parseSectionStatuses(paths.state);
  const scanDone = isDoneStatus(statuses.SCAN);
  const interviewDone = isDoneStatus(statuses.INTERVIEW);
  const detectDone = isDoneStatus(statuses.DETECT);
  const installDone = isDoneStatus(statuses.INSTALL);
  const docsDone = isDoneStatus(statuses.DOCS);
  const skillsDone = isDoneStatus(statuses.SKILLS);
  const verifyDone = isDoneStatus(statuses.VERIFY);
  const workflowStatus = evaluateWorkflowReadiness(projectRoot, paths.state);

  const config = readJson(paths.config);
  const setupMode = config.setupMode || "extra";

  process.stdout.write("\x1b[2J\x1b[H");
  console.log(VIBE_ART);
  printHeader("Setup Status");
  console.log(chalk.dim(`  Project: ${shortenHome(projectRoot)}`));
  console.log(chalk.dim(`  Preferred mode: ${setupMode}`));
  console.log();

  printCheck("State file", true, shortenHome(paths.state));
  printCheck("Bridge context", fs.existsSync(paths.bridge), shortenHome(paths.bridge));
  printCheck("Root changelog", fs.existsSync(paths.changelog), shortenHome(paths.changelog));
  printCheck("Scan", scanDone, statuses.SCAN || "pending");
  printCheck("Interview", interviewDone, statuses.INTERVIEW || "pending");
  printCheck("Detect", detectDone, statuses.DETECT || "pending");
  printCheck("Install", installDone, statuses.INSTALL || "pending");
  printCheck("Docs", docsDone, statuses.DOCS || "pending");
  printCheck("Skills", skillsDone, statuses.SKILLS || "pending");
  printCheck("Verify", verifyDone, statuses.VERIFY || "pending");

  printHeader("Workflow Tooling");
  workflowStatus.checks.forEach((check) => {
    const label = check.optional ? `${check.label} (optional)` : check.label;
    printCheck(label, check.ready, check.detail);
  });

  const baseReady =
    fs.existsSync(paths.bridge) &&
    fs.existsSync(paths.changelog) &&
    scanDone &&
    interviewDone &&
    detectDone &&
    installDone &&
    docsDone &&
    skillsDone &&
    workflowStatus.selectedReady;

  console.log();
  printHeader("Next Actions");

  const actions = [];
  if (!scanDone) actions.push("Run /setup.init (scan)");
  if (!interviewDone) actions.push("Run /setup.init (interview)");
  if (!detectDone) actions.push("Run /setup.detect");
  if (!installDone) actions.push("Run /setup.install");
  if (!docsDone) actions.push("Run /setup.docs");
  if (!skillsDone) actions.push("Run /setup.skills");

  if (workflowStatus.missingSelected.length > 0) {
    actions.push(
      `Run /setup.install to finish selected workflows (${workflowStatus.missingSelected.join(", ")})`,
    );
  }

  if (baseReady && !verifyDone) {
    actions.push("Run /setup.verify");
  }

  if (baseReady && verifyDone) {
    console.log(chalk.green("  Setup complete. Ready for implementation."));
  } else if (actions.length === 0) {
    console.log(chalk.yellow("  No single next step inferred. Re-run /setup.init."));
  } else {
    actions.forEach((action, idx) => {
      console.log(`  ${chalk.cyan(String(idx + 1) + ".")} ${action}`);
    });
  }

  console.log();
}
