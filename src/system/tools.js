import fs from "fs";
import path from "path";

export const TOOL_CATALOG = [
  {
    id: "opencode",
    label: "OpenCode",
    commands: ["opencode"],
    installHint: "https://opencode.ai/docs",
  },
  {
    id: "claude",
    label: "Claude Code",
    commands: ["claude"],
    installHint: "https://docs.anthropic.com/en/docs/claude-code",
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    commands: ["gemini"],
    installHint: "https://github.com/google-gemini/gemini-cli",
  },
  {
    id: "codex",
    label: "Codex CLI",
    commands: ["codex"],
    installHint: "https://github.com/openai/codex",
  },
  {
    id: "kirocli",
    label: "Kiro CLI",
    commands: ["kiro", "kirocli"],
    installHint: "https://kiro.dev",
  },
];

function pathEntries() {
  const raw = process.env.PATH || "";
  return raw
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function commandExtensions() {
  if (process.platform !== "win32") return [""];
  const pathext = process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM";
  return pathext
    .split(";")
    .map((ext) => ext.trim().toLowerCase())
    .filter(Boolean);
}

function isExecutableFile(filePath) {
  if (!fs.existsSync(filePath)) return false;

  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;
    if (process.platform === "win32") return true;
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function commandExists(commandName) {
  const command = String(commandName || "").trim();
  if (!command) return null;

  if (command.includes(path.sep)) {
    return isExecutableFile(command) ? command : null;
  }

  const entries = pathEntries();
  const exts = commandExtensions();

  for (const entry of entries) {
    const base = path.join(entry, command);
    for (const ext of exts) {
      const candidate = process.platform === "win32" ? `${base}${ext}` : base;
      if (isExecutableFile(candidate)) return candidate;
    }
  }

  return null;
}

/**
 * Scans PATH for all supported AI CLI tools.
 */
export function detectInstalledTools() {
  return TOOL_CATALOG.map((tool) => {
    const resolvedCommand = tool.commands
      .map((command) => ({ command, resolvedPath: commandExists(command) }))
      .find((entry) => Boolean(entry.resolvedPath));

    return {
      ...tool,
      installed: Boolean(resolvedCommand),
      detectedCommand: resolvedCommand?.command || "",
      detectedPath: resolvedCommand?.resolvedPath || "",
    };
  });
}

/**
 * Returns true when at least one supported AI CLI is installed.
 */
export function hasAnyInstalledTool() {
  return detectInstalledTools().some((tool) => tool.installed);
}
