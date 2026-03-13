import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
import { fetchMany } from "./fetch.js";
import {
  getPackIds,
  getPackManifest,
  getPromptFiles,
  PACKS,
  resolvePromptLanguage,
  RUNTIMES,
} from "./registry.js";
import { parsePackArgs } from "./pack-args.js";
import { parseRuntimeArgs } from "./runtime-args.js";
import {
  BACK_ACTION,
  confirm,
  multiSelect,
  printHeader,
  printStep,
  printSummary,
  singleSelect,
  VIBE_ART,
} from "./tui.js";

function expandHome(p) {
  return p?.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;
}

function detectRuntimes() {
  const cwd = process.cwd();
  return Object.keys(RUNTIMES).filter((r) => {
    const rt = RUNTIMES[r];
    if (rt.localDir && fs.existsSync(path.join(cwd, rt.localDir.split("/")[0])))
      return true;
    if (rt.globalDir && fs.existsSync(expandHome(rt.globalDir))) return true;
    return false;
  });
}

const RECOMMENDED_RUNTIMES = [];

function parseLocationArg(args) {
  const hasLocal = args.includes("--local");
  const hasGlobal = args.includes("--global");
  if (hasLocal && hasGlobal) {
    console.error(chalk.red("\n  Use either --local or --global, not both.\n"));
    process.exit(1);
  }
  if (hasLocal) return "local";
  if (hasGlobal) return "global";
  return null;
}

function parseInstallModeArg(args) {
  if (args.includes("--symlink")) return "symlink";
  if (args.includes("--local-files") || args.includes("--copy")) return "local";
  return null;
}

function parseConflictPolicyArg(args) {
  if (args.includes("--force")) return "replace";
  if (args.includes("--keep")) return "keep";
  return null;
}

function parseSetupModeArg(args) {
  const hasFastsetup = args.includes("--fastsetup");
  const hasExtra = args.includes("--extra");

  if (hasFastsetup && hasExtra) {
    console.error(
      chalk.red("\n  Use either --fastsetup or --extra, not both.\n"),
    );
    process.exit(1);
  }

  if (hasFastsetup) return "fastsetup";
  if (hasExtra) return "extra";
  return null;
}

function parsePromptInstallArg(args) {
  const hasInstall = args.includes("--prompts");
  const hasSkip = args.includes("--no-prompts");

  if (hasInstall && hasSkip) {
    console.error(
      chalk.red("\n  Use either --prompts or --no-prompts, not both.\n"),
    );
    process.exit(1);
  }

  if (hasInstall) return "install";
  if (hasSkip) return "skip";
  return null;
}

const INSTALL_MODE_LABELS = {
  symlink: "Symlink",
  local: "Local files",
};

const SETUP_MODE_LABELS = {
  fastsetup: "Fastsetup",
  extra: "Extra",
};

const LANGUAGE_LABELS = {
  en: "English",
};

function hasLanguageArg(args) {
  return args.includes("--lang") || args.some((a) => a.startsWith("--lang="));
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function getSavedSetupMode(cwd) {
  const local = readJsonFile(path.join(cwd, ".vibe", "config.json"));
  if (local.setupMode === "fastsetup" || local.setupMode === "extra") {
    return local.setupMode;
  }

  const globalVibe = readJsonFile(
    path.join(os.homedir(), ".config", "vibe", "config.json"),
  );
  if (
    globalVibe.setupMode === "fastsetup" ||
    globalVibe.setupMode === "extra"
  ) {
    return globalVibe.setupMode;
  }

  return "extra";
}

function saveLanguageConfig(cwd, location, language, { dryRun, setupMode }) {
  if (dryRun) return;

  const localDir = path.join(cwd, ".vibe");
  const localFile = path.join(localDir, "config.json");
  fs.mkdirSync(localDir, { recursive: true });
  const localConfig = { ...readJsonFile(localFile), language };
  if (setupMode) localConfig.setupMode = setupMode;
  fs.writeFileSync(
    localFile,
    `${JSON.stringify(localConfig, null, 2)}\n`,
    "utf8",
  );

  if (location === "global") {
    const globalDir = path.join(os.homedir(), ".config", "vibe");
    const globalFile = path.join(globalDir, "config.json");
    fs.mkdirSync(globalDir, { recursive: true });
    const globalConfig = { ...readJsonFile(globalFile), language };
    if (setupMode) globalConfig.setupMode = setupMode;
    fs.writeFileSync(
      globalFile,
      `${JSON.stringify(globalConfig, null, 2)}\n`,
      "utf8",
    );
  }
}

function getCacheRoot(cwd, location) {
  if (location === "global") {
    return path.join(os.homedir(), ".config", "vibe", ".vibe", "commands");
  }
  return path.join(cwd, ".vibe", "commands");
}

function getPromptRoot(cwd, location) {
  if (location === "global") {
    return path.join(os.homedir(), ".config", "vibe", ".vibe", "prompts");
  }
  return path.join(cwd, ".vibe", "prompts");
}

function pathExists(filePath) {
  try {
    fs.lstatSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function linkStatus(result) {
  if (result === "failed") return "fail";
  if (result === "skipped") return "skip";
  return "done";
}

function ensureSymlink(source, target, { force, dryRun }) {
  if (!pathExists(source)) {
    return { status: "failed", error: "source missing" };
  }

  if (pathExists(target)) {
    try {
      const stat = fs.lstatSync(target);
      if (stat.isSymbolicLink()) {
        const current = fs.readlinkSync(target);
        const currentResolved = path.resolve(path.dirname(target), current);
        if (currentResolved === path.resolve(source)) {
          return { status: "skipped" };
        }
      }
    } catch {
      // ignore readlink errors and fallback to replace/skip logic
    }

    if (!force) {
      return { status: "skipped" };
    }

    if (!dryRun) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }

  if (dryRun) {
    return { status: "would-create" };
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  const rel = path.relative(path.dirname(target), source);
  fs.symlinkSync(rel, target);
  return { status: "created" };
}

// ─── Install commands ─────────────────────────────────────────────────────────

async function installCommands(
  runtimes,
  packs,
  location,
  language,
  { force, dryRun, installMode },
) {
  if (runtimes.length === 0 || packs.length === 0) {
    return {
      commands: { created: 0, skipped: 0, failed: 0 },
      references: { created: 0, skipped: 0, failed: 0 },
      links: { created: 0, skipped: 0, failed: 0 },
    };
  }

  printHeader("Installing Commands");
  const results = {
    commands: { created: 0, skipped: 0, failed: 0 },
    references: { created: 0, skipped: 0, failed: 0 },
    links: { created: 0, skipped: 0, failed: 0 },
  };
  const manifests = getPackManifest(packs);

  const updateCounts = (bucket, status) => {
    if (status === "failed") bucket.failed++;
    else if (status === "skipped") bucket.skipped++;
    else bucket.created++;
  };

  const cwd = process.cwd();
  const cacheRoot = getCacheRoot(cwd, location);

  const syncPackCache = async (manifest) => {
    const packRoot = path.join(cacheRoot, manifest.id, language);
    const commandItems = manifest.commands.map((cmd) => ({
      remote: `commands/${manifest.id}/${language}/${cmd}.md`,
      local: path.join(packRoot, `${cmd}.md`),
    }));
    const commandResults = await fetchMany(commandItems, { force, dryRun });
    commandResults.forEach((r, i) => {
      updateCounts(results.commands, r.status);
      printStep(manifest.commands[i], linkStatus(r.status));
    });

    let referenceResults = [];
    if (manifest.referenceFiles.length > 0) {
      const referenceItems = manifest.referenceFiles.map((file) => ({
        remote: `commands/${manifest.id}/${language}/${file}`,
        local: path.join(packRoot, file),
      }));
      referenceResults = await fetchMany(referenceItems, {
        force,
        dryRun,
      });
      referenceResults.forEach((r) => updateCounts(results.references, r.status));

      const changed = referenceResults.filter(
        (r) => r.status !== "failed" && r.status !== "skipped",
      ).length;
      const unchanged = referenceResults.filter(
        (r) => r.status === "skipped",
      ).length;
      const failed = referenceResults.filter(
        (r) => r.status === "failed",
      ).length;
      const detail = [
        changed > 0 ? `${changed} synced` : null,
        unchanged > 0 ? `${unchanged} unchanged` : null,
        failed > 0 ? `${failed} failed` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      const refStatus =
        failed > 0 ? "fail" : changed > 0 ? "done" : "skip";
      printStep(`reference/${manifest.id}/*`, refStatus, detail);
    }

    return {
      packRoot,
      commandResults,
      referenceResults,
    };
  };

  let cacheMap = new Map();

  if (installMode === "symlink") {
    printHeader("Syncing Command Cache");
    console.log(chalk.dim(`  Cache: ${cacheRoot.replace(os.homedir(), "~")}\n`));

    for (const manifest of manifests) {
      console.log(chalk.dim(`  pack: ${manifest.label}`));
      const cached = await syncPackCache(manifest);
      cacheMap.set(manifest.id, cached.packRoot);
    }
  }

  for (const runtime of runtimes) {
    const rt = RUNTIMES[runtime];
    const dir = expandHome(location === "global" ? rt.globalDir : rt.localDir);
    if (!dir) continue;

    console.log(
      chalk.dim(`\n  📁 [${rt.label}]  ${dir.replace(os.homedir(), "~")}/`),
    );

    for (const manifest of manifests) {
      console.log(chalk.dim(`    pack: ${manifest.label}`));

      if (installMode === "symlink") {
        const packRoot = cacheMap.get(manifest.id);

        manifest.commands.forEach((cmd) => {
          const source = path.join(packRoot, `${cmd}.md`);
          const target = path.join(dir, `${cmd}.md`);
          const link = ensureSymlink(source, target, { force, dryRun });
          updateCounts(results.links, link.status);
          printStep(cmd, linkStatus(link.status), link.error || "");
        });

        let createdRefLinks = 0;
        let skippedRefLinks = 0;
        let failedRefLinks = 0;
        manifest.referenceFiles.forEach((file) => {
          const source = path.join(packRoot, file);
          const target = path.join(dir, file);
          const link = ensureSymlink(source, target, { force, dryRun });
          updateCounts(results.links, link.status);
          if (link.status === "failed") failedRefLinks += 1;
          else if (link.status === "skipped") skippedRefLinks += 1;
          else createdRefLinks += 1;
        });
        const refLinks = manifest.referenceFiles.length;
        const detail = [
          createdRefLinks > 0 ? `${createdRefLinks} linked` : null,
          skippedRefLinks > 0 ? `${skippedRefLinks} unchanged` : null,
          failedRefLinks > 0 ? `${failedRefLinks} failed` : null,
        ]
          .filter(Boolean)
          .join(" · ");
        printStep(
          `reference/${manifest.id}/*`,
          failedRefLinks > 0
            ? "fail"
            : createdRefLinks > 0
              ? "done"
              : "skip",
          refLinks > 0 ? detail : "none",
        );
      } else {
        const commandItems = manifest.commands.map((cmd) => ({
          remote: `commands/${manifest.id}/${language}/${cmd}.md`,
          local: path.join(dir, `${cmd}.md`),
        }));
        const commandResults = await fetchMany(commandItems, { force, dryRun });
        commandResults.forEach((r, i) => {
          const s =
            r.status === "failed"
              ? "fail"
              : r.status === "skipped"
                ? "skip"
                : "done";
          printStep(manifest.commands[i], s);
          updateCounts(results.commands, r.status);
        });

        if (manifest.referenceFiles.length > 0) {
          const referenceItems = manifest.referenceFiles.map((file) => ({
            remote: `commands/${manifest.id}/${language}/${file}`,
            local: path.join(dir, file),
          }));
          const referenceResults = await fetchMany(referenceItems, {
            force,
            dryRun,
          });
          referenceResults.forEach((r) =>
            updateCounts(results.references, r.status),
          );

          const changed = referenceResults.filter(
            (r) => r.status !== "failed" && r.status !== "skipped",
          ).length;
          const unchanged = referenceResults.filter(
            (r) => r.status === "skipped",
          ).length;
          const failed = referenceResults.filter(
            (r) => r.status === "failed",
          ).length;
          const detail = [
            changed > 0 ? `${changed} synced` : null,
            unchanged > 0 ? `${unchanged} unchanged` : null,
            failed > 0 ? `${failed} failed` : null,
          ]
            .filter(Boolean)
            .join(" · ");

          const refStatus =
            failed > 0 ? "fail" : changed > 0 ? "done" : "skip";
          printStep(`reference/${manifest.id}/*`, refStatus, detail);
        }
      }
    }
  }

  return results;
}

async function installPrompts(cwd, location, language, { force, dryRun }) {
  const promptRoot = getPromptRoot(cwd, location);
  const promptLang = resolvePromptLanguage(language);
  const manifest = getPromptFiles(promptLang.language);

  printHeader("Installing Prompt Library");
  console.log(chalk.dim(`  Target: ${promptRoot.replace(os.homedir(), "~")}`));

  if (promptLang.fallback) {
    console.log(
      chalk.yellow(
        `  Prompt language '${language}' is unavailable. Falling back to '${manifest.language}'.`,
      ),
    );
  }

  console.log();

  const items = manifest.files.map((file) => ({
    remote: `prompts/${manifest.language}/${file}`,
    local: path.join(promptRoot, file),
  }));

  const results = await fetchMany(items, { force, dryRun });
  const summary = {
    installed: true,
    root: promptRoot,
    language: manifest.language,
    created: 0,
    skipped: 0,
    failed: 0,
  };

  results.forEach((res, index) => {
    if (res.status === "failed") summary.failed += 1;
    else if (res.status === "skipped") summary.skipped += 1;
    else summary.created += 1;

    const status =
      res.status === "failed"
        ? "fail"
        : res.status === "skipped"
          ? "skip"
          : "done";
    const promptName = `@${manifest.files[index]}`;
    printStep(promptName, status, res.error || "");
  });

  return summary;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function runSetup(args) {
  const cwd = process.cwd();
  let force = args.includes("--force");
  const dryRun = args.includes("--dry-run");
  const forcedInstallMode = parseInstallModeArg(args);
  const forcedConflictPolicy = parseConflictPolicyArg(args);
  const forcedSetupMode = parseSetupModeArg(args);
  const forcedPromptMode = parsePromptInstallArg(args);
  const forcedRuntimes = parseRuntimeArgs(args);
  const forcedPacks = parsePackArgs(args);
  const forcedLocation = parseLocationArg(args);
  const requestedLang = hasLanguageArg(args);
  const requestedPacks =
    args.includes("--packs") || args.some((a) => a.startsWith("--packs="));
  const hasSymlinkFlag = args.includes("--symlink");
  const hasLocalFilesFlag =
    args.includes("--local-files") || args.includes("--copy");

  if (requestedLang) {
    console.error(
      chalk.red(
        "\n  Language selection was removed. English is now the default.\n",
      ),
    );
    process.exit(1);
  }

  if (requestedPacks && forcedPacks.length === 0) {
    console.error(
      chalk.red(
        `\n  Invalid pack list. Use --packs ${getPackIds().join(",")} or --all-packs.\n`,
      ),
    );
    process.exit(1);
  }

  if (hasSymlinkFlag && hasLocalFilesFlag) {
    console.error(
      chalk.red("\n  Use either --symlink or --local-files, not both.\n"),
    );
    process.exit(1);
  }

  if (args.includes("--force") && args.includes("--keep")) {
    console.error(chalk.red("\n  Use either --force or --keep, not both.\n"));
    process.exit(1);
  }

  process.stdout.write("\x1b[2J\x1b[H");
  console.log(VIBE_ART);
  console.log(chalk.dim(`  Project: ${chalk.white(cwd)}\n`));
  if (!(await confirm("Ready to start?"))) {
    console.log("\n  Aborted.\n");
    process.exit(0);
  }

  const savedSetupMode = getSavedSetupMode(cwd);
  const detected = detectRuntimes();
  const initialRuntimeSelection = [
    ...new Set([
      ...RECOMMENDED_RUNTIMES.filter((r) => RUNTIMES[r]),
      ...detected,
    ]),
  ];

  const packOptions = getPackIds().map((pack) => ({
    value: pack,
    label: PACKS[pack].label,
    desc: PACKS[pack].note,
  }));

  const runtimeOptions = Object.entries(RUNTIMES).map(([value, rt]) => ({
    value,
    label: RECOMMENDED_RUNTIMES.includes(value)
      ? `${rt.label}  (recommended)`
      : rt.label,
    desc: rt.note,
  }));

  let packs = forcedPacks.length > 0 ? [...forcedPacks] : [];
  const language = "en";
  let runtimes = forcedRuntimes.length > 0 ? [...forcedRuntimes] : [];
  let location = forcedLocation || null;
  let installMode = forcedInstallMode || null;
  let conflictPolicy = forcedConflictPolicy || null;
  const setupMode = forcedSetupMode || savedSetupMode;

  const steps = [
    async () => {
      if (forcedPacks.length > 0) return "next";

      const selectedPacks = await multiSelect({
        title: "Step 1/5 — Which command packs should be installed?",
        options: packOptions,
        initial: packs,
      });

      if (selectedPacks.length === 0) {
        console.log(chalk.yellow("\n  Select at least one pack.\n"));
        return "stay";
      }

      packs = selectedPacks;
      return "next";
    },

    async () => {
      if (forcedRuntimes.length > 0) return "next";

      const selectedRuntimes = await multiSelect({
        title: "Step 2/5 — Which AI tools are you using?",
        options: runtimeOptions,
        initial: runtimes.length > 0 ? runtimes : initialRuntimeSelection,
        allowBack: true,
      });

      if (selectedRuntimes === BACK_ACTION) return "back";
      if (selectedRuntimes.length === 0) {
        console.log(chalk.yellow("\n  Select at least one runtime.\n"));
        return "stay";
      }

      runtimes = selectedRuntimes;
      return "next";
    },

    async () => {
      if (forcedLocation) return "next";

      const selectedLocation = await singleSelect({
        title: "Step 3/5 — Install where?",
        subtitle: "Local = current project only   |   Global = all projects",
        options: [
          {
            value: "local",
            label: "Local  (recommended)",
            desc: "Creates command dirs only inside this project",
          },
          {
            value: "global",
            label: "Global",
            desc: "Install once and use in all projects",
          },
        ],
        initial: location === "global" ? 1 : 0,
        allowBack: true,
      });

      if (selectedLocation === BACK_ACTION) return "back";
      location = selectedLocation;
      return "next";
    },

    async () => {
      if (forcedInstallMode) return "next";

      const selectedInstallMode = await singleSelect({
        title: "Step 4/5 — Install mode?",
        subtitle:
          "Symlink stores files once in .vibe/commands and links runtime folders",
        options: [
          {
            value: "symlink",
            label: "Symlink  (recommended)",
            desc: "Cache once, runtime folders link to cached files",
          },
          {
            value: "local",
            label: "Local files",
            desc: "Write full command files directly into each runtime folder",
          },
        ],
        initial: installMode === "local" ? 1 : 0,
        allowBack: true,
      });

      if (selectedInstallMode === BACK_ACTION) return "back";
      installMode = selectedInstallMode;
      return "next";
    },

    async () => {
      if (forcedConflictPolicy) return "next";

      const selectedConflictPolicy = await singleSelect({
        title: "Step 5/5 — Existing file policy?",
        subtitle: "Choose what to do when command files already exist",
        options: [
          {
            value: "keep",
            label: "Keep existing  (recommended)",
            desc: "Do not overwrite existing files or links",
          },
          {
            value: "replace",
            label: "Replace existing",
            desc: "Overwrite existing files with the latest version",
          },
        ],
        initial: conflictPolicy === "replace" ? 1 : 0,
        allowBack: true,
      });

      if (selectedConflictPolicy === BACK_ACTION) return "back";
      conflictPolicy = selectedConflictPolicy;
      return "next";
    },
  ];

  let stepIndex = 0;
  while (stepIndex < steps.length) {
    const action = await steps[stepIndex]();

    if (action === "back") {
      stepIndex = Math.max(0, stepIndex - 1);
      continue;
    }

    if (action === "stay") {
      continue;
    }

    stepIndex += 1;
  }

  force = conflictPolicy === "replace";

  // ── Confirm + Execute ─────────────────────────────────────────────────────
  process.stdout.write("\x1b[2J\x1b[H");
  console.log(VIBE_ART);
  printHeader("Installing");

  const cmdResults = await installCommands(
    runtimes,
    packs,
    location,
    language,
    {
      force,
      dryRun,
      installMode,
    },
  );

  let shouldInstallPrompts = forcedPromptMode === "install";
  if (forcedPromptMode === null) {
    shouldInstallPrompts = await confirm(
      "Install quick prompt library to .vibe/prompts?",
      true,
    );
  }

  if (forcedPromptMode === "install") {
    console.log(chalk.dim("  Prompt flag: install\n"));
  } else if (forcedPromptMode === "skip") {
    console.log(chalk.dim("  Prompt flag: skip\n"));
  }

  const promptResults = shouldInstallPrompts
    ? await installPrompts(cwd, location, language, {
        force,
        dryRun,
      })
    : {
        installed: false,
        root: getPromptRoot(cwd, location),
        language,
        created: 0,
        skipped: 0,
        failed: 0,
      };

  saveLanguageConfig(cwd, location, language, { dryRun, setupMode });

  // .gitignore
  if (!dryRun) {
    const gi = path.join(cwd, ".gitignore");
    if (fs.existsSync(gi)) {
      const content = fs.readFileSync(gi, "utf8");
      const lines = [];
      if (!content.includes(".vibe/index.db")) lines.push(".vibe/index.db");
      if (!content.includes(".vibe/commands")) lines.push(".vibe/commands");
      if (promptResults.installed && !content.includes(".vibe/prompts")) {
        lines.push(".vibe/prompts");
      }

      if (lines.length > 0) {
        fs.appendFileSync(gi, `\n# vibe\n${lines.join("\n")}\n`);
      }
    }
  }

  const packLabels = packs.map((pack) => PACKS[pack]?.label || pack).join(", ");
  const startCommand = packs.includes("research")
    ? "/research.setup"
    : packs.includes("design")
      ? "/design.setup"
      : "/resource.setup";

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalFail =
    cmdResults.commands.failed +
    cmdResults.references.failed +
    cmdResults.links.failed +
    promptResults.failed;
  const cacheRoot = getCacheRoot(cwd, location).replace(os.homedir(), "~");
  const promptRoot = promptResults.root.replace(os.homedir(), "~");
  const summaryLines = [
    totalFail ? "⚠  Setup done (with errors)" : "✅  Vibe setup complete!",
    "",
    `   Packs     ${packLabels}`,
    `   Mode      ${INSTALL_MODE_LABELS[installMode]}`,
    `   Existing  ${conflictPolicy}`,
    `   Resource  ${SETUP_MODE_LABELS[setupMode]}`,
    `   Commands  ${cmdResults.commands.created} synced`,
    `   Refs      ${cmdResults.references.created} synced`,
    installMode === "symlink"
      ? `   Links     ${cmdResults.links.created} created`
      : "   Links     n/a",
    promptResults.installed
      ? `   Prompts   ${promptResults.created} synced`
      : "   Prompts   skipped",
    `   Language  ${LANGUAGE_LABELS[language]}`,
    `   Location  ${location}`,
  ];

  if (installMode === "symlink") {
    summaryLines.push(`   Cache     ${cacheRoot}`);
  }

  if (promptResults.installed) {
    summaryLines.push(`   PromptDir ${promptRoot}`);
  }

  summaryLines.push(
    "",
    "   Installed for runtimes:",
    ...runtimes.map((r) => `   ${RUNTIMES[r].label}`),
    "",
    `   Then run ${startCommand} to start`,
  );

  printSummary(summaryLines);
  if (totalFail)
    console.log(
      chalk.yellow(`\n  ⚠  ${totalFail} failed - run vibe update to retry\n`),
    );
}
