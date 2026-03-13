import { ACTOR_TYPES } from "../contracts.js";
import { withTransaction } from "../db.js";
import { getConversationById } from "../repo/conversations.repo.js";
import { getReadCursor, upsertReadCursor } from "../repo/cursors.repo.js";
import { listMessagesAfter } from "../repo/messages.repo.js";

function requireConversation(db, conversationId) {
  const conversation = getConversationById(db, conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }
}

function parseMentions(mentionsCsv) {
  if (!mentionsCsv) return [];
  return mentionsCsv.split(",").filter(Boolean);
}

function ensureActorType(actorType) {
  if (!ACTOR_TYPES.has(actorType)) {
    throw new Error(
      `Invalid actor type: ${actorType}. Expected one of: ${Array.from(ACTOR_TYPES).join(", ")}`,
    );
  }
}

export function listUnreadMessagesService(db, {
  conversationId,
  actorId,
  actorType = "agent",
  limit,
}) {
  requireConversation(db, conversationId);
  ensureActorType(actorType);

  const cursor = getReadCursor(db, { conversationId, actorId, actorType });
  const afterMessageId = cursor ? Number(cursor.last_read_message_id) : 0;

  const rows = listMessagesAfter(db, {
    conversationId,
    afterMessageId,
    limit,
  }).map((row) => ({
    ...row,
    mentions: parseMentions(row.mentions_csv),
  }));

  return {
    afterMessageId,
    messages: rows,
  };
}

export function markReadService(db, {
  conversationId,
  actorId,
  actorType = "agent",
  untilMessageId,
}) {
  requireConversation(db, conversationId);
  ensureActorType(actorType);

  return withTransaction(db, () => {
    upsertReadCursor(db, {
      conversationId,
      actorId,
      actorType,
      lastReadMessageId: untilMessageId,
    });

    const cursor = getReadCursor(db, { conversationId, actorId, actorType });
    return cursor ? Number(cursor.last_read_message_id) : 0;
  });
}
