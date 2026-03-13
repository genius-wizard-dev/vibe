import { nowMs } from "../contracts.js";

export function getReadCursor(db, { conversationId, actorId, actorType }) {
  return (
    db
      .prepare(
        `
      SELECT conversation_id, actor_id, actor_type, last_read_message_id, updated_at
      FROM read_cursors
      WHERE conversation_id = ? AND actor_id = ? AND actor_type = ?
    `,
      )
      .get(conversationId, actorId, actorType) || null
  );
}

export function upsertReadCursor(db, {
  conversationId,
  actorId,
  actorType,
  lastReadMessageId,
}) {
  db.prepare(
    `
      INSERT INTO read_cursors (
        conversation_id,
        actor_id,
        actor_type,
        last_read_message_id,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(conversation_id, actor_id, actor_type)
      DO UPDATE SET
        last_read_message_id = CASE
          WHEN excluded.last_read_message_id > read_cursors.last_read_message_id
            THEN excluded.last_read_message_id
          ELSE read_cursors.last_read_message_id
        END,
        updated_at = excluded.updated_at
    `,
  ).run(conversationId, actorId, actorType, lastReadMessageId, nowMs());
}
