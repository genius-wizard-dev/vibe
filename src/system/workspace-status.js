import fs from "fs";
import path from "path";

function parseSectionStatuses(stateFile) {
  if (!fs.existsSync(stateFile)) return {};
  const content = fs.readFileSync(stateFile, "utf8");
  const matches = content.matchAll(/## \[(.*?)\] status:\s*(.+)/g);
  const statuses = {};

  for (const match of matches) {
    const key = String(match[1] || "").trim().toUpperCase();
    statuses[key] = String(match[2] || "").trim();
  }

  return statuses;
}

function isDoneStatus(value) {
  return String(value || "").toLowerCase().includes("done");
}

/**
 * Computes workspace readiness flags used by setup center and convo guards.
 */
export function getWorkspaceStatus(projectRoot = process.cwd()) {
  const vibeRoot = path.join(projectRoot, ".vibe");
  const configFile = path.join(vibeRoot, "config.json");
  const resourceState = path.join(vibeRoot, "resource", "state.md");
  const statuses = parseSectionStatuses(resourceState);
  const skillDone = isDoneStatus(statuses.SKILL_FIND);
  const baseDone = isDoneStatus(statuses.BASE);

  const hasWorkspace = fs.existsSync(vibeRoot);
  const hasConfig = fs.existsSync(configFile);
  const hasResourceState = fs.existsSync(resourceState);
  const resourceReady = hasResourceState && skillDone && baseDone;
  const initReady = hasWorkspace && hasConfig;
  const convoReady = initReady && resourceReady;

  return {
    projectRoot,
    vibeRoot,
    configFile,
    resourceState,
    hasWorkspace,
    hasConfig,
    hasResourceState,
    resourceReady,
    initReady,
    convoReady,
    resourceSections: {
      skillFind: statuses.SKILL_FIND || "pending",
      base: statuses.BASE || "pending",
    },
  };
}
