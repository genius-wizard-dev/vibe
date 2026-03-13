import { RUNTIMES } from "./registry.js";

// Normalizes runtime flags (including aliases) into runtime IDs.

const RUNTIME_FLAG_ALIASES = {
  opencode: ["--open-code", "--opencode-cli"],
  claude: ["--claude-code"],
  gemini: ["--gemini-cli"],
  codex: ["--codex-cli"],
  cursor: ["--cursor-ide"],
  windsurf: ["--windsurf-ide"],
  qwen: ["--qwen-code"],
  kirocli: ["--kiro", "--kiro-cli"],
  continue: ["--continue-dev"],
};

const ALL_RUNTIME_FLAGS = ["--all", "--all-tools", "--all-runtimes"];

function buildRuntimeArgMap() {
  return Object.keys(RUNTIMES).reduce((acc, runtime) => {
    const flags = [
      `--${runtime}`,
      ...(RUNTIME_FLAG_ALIASES[runtime] || []),
    ];
    flags.forEach((flag) => {
      acc[flag] = runtime;
    });
    return acc;
  }, {});
}

export const RUNTIME_ARG_MAP = Object.freeze(buildRuntimeArgMap());

/**
 * Parses CLI args and returns selected runtime IDs.
 */
export function parseRuntimeArgs(args) {
  if (args.some((arg) => ALL_RUNTIME_FLAGS.includes(arg))) {
    return Object.keys(RUNTIMES);
  }

  const selected = [];
  for (const arg of args) {
    const runtime = RUNTIME_ARG_MAP[arg];
    if (runtime) selected.push(runtime);
  }
  return [...new Set(selected)];
}
