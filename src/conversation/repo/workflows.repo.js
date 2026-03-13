import { createId, nowMs } from "../contracts.js";

export function createWorkflowRun(db, { conversationId, triggerPrompt, status, currentStep }) {
  const runId = createId("run");
  const timestamp = nowMs();

  db.prepare(
    `
      INSERT INTO workflow_runs (
        run_id, conversation_id, trigger_prompt, status, current_step,
        error_text, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
    `,
  ).run(runId, conversationId, triggerPrompt, status, currentStep, timestamp, timestamp);

  return {
    runId,
    conversationId,
    status,
    currentStep,
    createdAt: timestamp,
  };
}

export function insertWorkflowStep(db, {
  runId,
  stepNo,
  stepName,
  status,
  errorText,
  startedAt,
  endedAt,
}) {
  db.prepare(
    `
      INSERT INTO workflow_steps (
        run_id, step_no, step_name, status, error_text, started_at, ended_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(runId, stepNo, stepName, status, errorText || null, startedAt || null, endedAt || null);
}

export function updateWorkflowRun(db, { runId, status, currentStep, errorText }) {
  db.prepare(
    `
      UPDATE workflow_runs
      SET status = ?, current_step = ?, error_text = ?, updated_at = ?
      WHERE run_id = ?
    `,
  ).run(status, currentStep || null, errorText || null, nowMs(), runId);
}

export function listWorkflowRuns(db, { conversationId }) {
  return db
    .prepare(
      `
      SELECT run_id, conversation_id, status, current_step, error_text, created_at, updated_at
      FROM workflow_runs
      WHERE conversation_id = ?
      ORDER BY updated_at DESC
    `,
    )
    .all(conversationId);
}
