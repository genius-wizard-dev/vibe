import { getPackIds } from "./registry.js";

const PACK_FLAG_MAP = {
  "--resource": "resource",
  "--research": "research",
  "--design": "design",
};

const ALL_PACK_FLAGS = ["--all-packs", "--all-flows"];

function parsePackList(value) {
  if (!value || typeof value !== "string") return [];

  return value
    .split(/[,+\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .filter((item) => getPackIds().includes(item));
}

export function parsePackArgs(args) {
  if (args.some((arg) => ALL_PACK_FLAGS.includes(arg))) {
    return getPackIds();
  }

  const selected = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const mapped = PACK_FLAG_MAP[arg];
    if (mapped) selected.push(mapped);

    if (arg === "--packs") {
      const next = args[i + 1];
      selected.push(...parsePackList(next));
      i += 1;
      continue;
    }

    if (arg.startsWith("--packs=")) {
      selected.push(...parsePackList(arg.split("=")[1] || ""));
    }
  }

  return [...new Set(selected)];
}
