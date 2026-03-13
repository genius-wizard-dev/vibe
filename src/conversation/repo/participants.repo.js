import { nowMs } from "../contracts.js";

export function upsertParticipantActive(db, { conversationId, actorId, actorType, role }) {
  const timestamp = nowMs();
  db.prepare(
    `
      INSERT INTO participant_state (
        conversation_id, actor_id, actor_type, role,
        is_active, joined_at, left_at, updated_at
      ) VALUES (?, ?, ?, ?, 1, ?, NULL, ?)
      ON CONFLICT(conversation_id, actor_id, actor_type)
      DO UPDATE SET
        role = excluded.role,
        is_active = 1,
        left_at = NULL,
        updated_at = excluded.updated_at
    `,
  ).run(conversationId, actorId, actorType, role, timestamp, timestamp);
}

export function setParticipantLeft(db, { conversationId, actorId, actorType }) {
  const timestamp = nowMs();
  const result = db
    .prepare(
      `
      UPDATE participant_state
      SET is_active = 0, left_at = ?, updated_at = ?
      WHERE conversation_id = ? AND actor_id = ? AND actor_type = ?
    `,
    )
    .run(timestamp, timestamp, conversationId, actorId, actorType);

  return result.changes;
}

export function listParticipants(db, { conversationId, activeOnly }) {
  const query = activeOnly
    ? `
      SELECT conversation_id, actor_id, actor_type, role, is_active, joined_at, left_at, updated_at
      FROM participant_state
      WHERE conversation_id = ? AND is_active = 1
      ORDER BY updated_at DESC
    `
    : `
      SELECT conversation_id, actor_id, actor_type, role, is_active, joined_at, left_at, updated_at
      FROM participant_state
      WHERE conversation_id = ?
      ORDER BY updated_at DESC
    `;

  return db.prepare(query).all(conversationId);
}
