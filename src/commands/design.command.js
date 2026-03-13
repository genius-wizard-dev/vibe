import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
import { VIBE_ART, printHeader } from "../core/tui.js";

function toSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureFile(filePath, content) {
  if (fs.existsSync(filePath)) return;
  fs.writeFileSync(filePath, content, "utf8");
}

function ensureOverviewFile(filePath) {
  if (fs.existsSync(filePath)) return;
  fs.writeFileSync(
    filePath,
    `## Architecture Summary

- system scope: ~
- active style: ~
- current focus: ~

## Topics

| topic | status | stage | updated_at | output |
| --- | --- | --- | --- | --- |
`,
    "utf8",
  );
}

function appendOverviewTopic(filePath, topic, stage, updatedAt) {
  ensureOverviewFile(filePath);
  const content = fs.readFileSync(filePath, "utf8");
  const exists = new RegExp(`^\\|\\s*${topic}\\s*\\|`, "m").test(content);
  if (exists) return;

  const row = `| ${topic} | in-progress | ${stage} | ${updatedAt} | ${topic}/output.md |\n`;
  const next = content.endsWith("\n") ? `${content}${row}` : `${content}\n${row}`;
  fs.writeFileSync(filePath, next, "utf8");
}

function resolveDesignNewTarget(args) {
  let topic = "";
  let topicFromFlag = false;
  let root = ".";
  let rootFromFlag = false;
  let global = false;

  const positional = [];
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--name") {
      const value = args[i + 1] || "";
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --name");
      }
      topic = value;
      topicFromFlag = true;
      i += 1;
      continue;
    }
    if (token === "--root") {
      const value = args[i + 1] || "";
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --root");
      }
      root = value;
      rootFromFlag = true;
      i += 1;
      continue;
    }
    if (token === "--global") {
      global = true;
      continue;
    }

    if (token.startsWith("--")) {
      throw new Error(`Unknown option: ${token}`);
    }

    positional.push(token);
  }

  if (topicFromFlag && positional.length > 1) {
    throw new Error("Too many arguments for design new");
  }

  if (!topicFromFlag && positional.length > 2) {
    throw new Error("Too many arguments for design new");
  }

  if (!topicFromFlag && positional[0]) topic = positional[0];

  const positionalRoot = topicFromFlag ? positional[0] : positional[1];

  if (global && rootFromFlag) {
    throw new Error("--global cannot be used together with --root");
  }

  if (positionalRoot) {
    if (global) {
      throw new Error("Do not pass <project-root> when using --global");
    }
    if (rootFromFlag && root !== positionalRoot) {
      throw new Error("Conflicting root values: --root and positional path");
    }
    if (!rootFromFlag) root = positionalRoot;
  }

  return { topic, root, global };
}

function createDesignTopic(baseDir, topic) {
  const updatedAt = new Date().toISOString();
  const topicDir = path.join(baseDir, topic);

  if (fs.existsSync(topicDir)) {
    throw new Error(`Design topic already exists: ${shortenHome(topicDir)}`);
  }

  fs.mkdirSync(topicDir, { recursive: true });

  ensureFile(
    path.join(topicDir, "state.md"),
    `# design state

topic: ${topic}
updated_at: ${updatedAt}

arch: pending
mcp: pending
review: pending
export: pending
`,
  );
  ensureFile(path.join(topicDir, "input.md"), `# ${topic} input\n\n`);
  ensureFile(path.join(topicDir, "architecture.md"), `# ${topic} architecture\n\n`);
  ensureFile(path.join(topicDir, "mcp.md"), `# ${topic} mcp\n\n`);
  ensureFile(path.join(topicDir, "review.md"), `# ${topic} review\n\n`);
  ensureFile(path.join(topicDir, "decisions.md"), `# ${topic} decisions\n\n`);
  ensureFile(path.join(topicDir, "logs.md"), `# ${topic} logs\n\n`);
  ensureFile(path.join(topicDir, "output.md"), `# ${topic} output\n\n`);

  fs.mkdirSync(baseDir, { recursive: true });
  ensureFile(path.join(baseDir, "active.md"), "");
  fs.writeFileSync(path.join(baseDir, "active.md"), `${topic}\n`, "utf8");
  appendOverviewTopic(path.join(baseDir, "overview.md"), topic, "arch", updatedAt);

  return topicDir;
}

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
    return heading ? heading.replace(/^#\s+/, "").trim() : "design output";
  } catch {
    return "design output";
  }
}

function readTopicStatus(statePath) {
  if (!fs.existsSync(statePath)) return "unknown";
  const content = fs.readFileSync(statePath, "utf8");

  const exportMatch = content.match(/^export:\s*(.+)$/m);
  if (exportMatch) return exportMatch[1].trim();

  const stageOrder = ["review", "mcp", "arch"];
  for (const stage of stageOrder) {
    const match = content.match(new RegExp(`^${stage}:\\s*(.+)$`, "m"));
    if (!match) continue;
    const status = match[1].trim().toLowerCase();
    if (status !== "done") return `${stage}:${status}`;
  }
  return "done";
}

function collectDesignTopics(baseDir) {
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
      path.join(baseDir, topic, "design.output.md"),
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
      title: outputFile ? readTitle(outputFile) : "design topic",
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
  vibe design new <topic>
  vibe design new --name <topic> [--root <project-root>] [--global]
  vibe design result .
  vibe design result <project-root>
  vibe design global
`);
}

async function runDesignNew(args) {
  try {
    const target = resolveDesignNewTarget(args);
    const slug = toSlug(target.topic || "");

    if (!slug) {
      throw new Error("Missing design topic name");
    }

    const baseDir = target.global
      ? path.join(os.homedir(), ".config", "vibe", "design")
      : path.join(path.resolve(process.cwd(), target.root), ".vibe", "design");

    const topicDir = createDesignTopic(baseDir, slug);

    console.log(chalk.green(`\nCreated design topic: ${slug}`));
    console.log(chalk.dim(`  ${shortenHome(topicDir)}`));
    console.log(chalk.dim(`  Next: /design.arch\n`));
  } catch (error) {
    console.error(chalk.red(`\n${error.message}\n`));
    printUsage();
    process.exitCode = 1;
  }
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
    console.log(chalk.dim("\n  No design topics found.\n"));
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

async function runDesignResult(args) {
  const target = args[0] || ".";
  const projectRoot = path.resolve(process.cwd(), target);
  const baseDir = path.join(projectRoot, ".vibe", "design");
  const topics = collectDesignTopics(baseDir);

  printTopicList("Design Results (Local)", baseDir, topics);
}

async function runDesignGlobal() {
  const baseDir = path.join(os.homedir(), ".config", "vibe", "design");
  const topics = collectDesignTopics(baseDir);

  printTopicList("Design Results (Global)", baseDir, topics);
}

/**
 * Routes `vibe design ...` subcommands.
 */
export async function runDesign(args) {
  const [subcmd, ...rest] = args;

  if (!subcmd || subcmd === "--help" || subcmd === "-h") {
    printUsage();
    return;
  }

  if (subcmd === "result") {
    await runDesignResult(rest);
    return;
  }

  if (subcmd === "new") {
    await runDesignNew(rest);
    return;
  }

  if (subcmd === "global") {
    await runDesignGlobal();
    return;
  }

  console.error(chalk.red(`\nUnknown design command: ${subcmd}\n`));
  printUsage();
  process.exitCode = 1;
}
