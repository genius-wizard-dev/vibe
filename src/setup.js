import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
import { fetchMany } from "./fetch.js";
import { COMMANDS, COMMAND_FILES, RUNTIMES } from "./registry.js";
import { parseRuntimeArgs } from "./runtime-args.js";
import {
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

const RECOMMENDED_RUNTIMES = ["opencode", "codex"];

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

const LANGUAGE_LABELS = {
  en: "English",
  vi: "Tiếng Việt",
};

function parseLanguageArg(args) {
  const fromEq = args.find((a) => a.startsWith("--lang="));
  if (fromEq) {
    const lang = fromEq.split("=")[1]?.toLowerCase();
    if (lang === "en" || lang === "vi") return lang;
  }

  const idx = args.indexOf("--lang");
  if (idx !== -1) {
    const lang = args[idx + 1]?.toLowerCase();
    if (lang === "en" || lang === "vi") return lang;
  }

  return null;
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function getSavedLanguage(cwd) {
  const local = readJsonFile(path.join(cwd, ".vibe", "config.json"));
  if (local.language === "en" || local.language === "vi") return local.language;

  const globalVibe = readJsonFile(
    path.join(os.homedir(), ".config", "vibe", "config.json"),
  );
  if (globalVibe.language === "en" || globalVibe.language === "vi") {
    return globalVibe.language;
  }

  return "en";
}

function saveLanguageConfig(cwd, location, language, { dryRun }) {
  if (dryRun) return;

  const localDir = path.join(cwd, ".vibe");
  const localFile = path.join(localDir, "config.json");
  fs.mkdirSync(localDir, { recursive: true });
  const localConfig = { ...readJsonFile(localFile), language };
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
    fs.writeFileSync(
      globalFile,
      `${JSON.stringify(globalConfig, null, 2)}\n`,
      "utf8",
    );
  }
}

// ─── Install commands ─────────────────────────────────────────────────────────

async function installCommands(
  runtimes,
  location,
  language,
  { force, dryRun },
) {
  if (runtimes.length === 0) {
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
  const referenceFiles = COMMAND_FILES.filter((file) =>
    file.startsWith("reference/"),
  );

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
    const commandItems = COMMANDS.map((cmd) => ({
      remote: `commands/${language}/${cmd}.md`,
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
      printStep(COMMANDS[i], s);
      updateCounts(results.commands, r.status);
    });

    if (referenceFiles.length > 0) {
      const referenceItems = referenceFiles.map((file) => ({
        remote: `commands/${language}/${file}`,
        local: path.join(dir, file),
      }));
      const referenceResults = await fetchMany(referenceItems, { force, dryRun });
      referenceResults.forEach((r) => updateCounts(results.references, r.status));

      const changed = referenceResults.filter(
        (r) => r.status !== "failed" && r.status !== "skipped",
      ).length;
      const unchanged = referenceResults.filter((r) => r.status === "skipped").length;
      const failed = referenceResults.filter((r) => r.status === "failed").length;
      const detail = [
        changed > 0 ? `${changed} synced` : null,
        unchanged > 0 ? `${unchanged} unchanged` : null,
        failed > 0 ? `${failed} failed` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      const refStatus = failed > 0 ? "fail" : changed > 0 ? "done" : "skip";
      printStep("reference/*", refStatus, detail);
    }
  }
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function runSetup(args) {
  const cwd = process.cwd();
  const force = args.includes("--force");
  const dryRun = args.includes("--dry-run");
  const forcedRuntimes = parseRuntimeArgs(args);
  const forcedLocation = parseLocationArg(args);
  const forcedLanguage = parseLanguageArg(args);
  const requestedLang =
    args.includes("--lang") || args.some((a) => a.startsWith("--lang="));

  if (requestedLang && !forcedLanguage) {
    console.error(
      chalk.red("\n  Invalid language. Use --lang en or --lang vi.\n"),
    );
    process.exit(1);
  }

  process.stdout.write("\x1b[2J\x1b[H");
  console.log(VIBE_ART);
  console.log(chalk.dim(`  Project: ${chalk.white(cwd)}\n`));
  if (!(await confirm("Ready to start?"))) {
    console.log("\n  Aborted.\n");
    process.exit(0);
  }

  // ── Step 1: Language ──────────────────────────────────────────────────────
  const savedLanguage = getSavedLanguage(cwd);
  const language =
    forcedLanguage ||
    (await singleSelect({
      title: "Step 1/3 — Preferred language?",
      subtitle: "Used for vibe setup defaults and future updates",
      options: [
        {
          value: "en",
          label: "English  (recommended)",
          desc: "Best default for prompts and command content",
        },
        {
          value: "vi",
          label: "Tiếng Việt",
          desc: "Dùng tiếng Việt cho quy trình setup",
        },
      ],
      initial: savedLanguage === "vi" ? 1 : 0,
    }));

  if (forcedLanguage) {
    console.log(chalk.dim(`  Language flag: ${LANGUAGE_LABELS[language]}\n`));
  }

  // ── Step 2: Runtimes ──────────────────────────────────────────────────────
  const detected = detectRuntimes();
  const initialRuntimeSelection = [
    ...new Set([
      ...RECOMMENDED_RUNTIMES.filter((r) => RUNTIMES[r]),
      ...detected,
    ]),
  ];
  const runtimes =
    forcedRuntimes.length > 0
      ? forcedRuntimes
      : await multiSelect({
          title: "Step 2/3 — Which AI tools are you using?",
          options: Object.entries(RUNTIMES).map(([value, rt]) => ({
            value,
            label: RECOMMENDED_RUNTIMES.includes(value)
              ? `${rt.label}  (recommended)`
              : rt.label,
            desc: rt.note,
          })),
          initial: initialRuntimeSelection,
        });

  if (forcedRuntimes.length > 0) {
    const labels = runtimes.map((r) => RUNTIMES[r]?.label || r).join(", ");
    console.log(chalk.dim(`\n  Runtime flags: ${labels}\n`));
  }

  if (runtimes.length === 0) {
    console.log(chalk.yellow("\n  Select at least one.\n"));
    process.exit(1);
  }

  // ── Step 3: Location ──────────────────────────────────────────────────────
  const location =
    forcedLocation ||
    (await singleSelect({
      title: "Step 3/3 — Install where?",
      subtitle: "Local = current project only   |   Global = all projects",
      options: [
        {
          value: "global",
          label: "Global  (recommended)",
          desc: "Install once and use in all projects",
        },
        {
          value: "local",
          label: "Local",
          desc: "Creates command dirs only inside this project",
        },
      ],
    }));

  if (forcedLocation) {
    console.log(chalk.dim(`  Location flag: ${forcedLocation}\n`));
  }

  // ── Confirm + Execute ─────────────────────────────────────────────────────
  process.stdout.write("\x1b[2J\x1b[H");
  console.log(VIBE_ART);
  printHeader("Installing");

  const cmdResults = await installCommands(runtimes, location, language, {
    force,
    dryRun,
  });

  saveLanguageConfig(cwd, location, language, { dryRun });

  // .gitignore
  if (!dryRun) {
    const gi = path.join(cwd, ".gitignore");
    if (
      fs.existsSync(gi) &&
      !fs.readFileSync(gi, "utf8").includes(".vibe/index.db")
    ) {
      fs.appendFileSync(gi, "\n# vibe\n.vibe/index.db\n");
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalFail = cmdResults.commands.failed + cmdResults.references.failed;
  printSummary([
    totalFail ? "⚠  Setup done (with errors)" : "✅  vibe setup complete!",
    "",
    `   Commands  ${cmdResults.commands.created} installed`,
    `   Refs      ${cmdResults.references.created} synced`,
    `   Language  ${LANGUAGE_LABELS[language]}`,
    `   Location  ${location}`,
    "",
    "   Verify in your agent:",
    ...runtimes.map(
      (r) => `   ${RUNTIMES[r].label.padEnd(14)} ${RUNTIMES[r].verify}`,
    ),
    "",
    "   Then run /vibe.setup to start",
  ]);
  if (totalFail)
    console.log(
      chalk.yellow(`\n  ⚠  ${totalFail} failed — run vibe update to retry\n`),
    );
}
