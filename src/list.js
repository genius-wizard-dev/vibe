import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
import { getKnownManagedFiles, RUNTIMES } from "./registry.js";
import { VIBE_ART, printHeader } from "./tui.js";

function expandHome(p) {
  return p?.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;
}

export async function runList() {
  const cwd = process.cwd();
  const managedFiles = getKnownManagedFiles();

  process.stdout.write("\x1b[2J\x1b[H");
  console.log(VIBE_ART);
  printHeader("Installed Commands");

  for (const rt of Object.values(RUNTIMES)) {
    const locations = [
      {
        scope: "local",
        dir: rt.localDir ? path.join(cwd, rt.localDir) : null,
      },
      {
        scope: "global",
        dir: expandHome(rt.globalDir),
      },
    ];

    for (const location of locations) {
      if (!location.dir || !fs.existsSync(location.dir)) continue;

      const rootFiles = fs
        .readdirSync(location.dir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => ({ rel: f, display: f.replace(".md", "") }));
      const referenceDir = path.join(location.dir, "reference");
      const referenceFiles = fs.existsSync(referenceDir)
        ? fs
            .readdirSync(referenceDir)
            .filter((f) => f.endsWith(".md"))
            .map((f) => ({ rel: `reference/${f}`, display: f }))
        : [];
      const files = [...rootFiles, ...referenceFiles].filter((file) =>
        managedFiles.has(file.rel),
      );
      if (files.length === 0) continue;

      const shortDir = location.dir.replace(os.homedir(), "~");
      console.log(
        chalk.cyan(`  ${rt.label} (${location.scope})`) + chalk.dim(`  ${shortDir}/`),
      );
      files
        .filter((file) => !file.rel.startsWith("reference/"))
        .forEach((file) => {
          console.log(`    ${chalk.white("/" + file.display)}`);
        });

      const refCount = files.filter((file) =>
        file.rel.startsWith("reference/"),
      ).length;
      if (refCount > 0) {
        console.log(chalk.dim(`    reference/ (${refCount} files)`));
      }
      console.log();
    }
  }

  // State files
  printHeader("State");

  const normalizeIcon = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized.includes("done") || status?.includes("✅")) {
      return chalk.green("✅");
    }
    if (
      normalized.includes("in-progress") ||
      normalized.includes("in progress") ||
      status?.includes("🔄")
    ) {
      return chalk.cyan("🔄");
    }
    if (normalized.includes("failed") || status?.includes("❌")) {
      return chalk.red("❌");
    }
    return chalk.dim("⏸");
  };

  const parseLegacyStepState = (filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    const steps = content.match(/## \[(.*?)\] status: (.*)/g) || [];
    return steps
      .map((line) => line.match(/## \[(.*?)\] status: (.*)/))
      .filter(Boolean)
      .map((parts) => ({ step: parts[1], status: parts[2] }));
  };

  const printTopicSection = (label, rootDir, resumeCmd) => {
    const overviewFile = path.join(rootDir, "overview.md");
    const activeFile = path.join(rootDir, "active.md");
    if (!fs.existsSync(overviewFile) && !fs.existsSync(activeFile)) return false;

    console.log(
      chalk.cyan(`  ${label}`) + chalk.dim(`  ${rootDir.replace(os.homedir(), "~")}`),
    );

    const active = fs.existsSync(activeFile)
      ? fs.readFileSync(activeFile, "utf8").trim()
      : "";
    if (active) {
      console.log(`    ${chalk.dim("active:")} ${chalk.white(active)}`);
      const topicState = path.join(rootDir, active, "state.md");
      if (fs.existsSync(topicState)) {
        const content = fs.readFileSync(topicState, "utf8");
        ["scan", "interview", "analyze", "discuss", "export", "arch", "mcp", "review"].forEach(
          (key) => {
            const match = content.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
            if (!match) return;
            const status = match[1].trim();
            console.log(
              `    ${normalizeIcon(status)}  ${chalk.dim(key)}  ${chalk.dim(status)}`,
            );
          },
        );
      }
    }

    if (fs.existsSync(overviewFile)) {
      console.log(chalk.dim(`    overview: ${overviewFile.replace(os.homedir(), "~")}`));
    }
    console.log(chalk.dim(`    Continue with ${resumeCmd}`));
    console.log();
    return true;
  };

  let printedAny = false;
  printedAny = printTopicSection(
    "Research",
    path.join(cwd, ".vibe", "research"),
    "/research.resume",
  ) || printedAny;
  printedAny = printTopicSection(
    "Design",
    path.join(cwd, ".vibe", "design"),
    "/design.resume",
  ) || printedAny;

  const resourceState = path.join(cwd, ".vibe", "resource", "state.md");
  if (fs.existsSync(resourceState)) {
    printedAny = true;
    console.log(
      chalk.cyan("  Resource") +
        chalk.dim(`  ${resourceState.replace(os.homedir(), "~")}`),
    );
    parseLegacyStepState(resourceState).forEach(({ step, status }) => {
      console.log(
        `    ${normalizeIcon(status)}  ${chalk.dim(step.toLowerCase())}  ${chalk.dim(String(status).replace(/[✅🔄⏸❌]/g, "").trim())}`,
      );
    });
    const changelog = path.join(cwd, "CHANGE_LOGS.md");
    if (fs.existsSync(changelog)) {
      console.log(chalk.dim(`    changelog: ${changelog.replace(os.homedir(), "~")}`));
    }
    console.log(chalk.dim("    Continue with /resource.resume"));
    console.log();
  }

  const promptDir = path.join(cwd, ".vibe", "prompts");
  if (fs.existsSync(promptDir)) {
    const promptFiles = fs
      .readdirSync(promptDir)
      .filter((file) => file.endsWith(".md"));

    printedAny = true;
    console.log(
      chalk.cyan("  Prompt Library") +
        chalk.dim(`  ${promptDir.replace(os.homedir(), "~")}`),
    );
    if (promptFiles.length === 0) {
      console.log(chalk.dim("    no prompt files"));
    } else {
      promptFiles.forEach((file) => {
        console.log(`    ${chalk.white("@" + file)}`);
      });
    }
    console.log();
  }

  if (!printedAny) {
    console.log(
      chalk.dim("  No state yet - run /research.setup, /design.setup, or /resource.setup"),
    );
    console.log();
  }
}

export async function runUpdate(args) {
  console.log(chalk.cyan("\n  🔄 Updating vibe commands from GitHub...\n"));
  const { runSetup } = await import("./setup.js");
  await runSetup([...args, "--force"]);
}
