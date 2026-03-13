import { createId, nowMs } from "../contracts.js";

export function createConversation(db, { title, createdBy, metadata }) {
  const id = createId("conv");
  const timestamp = nowMs();

  db.prepare(
    `
      INSERT INTO conversations (
        id, title, created_by, status, metadata_json, created_at, updated_at
      ) VALUES (?, ?, ?, 'active', ?, ?, ?)
    `,
  ).run(id, title, createdBy, metadata ? JSON.stringify(metadata) : null, timestamp, timestamp);

  return getConversationById(db, id);
}

export function getConversationById(db, conversationId) {
  return (
    db
      .prepare(
        `
      SELECT id, title, created_by, status, metadata_json, created_at, updated_at
      FROM conversations
      WHERE id = ?
    `,
      )
      .get(conversationId) || null
  );
}

export function touchConversation(db, conversationId) {
  db.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(
    nowMs(),
    conversationId,
  );
}

export function listConversations(db, { activeOnly = false } = {}) {
  const activeClause = activeOnly
    ? "WHERE COALESCE(ps.active_count, 0) > 0 OR COALESCE(wf.running_count, 0) > 0"
    : "";

  return db
    .prepare(
      `
      SELECT
        c.id,
        c.title,
        c.created_by,
        c.status,
        c.created_at,
        c.updated_at,
        COALESCE(ps.active_count, 0) AS active_participants,
        COALESCE(msg.last_message_id, 0) AS last_message_id,
        COALESCE(msg.last_message_at, c.updated_at) AS last_message_at,
        COALESCE(wf.running_count, 0) AS running_workflows
      FROM conversations c
      LEFT JOIN (
        SELECT conversation_id, COUNT(*) AS active_count
        FROM participant_state
        WHERE is_active = 1
        GROUP BY conversation_id
      ) ps ON ps.conversation_id = c.id
      LEFT JOIN (
        SELECT conversation_id, MAX(id) AS last_message_id, MAX(created_at) AS last_message_at
        FROM messages
        GROUP BY conversation_id
      ) msg ON msg.conversation_id = c.id
      LEFT JOIN (
        SELECT
          conversation_id,
          SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) AS running_count
        FROM workflow_runs
        GROUP BY conversation_id
      ) wf ON wf.conversation_id = c.id
      ${activeClause}
      ORDER BY c.updated_at DESC
    `,
    )
    .all();
}
