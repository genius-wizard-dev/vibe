import { getConversationById } from "../repo/conversations.repo.js";
import { listMessageHistory } from "../repo/messages.repo.js";

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

export function listHistoryService(db, {
  conversationId,
  afterMessageId,
  limit,
  actorId,
  kind,
  toolName,
}) {
  requireConversation(db, conversationId);

  const rows = listMessageHistory(db, {
    conversationId,
    afterMessageId,
    limit,
    actorId,
    kind,
    toolName,
  });

  return rows.map((row) => ({
    ...row,
    mentions: parseMentions(row.mentions_csv),
  }));
}
