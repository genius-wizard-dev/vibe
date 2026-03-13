import fs from "fs";
import path from "path";
import { evaluateWorkflowReadiness } from "./workflow-status.js";

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

function deriveSetupReadiness(statuses, workflowReady) {
  const detectDone = isDoneStatus(statuses.DETECT);
  const installDone = isDoneStatus(statuses.INSTALL);
  const docsDone = isDoneStatus(statuses.DOCS);
  const skillsDone = isDoneStatus(statuses.SKILLS);

  return {
    ready: detectDone && installDone && docsDone && skillsDone && workflowReady,
    sections: {
      detect: statuses.DETECT || "pending",
      install: statuses.INSTALL || "pending",
      docs: statuses.DOCS || "pending",
      skills: statuses.SKILLS || "pending",
    },
  };
}

/**
 * Computes workspace readiness flags used by setup center and convo guards.
 */
export function getWorkspaceStatus(projectRoot = process.cwd()) {
  const vibeRoot = path.join(projectRoot, ".vibe");
  const configFile = path.join(vibeRoot, "config.json");
  const setupState = path.join(vibeRoot, "state.md");
  const statuses = parseSectionStatuses(setupState);
  const workflow = evaluateWorkflowReadiness(projectRoot, setupState);
  const readiness = deriveSetupReadiness(statuses, workflow.selectedReady);

  const hasWorkspace = fs.existsSync(vibeRoot);
  const hasConfig = fs.existsSync(configFile);
  const hasSetupState = fs.existsSync(setupState);
  const workflowReady = workflow.selectedReady;
  const setupReady = hasSetupState && readiness.ready;
  const initReady = hasWorkspace && hasConfig;
  const convoReady = initReady && setupReady;

  return {
    projectRoot,
    vibeRoot,
    configFile,
    setupState,
    hasWorkspace,
    hasConfig,
    hasSetupState,
    workflowReady,
    setupReady,
    initReady,
    convoReady,
    missingWorkflows: workflow.missingSelected,
    selectedWorkflows: workflow.selection.raw || workflow.selection.recommendation || "",
    setupSections: {
      ...readiness.sections,
      workflows:
        workflow.missingSelected.length === 0
          ? "done"
          : `missing: ${workflow.missingSelected.join(",")}`,
    },
  };
}
