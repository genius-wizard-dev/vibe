export const DEFAULT_DB_PATH = ".vibe/data/conversations.db";
export const DEFAULT_BUSY_TIMEOUT_MS = 3000;

export const MESSAGE_KINDS = {
  JOIN: "join",
  MESSAGE: "message",
  LEAVE: "leave",
  SYSTEM: "system",
};

export const ACTOR_TYPES = new Set(["agent", "human", "system"]);

export const WORKFLOW_STATUS = {
  RUNNING: "running",
  DONE: "done",
  FAILED: "failed",
};

export function nowMs() {
  return Date.now();
}

export function createId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${randomPart}`;
}
