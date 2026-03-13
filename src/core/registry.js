// registry.js — Single source of truth for all remote assets
// CLI fetches from here at runtime — no rebuild needed when you update files

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

function parseGitHubRepo(value) {
  if (!value || typeof value !== "string") return null;
  const input = value.trim();
  if (/^[\w.-]+\/[\w.-]+$/.test(input)) return input;

  const normalized = input.replace(/^git\+/, "");
  const match = normalized.match(/github\.com[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?$/);
  return match ? match[1] : null;
}

function normalizeRepo(value) {
  const repo = parseGitHubRepo(value);
  if (!repo) return null;
  if (repo.startsWith("YOUR_USERNAME/")) return null;
  return repo;
}

function readPackageConfig() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const pkgPath = path.join(here, "..", "..", "package.json");
  if (!fs.existsSync(pkgPath)) return {};

  try {
    return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch {
    return {};
  }
}

function readGitRemoteRepo(cwd) {
  try {
    const remote = execSync("git config --get remote.origin.url", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return normalizeRepo(remote);
  } catch {
    return null;
  }
}

const pkg = readPackageConfig();
const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryValue =
  typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;

export const GITHUB_REPO =
  normalizeRepo(process.env.VIBE_GITHUB_REPO) ||
  normalizeRepo(pkg.vibe?.githubRepo) ||
  normalizeRepo(repositoryValue) ||
  readGitRemoteRepo(here) ||
  "genius-wizard-dev/vibe";

export const GITHUB_BRANCH =
  process.env.VIBE_GITHUB_BRANCH || pkg.vibe?.githubBranch || "main";

export const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;

/**
 * Resolves a repository-relative file path to the raw GitHub URL.
 */
export function rawUrl(filePath) {
  return `${RAW_BASE}/${filePath}`;
}

// ─── Runtime config ────────────────────────────────────────────────────────────
//
// Each runtime has different:
//   - localDir   : where command files go in the project
//   - globalDir  : where they go globally (all projects)
//   - prefix     : how user invokes in the agent
//   - note       : shown during setup
//
export const RUNTIMES = {
  opencode: {
    label: "OpenCode",
    localDir: ".opencode/commands",
    globalDir: "~/.config/opencode/commands",
    prefix: "/",
    verify: "/setup.init",
    note: "Commands: /name, args: $ARGUMENTS, refs: @path",
  },
  claude: {
    label: "Claude Code",
    localDir: ".claude/commands",
    globalDir: "~/.claude/commands",
    prefix: "/",
    verify: "/setup.init",
    note: "Commands: /name, args: $ARGUMENTS, refs: @path",
  },
  gemini: {
    label: "Gemini CLI",
    localDir: ".gemini/commands",
    globalDir: "~/.gemini/commands",
    prefix: "/",
    verify: "/setup.init",
    note: "Commands: /name, tool refs: @tool, channels: #name",
  },
  codex: {
    label: "Codex CLI",
    localDir: ".codex/prompts",
    globalDir: "~/.codex/prompts",
    prefix: "/",
    verify: "/setup.init",
    note: "Commands: /name, connectors: $app, refs: @path",
  },
  cursor: {
    label: "Cursor",
    localDir: ".cursor/commands",
    globalDir: "~/.cursor/commands",
    prefix: "/",
    verify: "/setup.init",
    note: "Runtime syntax can include @ and # selectors",
  },
  windsurf: {
    label: "Windsurf",
    localDir: ".windsurf/commands",
    globalDir: "~/.windsurf/commands",
    prefix: "/",
    verify: "/setup.init",
    note: "Runtime syntax can include @ and # selectors",
  },
  qwen: {
    label: "Qwen Code",
    localDir: ".qwen/commands",
    globalDir: "~/.qwen/commands",
    prefix: "/",
    verify: "/setup.init",
    note: "Runtime syntax can include @ and # selectors",
  },
  kirocli: {
    label: "Kiro CLI",
    localDir: ".kiro/commands",
    globalDir: "~/.kiro/commands",
    prefix: "/",
    verify: "/setup.init",
    note: "Commands: /name",
  },
  continue: {
    label: "Continue",
    localDir: ".continue/prompts",
    globalDir: "~/.continue/prompts",
    prefix: "/",
    verify: "/setup.init",
    note: "Prompts: /name, refs: @path",
  },
};

// Packs define which command resources can be installed.
export const PACKS = {
  setup: {
    label: "Setup",
    note: "Initialize minimal AI coding stack and runtime wiring",
    languages: ["en"],
    commands: [
      "setup.init",
      "setup.resume",
      "setup.detect",
      "setup.install",
      "setup.docs",
      "setup.skills",
      "setup.verify",
      "setup.sdd",
      "setup.update",
      "setup.changelogs",
    ],
    referenceFiles: [
      "reference/setup.install.tools.md",
      "reference/setup.verify.tools.md",
    ],
    stateFile: ".vibe/state.md",
  },
  conversation: {
    label: "Conversation",
    note: "Structured multi-agent meeting workflow with local sqlite persistence",
    languages: ["en"],
    commands: ["conversation"],
    referenceFiles: [],
    stateFile: ".vibe/data/conversations.db",
  },
};

export function getPackIds() {
  return Object.keys(PACKS);
}

/**
 * Builds install-ready metadata for selected packs.
 */
export function getPackManifest(selectedPacks = []) {
  return selectedPacks
    .filter((pack) => PACKS[pack])
    .map((pack) => {
      const def = PACKS[pack];
      const commandFiles = def.commands.map((cmd) => `${cmd}.md`);
      return {
        id: pack,
        ...def,
        commandFiles,
        files: [...commandFiles, ...def.referenceFiles],
      };
    });
}

/**
 * Returns the complete set of files managed by vibe packs.
 */
export function getKnownManagedFiles() {
  const files = new Set();

  for (const def of Object.values(PACKS)) {
    def.commands.forEach((cmd) => files.add(`${cmd}.md`));
    def.referenceFiles.forEach((file) => files.add(file));
  }

  return files;
}

export function resolvePackLanguage(requestedLanguage, selectedPacks) {
  const language = requestedLanguage || "en";
  const unsupported = selectedPacks.filter(
    (pack) => !PACKS[pack]?.languages?.includes(language),
  );

  if (unsupported.length === 0) {
    return { language, fallback: false, unsupported: [] };
  }

  return {
    language: "en",
    fallback: language !== "en",
    unsupported,
  };
}
