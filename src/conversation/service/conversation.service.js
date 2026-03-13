import { ACTOR_TYPES, MESSAGE_KINDS } from "../contracts.js";
import { withTransaction } from "../db.js";
import {
  createConversation,
  getConversationById,
  listConversations,
  touchConversation,
} from "../repo/conversations.repo.js";
import { insertMessage, insertMessageMentions } from "../repo/messages.repo.js";
import {
  listParticipants,
  setParticipantLeft,
  upsertParticipantActive,
} from "../repo/participants.repo.js";
import { collectToolMentions } from "./mentions.service.js";

function ensureActorType(actorType) {
  if (!ACTOR_TYPES.has(actorType)) {
    throw new Error(
      `Invalid actor type: ${actorType}. Expected one of: ${Array.from(ACTOR_TYPES).join(", ")}`,
    );
  }
}

function requireConversation(db, conversationId) {
  const conversation = getConversationById(db, conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }
  return conversation;
}

export function createConversationService(db, { title, createdBy, createdByType }) {
  ensureActorType(createdByType);

  return withTransaction(db, () => {
    const conversation = createConversation(db, {
      title,
      createdBy,
      metadata: { source: "cli" },
    });

    upsertParticipantActive(db, {
      conversationId: conversation.id,
      actorId: createdBy,
      actorType: createdByType,
      role: "owner",
    });

    insertMessage(db, {
      conversationId: conversation.id,
      kind: MESSAGE_KINDS.JOIN,
      actorId: createdBy,
      actorType: createdByType,
      body: null,
      metadata: { role: "owner" },
    });

    touchConversation(db, conversation.id);
    return conversation;
  });
}

export function joinConversationService(db, {
  conversationId,
  actorId,
  actorType,
  role,
}) {
  ensureActorType(actorType);

  return withTransaction(db, () => {
    requireConversation(db, conversationId);

    upsertParticipantActive(db, {
      conversationId,
      actorId,
      actorType,
      role,
    });

    const messageId = insertMessage(db, {
      conversationId,
      kind: MESSAGE_KINDS.JOIN,
      actorId,
      actorType,
      body: null,
      metadata: { role },
    });

    touchConversation(db, conversationId);
    return messageId;
  });
}

export function sendConversationMessageService(db, {
  conversationId,
  actorId,
  actorType,
  messageText,
  mentionCsv,
  metadata,
}) {
  ensureActorType(actorType);

  return withTransaction(db, () => {
    requireConversation(db, conversationId);

    const tools = collectToolMentions({
      messageText,
      mentionCsv,
    });

    const messageId = insertMessage(db, {
      conversationId,
      kind: MESSAGE_KINDS.MESSAGE,
      actorId,
      actorType,
      body: messageText,
      metadata,
    });

    insertMessageMentions(db, messageId, tools);
    touchConversation(db, conversationId);

    return { messageId, tools };
  });
}

export function leaveConversationService(db, { conversationId, actorId, actorType }) {
  ensureActorType(actorType);

  return withTransaction(db, () => {
    requireConversation(db, conversationId);

    const changed = setParticipantLeft(db, {
      conversationId,
      actorId,
      actorType,
    });

    if (!changed) {
      throw new Error(`Participant not found in conversation: ${actorId} (${actorType})`);
    }

    const messageId = insertMessage(db, {
      conversationId,
      kind: MESSAGE_KINDS.LEAVE,
      actorId,
      actorType,
      body: null,
      metadata: null,
    });

    touchConversation(db, conversationId);
    return messageId;
  });
}

export function listParticipantsService(db, { conversationId, activeOnly }) {
  requireConversation(db, conversationId);
  return listParticipants(db, { conversationId, activeOnly });
}

export function listConversationsService(db, { activeOnly = false } = {}) {
  return listConversations(db, { activeOnly });
}
