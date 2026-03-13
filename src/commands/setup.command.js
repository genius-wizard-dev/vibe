import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fetchMany } from "../core/remote-fetch.js";
import {
  getPackIds,
  getPackManifest,
  PACKS,
  RUNTIMES,
} from "../core/registry.js";
import { parsePackArgs } from "../core/pack-flags.js";
import { parseRuntimeArgs } from "../core/runtime-flags.js";
import {
  BACK_ACTION,
  confirm,
  multiSelect,
  printHeader,
  printStep,
  printSummary,
  singleSelect,
  VIBE_ART,
} from "../core/tui.js";
import { detectInstalledTools } from "../system/tools.js";
import { runSetupStatus } from "./setup-status.command.js";

// Setup command is split into two layers:
// 1) runSetup() decides between Setup Center menu and direct install mode.
// 2) runSetupWizard() performs the pack/runtime installation workflow.

function expandHome(p) {
  return p?.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;
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

function parseWorkflowInstallArg(args) {
  const hasInstall = args.includes("--install-workflows");
  const hasSkip = args.includes("--no-install-workflows");

  if (hasInstall && hasSkip) {
    console.error(
      chalk.red(
        "\n  Use either --install-workflows or --no-install-workflows, not both.\n",
      ),
    );
    process.exit(1);
  }

  if (hasInstall) return "install";
  if (hasSkip) return "skip";
  return null;
}

function parseWorkflowArgs(args) {
  const selected = new Set();

  if (args.includes("--speckit")) selected.add("speckit");
  if (args.includes("--gsd")) selected.add("gsd");
  if (args.includes("--bmad")) selected.add("bmad");

  const flagIndex = args.findIndex((arg) => arg === "--workflows");
  if (flagIndex >= 0) {
    const value = String(args[flagIndex + 1] || "").trim();
    value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .forEach((item) => selected.add(item));
  }

  args
    .filter((arg) => arg.startsWith("--workflows="))
    .forEach((arg) => {
      String(arg.split("=")[1] || "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
        .forEach((item) => selected.add(item));
    });

  const valid = ["speckit", "gsd", "bmad"];
  const invalid = [...selected].filter((item) => !valid.includes(item));
  if (invalid.length > 0) {
    console.error(
      chalk.red(
        `\n  Invalid workflow flag(s): ${invalid.join(", ")}. Use speckit, gsd, bmad.\n`,
      ),
    );
    process.exit(1);
  }

  return [...selected];
}

const INSTALL_MODE_LABELS = {
  local: "Local files",
};

const SETUP_MODE_LABELS = {
  fastsetup: "Fastsetup",
  extra: "Extra",
};

const SETUP_HELP = `
Usage:
  vibe setup
  vibe setup --menu
  vibe setup status .
  vibe setup status <project-root>
  vibe setup [install options]

Setup Center:
  vibe setup            Open interactive setup center (TUI)
  vibe setup --menu     Force open setup center (TUI)

Workspace setup options:
  --setup --init --conversation
  --packs setup,conversation
  --all-packs
  --opencode --claude --gemini --codex --cursor --windsurf --qwen --kirocli --continue
  --all-runtimes
  --speckit --gsd --bmad
  --workflows speckit,gsd,bmad
  --install-workflows --no-install-workflows
  --force --keep
  --local --global
  --fastsetup --extra
  --dry-run --yes
`;

const TOOL_RUNTIME_MAP = {
  opencode: "opencode",
  claude: "claude",
  gemini: "gemini",
  codex: "codex",
  kirocli: "kirocli",
};

const WORKFLOW_OPTIONS = [
  {
    value: "speckit",
    label: "Spec-Kit",
    desc: "specify/plan/tasks/implement workflow",
  },
  {
    value: "gsd",
    label: "GSD",
    desc: "get-shit-done execution flow",
  },
  {
    value: "bmad",
    label: "BMAD",
    desc: "orchestration workflow (optional)",
  },
];

const GSD_RUNTIME_FLAGS = {
  claude: "--claude",
  opencode: "--opencode",
  gemini: "--gemini",
  codex: "--codex",
};

const SPECKIT_AI_PREFERENCE = ["claude", "codex", "gemini"];

function findCommand(command) {
  const entries = String(process.env.PATH || "")
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const candidate = path.join(entry, command);
    if (fs.existsSync(candidate)) return candidate;
  }

  return "";
}

function runShell(command, { dryRun, label }) {
  if (dryRun) {
    printStep(label, "done", `(dry-run) ${command}`);
    return { ok: true };
  }

  try {
    execSync(command, {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    printStep(label, "done");
    return { ok: true };
  } catch (error) {
    const message = String(error?.message || "command failed").split("\n")[0];
    printStep(label, "fail", message);
    return { ok: false, error: message };
  }
}

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

function saveLanguageConfig(
  cwd,
  location,
  language,
  { dryRun, setupMode, runtimes = [], workflows = [] },
) {
  if (dryRun) return;

  const localDir = path.join(cwd, ".vibe");
  const localFile = path.join(localDir, "config.json");
  fs.mkdirSync(localDir, { recursive: true });
  const localConfig = { ...readJsonFile(localFile), language };
  if (setupMode) localConfig.setupMode = setupMode;
  localConfig.selectedRuntimes = [...new Set(runtimes)];
  localConfig.selectedWorkflowCli = [...new Set(workflows)];
  localConfig.installLocation = location;
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
    globalConfig.selectedRuntimes = [...new Set(runtimes)];
    globalConfig.selectedWorkflowCli = [...new Set(workflows)];
    globalConfig.installLocation = location;
    fs.writeFileSync(
      globalFile,
      `${JSON.stringify(globalConfig, null, 2)}\n`,
      "utf8",
    );
  }
}

function ensureSetupStateFile(cwd, { dryRun }) {
  if (dryRun) return;

  const stateFile = path.join(cwd, ".vibe", "state.md");
  if (fs.existsSync(stateFile)) return;

  const now = new Date().toISOString();
  const template = `# .vibe/state.md

# Checkpoint — AI reads this file to resume

# status: ✅ done | 🔄 in-progress | ⏸ pending | ❌ failed

## Meta
- created: ${now}
- last_updated: ${now}
- workspace: ${cwd}

## [SCAN] status: ⏸ pending
stack: ~
phase: ~
source_files: ~
infra: ~

## [INTERVIEW] status: ⏸ pending
- [1/8] problem: ~
- [2/8] phase: ~
- [3/8] data_flow: ~
- [4/8] adrs: ~
- [5/8] domain: ~
- [6/8] iteration: ~
- [7/8] constraints: ~
- [8/8] agents: ~

## [DETECT] status: ⏸ pending
recommendation: ~
selected_workflows: ~
confirmed: false

## [TOOLS] status: ⏸ pending
selected: ~

## [INSTALL] status: ⏸ pending
- opencode VEXP MCP: ⏸
- codex VEXP MCP: ⏸
- speckit opencode: ⏸
- speckit codex: ⏸
- gsd opencode: ⏸
- gsd codex: ⏸

## [DOCS] status: ⏸ pending

## [SKILLS] status: ⏸ pending
skills: []

## [VERIFY] status: ⏸ pending
`;

  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, template, "utf8");
}

// ─── Install commands ─────────────────────────────────────────────────────────

async function installCommands(
  runtimes,
  packs,
  location,
  { force, dryRun },
) {
  if (runtimes.length === 0 || packs.length === 0) {
    return {
      commands: { created: 0, skipped: 0, failed: 0 },
      references: { created: 0, skipped: 0, failed: 0 },
    };
  }

  printHeader("Installing Commands");
  const results = {
    commands: { created: 0, skipped: 0, failed: 0 },
    references: { created: 0, skipped: 0, failed: 0 },
  };
  const manifests = getPackManifest(packs);

  const updateCounts = (bucket, status) => {
    if (status === "failed") bucket.failed++;
    else if (status === "skipped") bucket.skipped++;
    else bucket.created++;
  };

  for (const runtime of runtimes) {
    const rt = RUNTIMES[runtime];
    const dir = expandHome(location === "global" ? rt.globalDir : rt.localDir);
    if (!dir) continue;

    console.log(
      chalk.dim(`\n  📁 [${rt.label}]  ${dir.replace(os.homedir(), "~")}/`),
    );

    for (const manifest of manifests) {
      console.log(chalk.dim(`    pack: ${manifest.label}`));
      const commandItems = manifest.commands.map((cmd) => ({
        remote: `commands/${manifest.id}/${cmd}.md`,
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
          remote: `commands/${manifest.id}/${file}`,
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

  return results;
}

function resolveSpecKitAiTarget(runtimes) {
  for (const candidate of SPECKIT_AI_PREFERENCE) {
    if (runtimes.includes(candidate)) return candidate;
  }
  return "claude";
}

function installSpecKitCli({ runtimes, dryRun }) {
  const result = {
    status: "pending",
    detail: "",
  };

  const uvPath = findCommand("uv");
  if (!uvPath) {
    const uvInstallCommand =
      process.platform === "win32"
        ? 'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"'
        : "curl -LsSf https://astral.sh/uv/install.sh | sh";
    const installUv = runShell(
      uvInstallCommand,
      {
        dryRun,
        label: "install uv",
      },
    );
    if (!installUv.ok) {
      result.status = "failed";
      result.detail = "uv install failed";
      return result;
    }
  }

  const ai = resolveSpecKitAiTarget(runtimes);
  const initResult = runShell(
    `uvx --from git+https://github.com/github/spec-kit.git specify init --here --ai ${ai}`,
    {
      dryRun,
      label: `specify init (${ai})`,
    },
  );

  if (!initResult.ok) {
    result.status = "failed";
    result.detail = "specify init failed";
    return result;
  }

  result.status = "done";
  result.detail = `ai=${ai}`;
  return result;
}

function installGsdBmadCli({ runtimes, location, dryRun }) {
  const uniqueFlags = [...new Set(runtimes.map((id) => GSD_RUNTIME_FLAGS[id]).filter(Boolean))];
  if (uniqueFlags.length === 0) {
    return {
      status: "manual-required",
      detail: "no supported runtime flag for get-shit-done-cc",
    };
  }

  const locationFlag = location === "global" ? "--global" : "--local";
  for (const runtimeFlag of uniqueFlags) {
    const cmd = `npx get-shit-done-cc ${runtimeFlag} ${locationFlag}`;
    const run = runShell(cmd, {
      dryRun,
      label: `get-shit-done-cc ${runtimeFlag}`,
    });
    if (!run.ok) {
      return {
        status: "failed",
        detail: `${runtimeFlag} install failed`,
      };
    }
  }

  return {
    status: "done",
    detail: `${uniqueFlags.length} runtime target(s)`,
  };
}

function installWorkflowCliTooling({ workflows, runtimes, location, dryRun }) {
  const selected = new Set(workflows);
  const statuses = {
    speckit: "not-selected",
    gsd: "not-selected",
    bmad: "not-selected",
  };
  const details = {
    speckit: "",
    gsd: "",
    bmad: "",
  };

  if (selected.has("speckit")) {
    const speckitResult = installSpecKitCli({ runtimes, dryRun });
    statuses.speckit = speckitResult.status;
    details.speckit = speckitResult.detail;
  }

  if (selected.has("gsd") || selected.has("bmad")) {
    const gsdResult = installGsdBmadCli({
      runtimes,
      location,
      dryRun,
    });
    if (selected.has("gsd")) {
      statuses.gsd = gsdResult.status;
      details.gsd = gsdResult.detail;
    }
    if (selected.has("bmad")) {
      statuses.bmad = gsdResult.status;
      details.bmad = gsdResult.detail;
    }
  }

  return {
    statuses,
    details,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Runs the workspace setup wizard (packs, runtimes, workflows, file sync).
 */
export async function runSetupWizard(args) {
  const cwd = process.cwd();
  let force = args.includes("--force");
  const dryRun = args.includes("--dry-run");
  const autoYes = args.includes("--yes") || args.includes("-y");
  const forcedConflictPolicy = parseConflictPolicyArg(args);
  const forcedSetupMode = parseSetupModeArg(args);
  const forcedWorkflowInstallMode = parseWorkflowInstallArg(args);
  const forcedWorkflows = parseWorkflowArgs(args);
  const forcedRuntimes = parseRuntimeArgs(args);
  const forcedPacks = parsePackArgs(args);
  const forcedLocation = parseLocationArg(args);
  const requestedLang = hasLanguageArg(args);
  const requestedPacks =
    args.includes("--packs") || args.some((a) => a.startsWith("--packs="));

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

  if (args.includes("--force") && args.includes("--keep")) {
    console.error(chalk.red("\n  Use either --force or --keep, not both.\n"));
    process.exit(1);
  }

  const detectedTools = detectInstalledTools();
  const installedTools = detectedTools.filter((tool) => tool.installed);

  process.stdout.write("\x1b[2J\x1b[H");
  console.log(VIBE_ART);
  console.log(chalk.dim(`  Project: ${chalk.white(cwd)}\n`));

  printHeader("Detected AI Tools");
  detectedTools.forEach((tool) => {
    if (tool.installed) {
      printStep(
        tool.label,
        "done",
        `command: ${tool.detectedCommand} (${tool.detectedPath})`,
      );
      return;
    }

    printStep(tool.label, "skip", "not found in PATH");
  });
  console.log();

  if (installedTools.length === 0) {
    console.log(chalk.red("  No supported AI CLI tools detected."));
    console.log(chalk.yellow("  Please install at least one tool before running vibe setup:"));
    detectedTools.forEach((tool) => {
      console.log(chalk.dim(`  - ${tool.label}: ${tool.installHint}`));
    });
    console.log();
    process.exit(1);
  }

  if (!autoYes && !(await confirm("Ready to start?"))) {
    console.log("\n  Aborted.\n");
    process.exit(0);
  }
  if (autoYes) {
    console.log(chalk.dim("  Auto-confirm enabled (--yes)\n"));
  }

  const detectedRuntimeIds = installedTools
    .map((tool) => TOOL_RUNTIME_MAP[tool.id])
    .filter((runtime) => Boolean(runtime) && Boolean(RUNTIMES[runtime]));
  const selectableRuntimeIds = [...new Set(detectedRuntimeIds)];
  const setupRuntimeIds = [
    ...new Set(
      Object.values(TOOL_RUNTIME_MAP).filter((runtime) => Boolean(RUNTIMES[runtime])),
    ),
  ];
  const toolStatusByRuntime = new Map(
    detectedTools
      .map((tool) => {
        const runtime = TOOL_RUNTIME_MAP[tool.id];
        if (!runtime || !RUNTIMES[runtime]) return null;
        return [runtime, tool];
      })
      .filter(Boolean),
  );

  const savedSetupMode = getSavedSetupMode(cwd);
  const savedConfig = readJsonFile(path.join(cwd, ".vibe", "config.json"));
  const savedRuntimeSelection = Array.isArray(savedConfig.selectedRuntimes)
    ? savedConfig.selectedRuntimes.filter((item) =>
        selectableRuntimeIds.includes(String(item)),
      )
    : [];
  const savedWorkflowSelection = Array.isArray(savedConfig.selectedWorkflowCli)
    ? savedConfig.selectedWorkflowCli.filter((item) =>
        ["speckit", "gsd", "bmad"].includes(String(item)),
      )
    : [];
  const recommendedRuntimeSelection = RECOMMENDED_RUNTIMES.filter((runtime) =>
    selectableRuntimeIds.includes(runtime),
  );
  const initialRuntimeSelection =
    savedRuntimeSelection.length > 0
      ? savedRuntimeSelection
      : recommendedRuntimeSelection.length > 0
        ? recommendedRuntimeSelection
        : selectableRuntimeIds;

  const packOptions = getPackIds().map((pack) => ({
    value: pack,
    label: PACKS[pack].label,
    desc: PACKS[pack].note,
  }));

  const runtimeOptions = setupRuntimeIds.map((value) => {
    const rt = RUNTIMES[value];
    const toolStatus = toolStatusByRuntime.get(value);
    const detectNote = toolStatus?.installed
      ? `detected: ${toolStatus.detectedCommand}`
      : "not detected yet";
    return {
      value,
      label: RECOMMENDED_RUNTIMES.includes(value)
        ? `${rt.label}  (recommended)`
        : rt.label,
      desc: `${rt.note} · ${detectNote}`,
    };
  });

  if (forcedRuntimes.length === 0 && runtimeOptions.length === 0) {
    console.log(chalk.red("  No supported setup runtimes detected for interactive mode."));
    console.log(chalk.yellow("  Use runtime flags explicitly (for example: --opencode)."));
    console.log();
    process.exit(1);
  }

  let packs = forcedPacks.length > 0 ? [...forcedPacks] : [];
  const language = "en";
  let runtimes = forcedRuntimes.length > 0 ? [...forcedRuntimes] : [];
  let workflows =
    forcedWorkflows.length > 0 ? [...forcedWorkflows] : [...savedWorkflowSelection];
  let location = forcedLocation || null;
  let conflictPolicy = forcedConflictPolicy || null;
  const setupMode = forcedSetupMode || savedSetupMode;

  const steps = [
    async () => {
      if (forcedPacks.length > 0) return "next";

      const selectedPacks = await multiSelect({
        title: "Step 1/5 — Which command packs should be installed?",
        options: packOptions,
        initial: packs,
        allowBack: true,
      });

      if (selectedPacks === BACK_ACTION) return "back";
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
        title: "Step 2/5 — Which AI tools should receive commands?",
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
      if (forcedWorkflows.length > 0) return "next";

      const selectedWorkflows = await multiSelect({
        title: "Step 3/5 — Which workflow CLIs should be prepared?",
        options: WORKFLOW_OPTIONS,
        initial: workflows,
        allowBack: true,
      });

      if (selectedWorkflows === BACK_ACTION) return "back";

      workflows = selectedWorkflows;
      return "next";
    },

    async () => {
      if (forcedLocation) return "next";

      const selectedLocation = await singleSelect({
        title: "Step 4/5 — Install where?",
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
      if (forcedConflictPolicy) return "next";

      const selectedConflictPolicy = await singleSelect({
        title: "Step 5/5 — Existing file policy?",
        subtitle: "Choose what to do when command files already exist",
        options: [
          {
            value: "keep",
            label: "Keep existing  (recommended)",
            desc: "Do not overwrite existing files",
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
      if (stepIndex === 0) {
        return BACK_ACTION;
      }
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
    {
      force,
      dryRun,
    },
  );

  let shouldInstallWorkflows = forcedWorkflowInstallMode === "install";
  if (forcedWorkflowInstallMode === null && workflows.length > 0) {
    shouldInstallWorkflows = await confirm(
      "Install selected workflow CLIs now (Spec-Kit/GSD/BMAD)?",
      true,
    );
  }

  if (forcedWorkflowInstallMode === "install") {
    console.log(chalk.dim("  Workflow install flag: install\n"));
  } else if (forcedWorkflowInstallMode === "skip") {
    console.log(chalk.dim("  Workflow install flag: skip\n"));
  }

  let workflowInstallResults = {
    statuses: {
      speckit: workflows.includes("speckit") ? "pending" : "not-selected",
      gsd: workflows.includes("gsd") ? "pending" : "not-selected",
      bmad: workflows.includes("bmad") ? "pending" : "not-selected",
    },
    details: {
      speckit: "",
      gsd: "",
      bmad: "",
    },
  };

  if (shouldInstallWorkflows && workflows.length > 0) {
    printHeader("Installing Workflow CLIs");
    workflowInstallResults = installWorkflowCliTooling({
      workflows,
      runtimes,
      location,
      dryRun,
    });
  }

  saveLanguageConfig(cwd, location, language, {
    dryRun,
    setupMode,
    runtimes,
    workflows,
  });
  ensureSetupStateFile(cwd, { dryRun });

  // .gitignore
  if (!dryRun) {
    const gi = path.join(cwd, ".gitignore");
    if (fs.existsSync(gi)) {
      const content = fs.readFileSync(gi, "utf8");
      const lines = [];
      if (!content.includes(".vibe/index.db")) lines.push(".vibe/index.db");

      if (lines.length > 0) {
        fs.appendFileSync(gi, `\n# vibe\n${lines.join("\n")}\n`);
      }
    }
  }

  const packLabels = packs.map((pack) => PACKS[pack]?.label || pack).join(", ");
  const startCommand = packs.includes("conversation")
    ? "/conversation"
    : "/setup.init";

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalFail =
    cmdResults.commands.failed +
    cmdResults.references.failed +
    Object.values(workflowInstallResults.statuses).filter(
      (status) => status === "failed",
    ).length;
  const summaryLines = [
    totalFail
      ? "WARN  Vibe setup completed with errors"
      : "OK    Vibe setup complete!",
    "",
    `   Packs     ${packLabels}`,
    `   Mode      ${INSTALL_MODE_LABELS.local}`,
    `   Existing  ${conflictPolicy}`,
    `   Profile   ${SETUP_MODE_LABELS[setupMode]}`,
    `   Commands  ${cmdResults.commands.created} synced`,
    `   Refs      ${cmdResults.references.created} synced`,
    `   Language  ${language}`,
    `   Location  ${location}`,
    `   Workflows ${workflows.length > 0 ? workflows.join(", ") : "none"}`,
    `   InstallWF  ${shouldInstallWorkflows ? "yes" : "no"}`,
  ];

  if (workflows.length > 0) {
    summaryLines.push(
      `   Speckit   ${workflowInstallResults.statuses.speckit}`,
      `   GSD       ${workflowInstallResults.statuses.gsd}`,
      `   BMAD      ${workflowInstallResults.statuses.bmad}`,
    );
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

  return "done";
}

/**
 * Entrypoint for `vibe setup`.
 * - No flags: open Setup Center menu.
 * - With install flags: execute setup wizard directly.
 */
export async function runSetup(args = []) {
  const normalizedArgs = Array.isArray(args) ? args : [];
  if (normalizedArgs.includes("--help") || normalizedArgs.includes("-h")) {
    console.log(SETUP_HELP);
    return;
  }

  const [subcmd, ...rest] = normalizedArgs;
  if (subcmd === "status") {
    await runSetupStatus(rest);
    return;
  }

  const hasFlags = normalizedArgs.some((arg) => String(arg).startsWith("--"));
  const command = normalizedArgs[0] || "";
  const openMenu =
    normalizedArgs.includes("--menu") ||
    (!hasFlags && (normalizedArgs.length === 0 || command === "menu"));

  if (openMenu) {
    const { runSetupCenter } = await import("./setup-center.command.js");
    await runSetupCenter(normalizedArgs);
    return;
  }

  await runSetupWizard(normalizedArgs);
}
