import fs from "fs";
import path from "path";

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

function resolveCommand(commands) {
  const list = Array.isArray(commands) ? commands : [commands];
  for (const command of list) {
    const resolvedPath = commandExists(command);
    if (resolvedPath) {
      return {
        command,
        resolvedPath,
      };
    }
  }

  return {
    command: "",
    resolvedPath: "",
  };
}

function readStateContent(stateFile) {
  if (!stateFile || !fs.existsSync(stateFile)) return "";
  return fs.readFileSync(stateFile, "utf8");
}

function readWorkflowSelectionFromConfig(projectRoot) {
  const filePath = path.join(projectRoot, ".vibe", "config.json");
  if (!fs.existsSync(filePath)) return [];

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(parsed.selectedWorkflowCli)) return [];
    return parsed.selectedWorkflowCli
      .map((item) => String(item || "").trim().toLowerCase())
      .filter((item) => ["speckit", "gsd", "bmad"].includes(item));
  } catch {
    return [];
  }
}

function extractStateValue(stateContent, key) {
  const pattern = new RegExp(`^${key}:\\s*(.+)$`, "mi");
  const match = String(stateContent || "").match(pattern);
  return match ? String(match[1] || "").trim() : "";
}

function hasToken(value, token) {
  return new RegExp(`\\b${token}\\b`, "i").test(String(value || ""));
}

function normalizeInstallStatus(rawValue) {
  const value = String(rawValue || "").trim().toLowerCase();
  if (!value) return "pending";
  if (value.includes("not-selected") || value.includes("not selected")) {
    return "not-selected";
  }
  if (value.includes("fail")) return "failed";
  if (
    value.includes("done") ||
    value.includes("skip") ||
    value.includes("already") ||
    value.includes("installed")
  ) {
    return "done";
  }
  if (value.includes("pending")) return "pending";
  return "pending";
}

export function parseWorkflowSelection(stateContent = "") {
  const selectedRaw = extractStateValue(stateContent, "selected_workflows");
  const recommendation = extractStateValue(stateContent, "recommendation");
  const source = String(selectedRaw || recommendation || "").toLowerCase();
  const bmadOptional = /\bbmad\s+optional\b/.test(source);

  let speckit = false;
  let gsd = false;
  let bmad = false;

  if (selectedRaw) {
    speckit = hasToken(source, "speckit");
    gsd = hasToken(source, "gsd");
    bmad = hasToken(source, "bmad") && !bmadOptional;
  } else {
    if (hasToken(source, "hybrid")) {
      speckit = true;
      gsd = true;
      bmad = false;
    } else {
      speckit = hasToken(source, "speckit");
      gsd = hasToken(source, "gsd");
      bmad = hasToken(source, "bmad") && !bmadOptional;
    }
  }

  return {
    raw: selectedRaw,
    recommendation,
    speckit,
    gsd,
    bmad,
    bmadOptional,
  };
}

function withConfigFallback(selection, configWorkflows = []) {
  if (
    selection.speckit ||
    selection.gsd ||
    selection.bmad ||
    configWorkflows.length === 0
  ) {
    return selection;
  }

  const selected = new Set(configWorkflows);
  return {
    ...selection,
    raw: configWorkflows.join(","),
    speckit: selected.has("speckit"),
    gsd: selected.has("gsd"),
    bmad: selected.has("bmad"),
    bmadOptional: false,
  };
}

export function parseWorkflowInstallStatuses(stateContent = "") {
  const statuses = {
    speckit: { raw: "", status: "pending" },
    gsd: { raw: "", status: "pending" },
    bmad: { raw: "", status: "pending" },
  };

  const matches = String(stateContent || "").matchAll(
    /^\s*-\s*workflow_(speckit|gsd|bmad)\s*:\s*(.+)$/gim,
  );

  for (const match of matches) {
    const id = String(match[1] || "").toLowerCase();
    const raw = String(match[2] || "").trim();
    statuses[id] = {
      raw,
      status: normalizeInstallStatus(raw),
    };
  }

  return statuses;
}

export function detectWorkflowTooling(projectRoot = process.cwd()) {
  const hasSpecifyDir = fs.existsSync(path.join(projectRoot, ".specify"));
  const hasPlanningDir = fs.existsSync(path.join(projectRoot, ".planning"));
  const hasBmadDir = fs.existsSync(path.join(projectRoot, "_bmad"));
  const hasBmadOutputDir = fs.existsSync(path.join(projectRoot, "_bmad-output"));

  const speckitCli = resolveCommand(["specify"]);
  const gsdCli = resolveCommand(["get-shit-done-cc", "gsd"]);
  const bmadCli = resolveCommand(["bmad", "get-shit-done-cc"]);

  return {
    speckit: {
      id: "speckit",
      label: "Spec-Kit",
      cliInstalled: Boolean(speckitCli.resolvedPath),
      cliCommand: speckitCli.command,
      cliPath: speckitCli.resolvedPath,
      artifactReady: hasSpecifyDir && hasPlanningDir,
      artifactHint: ".specify + .planning",
    },
    gsd: {
      id: "gsd",
      label: "GSD",
      cliInstalled: Boolean(gsdCli.resolvedPath),
      cliCommand: gsdCli.command,
      cliPath: gsdCli.resolvedPath,
      artifactReady: hasPlanningDir,
      artifactHint: ".planning",
    },
    bmad: {
      id: "bmad",
      label: "BMAD",
      cliInstalled: Boolean(bmadCli.resolvedPath),
      cliCommand: bmadCli.command,
      cliPath: bmadCli.resolvedPath,
      artifactReady: hasBmadDir || hasBmadOutputDir,
      artifactHint: "_bmad or _bmad-output",
    },
    markers: {
      hasSpecifyDir,
      hasPlanningDir,
      hasBmadDir,
      hasBmadOutputDir,
    },
  };
}

function buildWorkflowCheck({ id, selected, optional, installState, tooling }) {
  const selectedFlag = Boolean(selected);
  const stateDone = installState.status === "done";
  const stateFailed = installState.status === "failed";
  const readyByWorkspace = tooling.artifactReady;
  const readyByCli = tooling.cliInstalled;

  if (!selectedFlag) {
    const extra = [];
    if (tooling.cliInstalled && tooling.cliCommand) {
      extra.push(`cli: ${tooling.cliCommand}`);
    }
    if (tooling.artifactReady) {
      extra.push(`workspace: ${tooling.artifactHint}`);
    }

    const suffix = extra.length > 0 ? `; ${extra.join("; ")}` : "";
    return {
      id,
      label: tooling.label,
      selected: false,
      optional: Boolean(optional),
      ready: true,
      detail: optional ? `optional; not selected${suffix}` : `not selected${suffix}`,
      installStatus: installState.status,
      installRaw: installState.raw,
    };
  }

  const ready = stateDone || readyByWorkspace || readyByCli;

  let detail = "";
  if (stateDone) {
    detail = "install state: done";
  } else if (readyByWorkspace && readyByCli) {
    detail = `cli + workspace markers (${tooling.artifactHint})`;
  } else if (readyByWorkspace) {
    detail = `workspace markers (${tooling.artifactHint})`;
  } else if (readyByCli && tooling.cliCommand) {
    detail = `cli detected: ${tooling.cliCommand}`;
  } else if (stateFailed) {
    detail = `install state failed: ${installState.raw || "unknown error"}`;
  } else {
    detail = `missing; need ${tooling.artifactHint} or workflow CLI`;
  }

  return {
    id,
    label: tooling.label,
    selected: true,
    optional: false,
    ready,
    detail,
    installStatus: installState.status,
    installRaw: installState.raw,
  };
}

export function evaluateWorkflowReadiness(
  projectRoot = process.cwd(),
  stateFile = path.join(projectRoot, ".vibe", "state.md"),
) {
  const effectiveStateFile = stateFile;
  const stateContent = readStateContent(effectiveStateFile);
  const configSelection = readWorkflowSelectionFromConfig(projectRoot);
  const selection = withConfigFallback(
    parseWorkflowSelection(stateContent),
    configSelection,
  );
  const installStatuses = parseWorkflowInstallStatuses(stateContent);
  const tooling = detectWorkflowTooling(projectRoot);

  const checks = [
    buildWorkflowCheck({
      id: "speckit",
      selected: selection.speckit,
      optional: false,
      installState: installStatuses.speckit,
      tooling: tooling.speckit,
    }),
    buildWorkflowCheck({
      id: "gsd",
      selected: selection.gsd,
      optional: false,
      installState: installStatuses.gsd,
      tooling: tooling.gsd,
    }),
    buildWorkflowCheck({
      id: "bmad",
      selected: selection.bmad,
      optional: selection.bmadOptional,
      installState: installStatuses.bmad,
      tooling: tooling.bmad,
    }),
  ];

  const selectedChecks = checks.filter((item) => item.selected);
  const missingSelected = selectedChecks
    .filter((item) => !item.ready)
    .map((item) => item.id);

  return {
    stateFile: effectiveStateFile,
    hasState: Boolean(stateContent),
    selection,
    installStatuses,
    tooling,
    checks,
    selectedReady: missingSelected.length === 0,
    missingSelected,
  };
}
