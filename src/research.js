import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
import { VIBE_ART, printHeader } from "./tui.js";

function formatTime(value) {
  return new Date(value).toISOString().replace("T", " ").slice(0, 19);
}

function shortenHome(input) {
  return input.replace(os.homedir(), "~");
}

function readTitle(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const heading = content
      .split("\n")
      .find((line) => line.trim().startsWith("# "));
    return heading ? heading.replace(/^#\s+/, "").trim() : "research output";
  } catch {
    return "research output";
  }
}

function readTopicStatus(statePath) {
  if (!fs.existsSync(statePath)) return "unknown";
  const content = fs.readFileSync(statePath, "utf8");

  const exportMatch = content.match(/^export:\s*(.+)$/m);
  if (exportMatch) return exportMatch[1].trim();

  const stageOrder = ["discuss", "analyze", "interview", "scan"];
  for (const stage of stageOrder) {
    const match = content.match(new RegExp(`^${stage}:\\s*(.+)$`, "m"));
    if (!match) continue;
    const status = match[1].trim().toLowerCase();
    if (status !== "done") return `${stage}:${status}`;
  }
  return "done";
}

function collectResearchTopics(baseDir) {
  if (!fs.existsSync(baseDir)) return [];

  const dirs = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("."));

  const topics = [];

  for (const topic of dirs) {
    const outputCandidates = [
      path.join(baseDir, topic, "output.md"),
      path.join(baseDir, topic, "research.output.md"),
    ];
    const outputFile = outputCandidates.find((candidate) =>
      fs.existsSync(candidate),
    );

    const stateFile = path.join(baseDir, topic, "state.md");
    if (!outputFile && !fs.existsSync(stateFile)) continue;

    const statFile = outputFile || stateFile;
    const stat = fs.statSync(statFile);
    topics.push({
      topic,
      outputFile,
      stateFile,
      status: readTopicStatus(stateFile),
      updatedAt: stat.mtimeMs,
      title: outputFile ? readTitle(outputFile) : "research topic",
    });
  }

  return topics.sort((a, b) => b.updatedAt - a.updatedAt);
}

function readActiveTopic(baseDir) {
  const activeFile = path.join(baseDir, "active.md");
  if (!fs.existsSync(activeFile)) return "";
  return fs.readFileSync(activeFile, "utf8").trim();
}

function printUsage() {
  console.log(`
Usage:
  vibe research result .
  vibe research result <project-root>
  vibe research global
`);
}

function printTopicList(title, baseDir, topics) {
  process.stdout.write("\x1b[2J\x1b[H");
  console.log(VIBE_ART);
  printHeader(title);
  console.log(chalk.dim(`  Source: ${shortenHome(baseDir)}\n`));

  const overviewFile = path.join(baseDir, "overview.md");
  if (fs.existsSync(overviewFile)) {
    console.log(chalk.dim(`  Overview: ${shortenHome(overviewFile)}`));
  }

  const active = readActiveTopic(baseDir);
  if (active) {
    console.log(chalk.dim(`  Active:   ${active}`));
  }

  if (topics.length === 0) {
    console.log(chalk.dim("\n  No research topics found.\n"));
    return;
  }

  console.log();
  topics.forEach((entry, index) => {
    const timestamp = formatTime(entry.updatedAt);
    const activeMark = active && active === entry.topic ? "*" : " ";
    console.log(
      `  ${activeMark}${chalk.cyan(String(index + 1).padStart(2, "0"))}. ${chalk.white(entry.topic)}  ${chalk.dim(timestamp)}`,
    );
    console.log(`      status: ${chalk.dim(entry.status)}`);
    console.log(`      ${chalk.dim(entry.title)}`);
    if (entry.outputFile) {
      console.log(`      ${chalk.dim(shortenHome(entry.outputFile))}`);
    }
  });

  console.log();
}

async function runResearchResult(args) {
  const target = args[0] || ".";
  const projectRoot = path.resolve(process.cwd(), target);
  const baseDir = path.join(projectRoot, ".vibe", "research");
  const topics = collectResearchTopics(baseDir);

  printTopicList("Research Results (Local)", baseDir, topics);
}

async function runResearchGlobal() {
  const baseDir = path.join(os.homedir(), ".config", "vibe", "research");
  const topics = collectResearchTopics(baseDir);

  printTopicList("Research Results (Global)", baseDir, topics);
}

export async function runResearch(args) {
  const [subcmd, ...rest] = args;

  if (!subcmd || subcmd === "--help" || subcmd === "-h") {
    printUsage();
    return;
  }

  if (subcmd === "result") {
    await runResearchResult(rest);
    return;
  }

  if (subcmd === "global") {
    await runResearchGlobal();
    return;
  }

  console.error(chalk.red(`\nUnknown research command: ${subcmd}\n`));
  printUsage();
  process.exitCode = 1;
}
