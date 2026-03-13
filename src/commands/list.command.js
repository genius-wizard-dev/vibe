import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
import { getKnownManagedFiles, RUNTIMES } from "../core/registry.js";
import { VIBE_ART, printHeader } from "../core/tui.js";

function expandHome(p) {
  return p?.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;
}

/**
 * Displays installed command packs and current workspace state.
 */
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

  let printedAny = false;

  const statePath = path.join(cwd, ".vibe", "state.md");
  if (fs.existsSync(statePath)) {
    printedAny = true;
    console.log(
      chalk.cyan("  Setup") +
        chalk.dim(`  ${statePath.replace(os.homedir(), "~")}`),
    );
    parseLegacyStepState(statePath).forEach(({ step, status }) => {
      console.log(
        `    ${normalizeIcon(status)}  ${chalk.dim(step.toLowerCase())}  ${chalk.dim(String(status).replace(/[✅🔄⏸❌]/g, "").trim())}`,
      );
    });
    const changelog = path.join(cwd, "CHANGE_LOGS.md");
    if (fs.existsSync(changelog)) {
      console.log(chalk.dim(`    changelog: ${changelog.replace(os.homedir(), "~")}`));
    }
    console.log(chalk.dim("    Continue with /setup.resume"));
    console.log();
  }

  if (!printedAny) {
    console.log(
      chalk.dim("  No state yet - run /setup.init"),
    );
    console.log();
  }
}

/**
 * Re-runs setup in force mode to refresh managed files from upstream.
 */
export async function runUpdate(args) {
  console.log(chalk.cyan("\n  🔄 Updating vibe commands from GitHub...\n"));
  const { runSetup } = await import("./setup.command.js");
  await runSetup([...args, "--force"]);
}
