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
  const pkgPath = path.join(here, "..", "package.json");
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
  "YOUR_USERNAME/vibe-coding";

export const GITHUB_BRANCH =
  process.env.VIBE_GITHUB_BRANCH || pkg.vibe?.githubBranch || "main";

export const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;

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
    verify: "/vibe.setup",
    note: "Commands use / prefix",
  },
  claude: {
    label: "Claude Code",
    localDir: ".claude/commands",
    globalDir: "~/.claude/commands",
    prefix: "/",
    verify: "/vibe.setup",
    note: "Commands use / prefix",
  },
  gemini: {
    label: "Gemini CLI",
    localDir: ".gemini/commands",
    globalDir: "~/.gemini/commands",
    prefix: "/",
    verify: "/vibe.setup",
    note: "Commands use / prefix",
  },
  codex: {
    label: "Codex CLI",
    localDir: ".codex/prompts",
    globalDir: "~/.codex/prompts",
    prefix: "/",
    verify: "/vibe.setup",
    note: "Commands use / prefix",
  },
};

// Command files — fetched from GitHub → injected into runtime command dirs
export const COMMANDS = [
  "vibe.setup",
  "vibe.resume",
  "vibe.detect",
  "vibe.install",
  "vibe.docs",
  "vibe.skills",
  "vibe.verify",
];
