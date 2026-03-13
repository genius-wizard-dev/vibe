import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
import { getKnownManagedFiles, RUNTIMES } from "../core/registry.js";
import { parseRuntimeArgs } from "../core/runtime-flags.js";
import { confirm, printHeader, printStep, VIBE_ART } from "../core/tui.js";

function expandHome(p) {
  return p?.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;
}

function parseScopes(args) {
  const hasLocal = args.includes("--local");
  const hasGlobal = args.includes("--global");

  if (hasLocal && hasGlobal) return ["local", "global"];
  if (hasLocal) return ["local"];
  if (hasGlobal) return ["global"];
  return ["local", "global"];
}

function collectTargets(cwd, runtimes, scopes, managedFiles) {
  const targets = [];

  for (const runtime of runtimes) {
    const rt = RUNTIMES[runtime];
    if (!rt) continue;

    for (const scope of scopes) {
      const dir =
        scope === "global"
          ? expandHome(rt.globalDir)
          : rt.localDir
            ? path.join(cwd, rt.localDir)
            : null;
      if (!dir || !fs.existsSync(dir)) continue;

      const rootFiles = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".md"))
        .filter((f) => managedFiles.has(f));
      const referenceDir = path.join(dir, "reference");
      const referenceFiles = fs.existsSync(referenceDir)
        ? fs
            .readdirSync(referenceDir)
            .filter((f) => f.endsWith(".md"))
            .filter((f) => managedFiles.has(`reference/${f}`))
            .map((f) => `reference/${f}`)
        : [];
      const files = [...rootFiles, ...referenceFiles];
      if (files.length === 0) continue;

      targets.push({
        id: `${runtime}:${scope}`,
        runtime,
        scope,
        dir,
        referenceDir,
        files,
      });
    }
  }

  return targets;
}

/**
 * Removes workspace-managed assets.
 * Always handles `.vibe` first, then optionally removes managed runtime files.
 */
export async function runRemove(args) {
  const cwd = process.cwd();
  const managedFiles = getKnownManagedFiles();
  const forcedRuntimes = parseRuntimeArgs(args);
  const runtimes =
    forcedRuntimes.length > 0 ? forcedRuntimes : Object.keys(RUNTIMES);
  const scopes = parseScopes(args);
  const dryRun = args.includes("--dry-run");
  const yes = args.includes("--yes") || args.includes("-y");
  const workspaceDir = path.join(cwd, ".vibe");

  process.stdout.write("\x1b[2J\x1b[H");
  console.log(VIBE_ART);
  printHeader("Remove Vibe Workspace");

  let workspaceStatus = "skip";
  let workspaceDetail = "not found";

  if (fs.existsSync(workspaceDir)) {
    if (dryRun) {
      workspaceStatus = "skip";
      workspaceDetail = "dry-run";
    } else {
      try {
        fs.rmSync(workspaceDir, { recursive: true, force: true });
        workspaceStatus = "done";
        workspaceDetail = "removed first";
      } catch (err) {
        workspaceStatus = "fail";
        workspaceDetail = err.message;
      }
    }
  }

  printStep(".vibe", workspaceStatus, workspaceDetail);

  const targets = collectTargets(cwd, runtimes, scopes, managedFiles);
  const totalFiles = targets.reduce((sum, target) => sum + target.files.length, 0);

  printHeader("Managed Runtime Files");

  if (targets.length === 0) {
    console.log(chalk.dim("  No managed command files found for selected filters."));
    printHeader("Result");
    if (workspaceStatus === "fail") {
      console.log(chalk.red("  Workspace removal failed."));
    } else if (dryRun && workspaceDetail === "dry-run") {
      console.log(chalk.cyan("  Would remove .vibe only.\n"));
    } else if (workspaceStatus === "done") {
      console.log(chalk.green("  Removed .vibe.\n"));
    } else {
      console.log(chalk.dim("  Nothing to remove.\n"));
    }
    return;
  }

  console.log(chalk.yellow("  Found managed files:"));
  console.log(chalk.dim(`  Targets: ${targets.length}  •  Files: ${totalFiles}\n`));

  targets.forEach((target) => {
    const scopeLabel = target.scope === "global" ? "global" : "local";
    console.log(
      chalk.dim(
        `  - ${RUNTIMES[target.runtime].label} (${scopeLabel})  ${target.files.length} files  •  ${target.dir.replace(os.homedir(), "~")}`,
      ),
    );
  });

  console.log();

  if (
    !yes &&
    !(await confirm("Delete all managed runtime files listed above?", false))
  ) {
    printHeader("Result");
    if (workspaceStatus === "done") {
      console.log(chalk.green("  Removed .vibe."));
      console.log(chalk.yellow("  Kept managed runtime files.\n"));
      return;
    }
    console.log(chalk.yellow("  Kept managed runtime files.\n"));
    return;
  }

  printHeader(dryRun ? "Dry Run" : "Removing Managed Files");
  let removed = 0;
  let failed = 0;

  for (const target of targets) {
    console.log(chalk.dim(`\n  📁 [${RUNTIMES[target.runtime].label}] ${target.dir}`));
    for (const file of target.files) {
      const fullPath = path.join(target.dir, file);
      if (dryRun) {
        printStep(file.replace(".md", ""), "skip", "dry-run");
        continue;
      }

      try {
        fs.unlinkSync(fullPath);
        printStep(file.replace(".md", ""), "done");
        removed++;
      } catch (err) {
        printStep(file.replace(".md", ""), "fail", err.message);
        failed++;
      }
    }

    if (!dryRun) {
      try {
        if (
          target.referenceDir &&
          fs.existsSync(target.referenceDir) &&
          fs.readdirSync(target.referenceDir).length === 0
        ) {
          fs.rmdirSync(target.referenceDir);
        }
      } catch {
        // ignore cleanup errors
      }

      try {
        if (fs.readdirSync(target.dir).length === 0) fs.rmdirSync(target.dir);
      } catch {
        // ignore cleanup errors
      }
    }
  }

  printHeader("Result");
  if (dryRun) {
    if (workspaceDetail === "dry-run") {
      console.log(chalk.cyan("  Would remove .vibe."));
    }
    console.log(
      chalk.cyan(
        `  Would remove ${totalFiles} managed files from ${targets.length} targets.\n`,
      ),
    );
    return;
  }

  if (workspaceStatus === "done") {
    console.log(chalk.green("  Workspace: .vibe removed"));
  } else if (workspaceStatus === "fail") {
    console.log(chalk.red(`  Workspace: failed (${workspaceDetail})`));
  } else {
    console.log(chalk.dim("  Workspace: .vibe not found"));
  }

  console.log(chalk.green(`  Removed: ${removed}`));
  if (failed > 0) console.log(chalk.red(`  Failed:  ${failed}`));
  console.log();
}
