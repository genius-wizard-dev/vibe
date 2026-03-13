import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
import { RUNTIMES } from "./registry.js";
import { parseRuntimeArgs } from "./runtime-args.js";
import { confirm, multiSelect, printHeader, printStep, VIBE_ART } from "./tui.js";

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

function collectTargets(cwd, runtimes, scopes) {
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
        .filter((f) => f.startsWith("vibe.") && f.endsWith(".md"));
      const referenceDir = path.join(dir, "reference");
      const referenceFiles = fs.existsSync(referenceDir)
        ? fs
            .readdirSync(referenceDir)
            .filter((f) => f.startsWith("vibe.") && f.endsWith(".md"))
            .map((f) => path.join("reference", f))
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

export async function runRemove(args) {
  const cwd = process.cwd();
  const forcedRuntimes = parseRuntimeArgs(args);
  const runtimes =
    forcedRuntimes.length > 0 ? forcedRuntimes : Object.keys(RUNTIMES);
  const scopes = parseScopes(args);
  const dryRun = args.includes("--dry-run");
  const yes = args.includes("--yes") || args.includes("-y");

  process.stdout.write("\x1b[2J\x1b[H");
  console.log(VIBE_ART);
  printHeader("Remove Vibe Commands");

  const targets = collectTargets(cwd, runtimes, scopes);
  if (targets.length === 0) {
    console.log(chalk.dim("  No vibe command files found for selected filters.\n"));
    return;
  }

  const options = targets.map((t) => {
    const scopeLabel = t.scope === "global" ? "global" : "local";
    return {
      value: t.id,
      label: `${RUNTIMES[t.runtime].label} (${scopeLabel})`,
      desc: `${t.files.length} files  •  ${t.dir.replace(os.homedir(), "~")}`,
    };
  });

  const selectedIds = yes
    ? options.map((o) => o.value)
    : await multiSelect({
        title: "Select targets to remove",
        options,
        initial: options.map((o) => o.value),
      });

  if (selectedIds.length === 0) {
    console.log(chalk.yellow("\n  Nothing selected. Aborted.\n"));
    return;
  }

  const selectedTargets = targets.filter((t) => selectedIds.includes(t.id));
  const totalFiles = selectedTargets.reduce((sum, t) => sum + t.files.length, 0);

  printHeader("Warning");
  console.log(chalk.yellow("  This will permanently delete selected vibe command files."));
  console.log(chalk.dim(`  Targets: ${selectedTargets.length}  •  Files: ${totalFiles}\n`));

  if (!yes && !(await confirm("Continue removing selected files?", false))) {
    console.log(chalk.yellow("\n  Aborted.\n"));
    return;
  }

  printHeader(dryRun ? "Dry Run" : "Removing");
  let removed = 0;
  let failed = 0;

  for (const target of selectedTargets) {
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
    console.log(chalk.cyan(`  Would remove ${totalFiles} files from ${selectedTargets.length} targets.\n`));
    return;
  }

  console.log(chalk.green(`  Removed: ${removed}`));
  if (failed > 0) console.log(chalk.red(`  Failed:  ${failed}`));
  console.log();
}
