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
    verify: "/resource.setup",
    note: "Commands use / prefix",
  },
  claude: {
    label: "Claude Code",
    localDir: ".claude/commands",
    globalDir: "~/.claude/commands",
    prefix: "/",
    verify: "/resource.setup",
    note: "Commands use / prefix",
  },
  gemini: {
    label: "Gemini CLI",
    localDir: ".gemini/commands",
    globalDir: "~/.gemini/commands",
    prefix: "/",
    verify: "/resource.setup",
    note: "Commands use / prefix",
  },
  codex: {
    label: "Codex CLI",
    localDir: ".codex/prompts",
    globalDir: "~/.codex/prompts",
    prefix: "/",
    verify: "/resource.setup",
    note: "Commands use / prefix",
  },
  cursor: {
    label: "Cursor",
    localDir: ".cursor/commands",
    globalDir: "~/.cursor/commands",
    prefix: "/",
    verify: "/resource.setup",
    note: "Commands use / prefix",
  },
  windsurf: {
    label: "Windsurf",
    localDir: ".windsurf/commands",
    globalDir: "~/.windsurf/commands",
    prefix: "/",
    verify: "/resource.setup",
    note: "Commands use / prefix",
  },
  qwen: {
    label: "Qwen Code",
    localDir: ".qwen/commands",
    globalDir: "~/.qwen/commands",
    prefix: "/",
    verify: "/resource.setup",
    note: "Commands use / prefix",
  },
  kirocli: {
    label: "Kiro CLI",
    localDir: ".kiro/commands",
    globalDir: "~/.kiro/commands",
    prefix: "/",
    verify: "/resource.setup",
    note: "Commands use / prefix",
  },
  continue: {
    label: "Continue",
    localDir: ".continue/prompts",
    globalDir: "~/.continue/prompts",
    prefix: "/",
    verify: "/resource.setup",
    note: "Prompts use / prefix",
  },
};

// Packs define which command resources can be installed.
export const PACKS = {
  resource: {
    label: "Resource",
    note: "Bootstrap and maintain shared AI resources before coding",
    languages: ["en"],
    commands: [
      "resource.setup",
      "resource.resume",
      "resource.detect",
      "resource.findskills",
      "resource.install",
      "resource.docs",
      "resource.skills",
      "resource.base",
      "resource.changelogs",
      "resource.verify",
    ],
    referenceFiles: [
      "reference/resource.install.tools.md",
      "reference/resource.verify.tools.md",
      "reference/resource.flow.bridge.md",
    ],
    stateFile: ".vibe/resource/state.md",
  },
  research: {
    label: "Research",
    note: "Repeatable feature research with logs, analysis, and handoff",
    languages: ["en"],
    commands: [
      "research.setup",
      "research.new",
      "research.resume",
      "research.scan",
      "research.interview",
      "research.analyze",
      "research.discuss",
      "research.log",
      "research.export",
    ],
    referenceFiles: [
      "reference/research.interview.gsd.md",
      "reference/research.export.schema.md",
      "reference/research.folder.template.md",
    ],
    stateFile: ".vibe/research/<research>/state.md",
  },
  design: {
    label: "Design",
    note: "Repeatable architecture design from research output",
    languages: ["en"],
    commands: [
      "design.setup",
      "design.new",
      "design.resume",
      "design.arch",
      "design.mcp",
      "design.review",
      "design.log",
      "design.export",
    ],
    referenceFiles: [
      "reference/design.skills.setup.md",
      "reference/design.folder.template.md",
    ],
    stateFile: ".vibe/design/<design>/state.md",
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

export const PROMPT_LIBRARY = {
  languages: ["en"],
  files: [
    "fast.md",
    "research.md",
    "design.md",
    "resource.md",
    "implement.md",
    "parallel.md",
    "handoff.md",
  ],
};

export function resolvePromptLanguage(requestedLanguage = "en") {
  if (PROMPT_LIBRARY.languages.includes(requestedLanguage)) {
    return { language: requestedLanguage, fallback: false };
  }

  return {
    language: "en",
    fallback: requestedLanguage !== "en",
  };
}

/**
 * Returns prompt file manifest for the resolved language.
 */
export function getPromptFiles(language = "en") {
  const resolved = resolvePromptLanguage(language).language;
  return {
    language: resolved,
    files: PROMPT_LIBRARY.files,
  };
}

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
