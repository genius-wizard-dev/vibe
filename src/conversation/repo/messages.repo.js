import { nowMs } from "../contracts.js";

export function insertMessage(db, {
  conversationId,
  kind,
  actorId,
  actorType,
  body,
  metadata,
}) {
  const result = db
    .prepare(
      `
      INSERT INTO messages (
        conversation_id, kind, actor_id, actor_type, body, metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      conversationId,
      kind,
      actorId,
      actorType,
      body || null,
      metadata ? JSON.stringify(metadata) : null,
      nowMs(),
    );

  return Number(result.lastInsertRowid);
}

export function insertMessageMentions(db, messageId, tools) {
  if (!tools || tools.length === 0) return;

  const stmt = db.prepare(
    `
      INSERT OR IGNORE INTO message_mentions (message_id, tool_name, mention_type)
      VALUES (?, ?, 'tool')
    `,
  );

  for (const toolName of tools) {
    stmt.run(messageId, toolName);
  }
}

export function listMessagesAfter(db, { conversationId, afterMessageId, limit }) {
  return db
    .prepare(
      `
      SELECT
        m.id,
        m.conversation_id,
        m.kind,
        m.actor_id,
        m.actor_type,
        m.body,
        m.metadata_json,
        m.created_at,
        COALESCE(GROUP_CONCAT(mm.tool_name, ','), '') AS mentions_csv
      FROM messages m
      LEFT JOIN message_mentions mm ON mm.message_id = m.id
      WHERE m.conversation_id = ? AND m.id > ?
      GROUP BY m.id
      ORDER BY m.id ASC
      LIMIT ?
    `,
    )
    .all(conversationId, afterMessageId, limit);
}

export function listMessageHistory(db, {
  conversationId,
  afterMessageId,
  limit,
  actorId,
  kind,
  toolName,
}) {
  const actorFilter = actorId || null;
  const kindFilter = kind || null;
  const toolFilter = toolName || null;

  return db
    .prepare(
      `
      SELECT
        m.id,
        m.conversation_id,
        m.kind,
        m.actor_id,
        m.actor_type,
        m.body,
        m.metadata_json,
        m.created_at,
        COALESCE(GROUP_CONCAT(mm.tool_name, ','), '') AS mentions_csv
      FROM messages m
      LEFT JOIN message_mentions mm ON mm.message_id = m.id
      WHERE m.conversation_id = ?
        AND m.id > ?
        AND (? IS NULL OR m.actor_id = ?)
        AND (? IS NULL OR m.kind = ?)
        AND (
          ? IS NULL OR EXISTS (
            SELECT 1
            FROM message_mentions mx
            WHERE mx.message_id = m.id AND mx.tool_name = ?
          )
        )
      GROUP BY m.id
      ORDER BY m.id ASC
      LIMIT ?
    `,
    )
    .all(
      conversationId,
      afterMessageId,
      actorFilter,
      actorFilter,
      kindFilter,
      kindFilter,
      toolFilter,
      toolFilter,
      limit,
    );
}
