const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const HttpError = require("../utils/httpError");

function toIdString(value) {
  return String(value);
}

function buildDirectKey(userA, userB) {
  return [toIdString(userA), toIdString(userB)].sort().join(":");
}

async function ensureParticipant(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new HttpError(404, "Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    (participant) => toIdString(participant.user) === toIdString(userId)
  );

  if (!isParticipant) {
    throw new HttpError(403, "You are not a participant in this conversation");
  }

  return conversation;
}

async function ensureAdmin(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new HttpError(404, "Conversation not found");

  const participant = conversation.participants.find(
    (item) => toIdString(item.user) === toIdString(userId)
  );

  if (!participant) throw new HttpError(403, "You are not a participant in this conversation");
  if (participant.role !== "admin") throw new HttpError(403, "Admin permission required");

  return conversation;
}

async function createOrGetDirectConversation(currentUserId, targetUserId) {
  if (toIdString(currentUserId) === toIdString(targetUserId)) {
    throw new HttpError(400, "You cannot start a direct conversation with yourself");
  }

  const directKey = buildDirectKey(currentUserId, targetUserId);

  let conversation = await Conversation.findOne({ type: "direct", directKey })
    .populate("participants.user", "displayName username avatarUrl email isOnline lastSeenAt statusMessage")
    .populate("createdBy", "displayName username avatarUrl");

  if (conversation) return conversation;

  conversation = await Conversation.create({
    type: "direct",
    directKey,
    createdBy: currentUserId,
    participants: [
      { user: currentUserId, role: "member", lastReadAt: new Date() },
      { user: targetUserId, role: "member" }
    ]
  });

  return Conversation.findById(conversation._id)
    .populate("participants.user", "displayName username avatarUrl email isOnline lastSeenAt statusMessage")
    .populate("createdBy", "displayName username avatarUrl");
}

async function createGroupConversation(currentUserId, title, participantIds = [], description = "") {
  const uniqueIds = Array.from(new Set([toIdString(currentUserId), ...participantIds.map(toIdString)]));

  if (uniqueIds.length < 3) {
    throw new HttpError(400, "A group conversation must contain at least 3 users including you");
  }

  if (!title || !title.trim()) {
    throw new HttpError(400, "Group title is required");
  }

  const participants = uniqueIds.map((userId) => ({
    user: userId,
    role: toIdString(userId) === toIdString(currentUserId) ? "admin" : "member",
    lastReadAt: toIdString(userId) === toIdString(currentUserId) ? new Date() : null
  }));

  const conversation = await Conversation.create({
    type: "group",
    title: title.trim(),
    description,
    createdBy: currentUserId,
    participants
  });

  return Conversation.findById(conversation._id)
    .populate("participants.user", "displayName username avatarUrl email isOnline lastSeenAt statusMessage")
    .populate("createdBy", "displayName username avatarUrl");
}

async function updateLastMessage(conversationId, message) {
  await Conversation.findByIdAndUpdate(conversationId, {
    $set: {
      "lastMessage.message": message._id,
      "lastMessage.sender": message.sender,
      "lastMessage.type": message.type,
      "lastMessage.text": message.deletedForEveryone
        ? "This message was deleted"
        : message.text || (message.attachments?.length ? `[${message.type}]` : `[${message.type}]`),
      "lastMessage.createdAt": message.createdAt,
      updatedAt: new Date()
    }
  });
}

async function touchParticipantRead(conversationId, userId, messageId = null) {
  const update = {
    "participants.$.lastReadAt": new Date()
  };
  if (messageId) update["participants.$.lastReadMessage"] = messageId;

  await Conversation.updateOne(
    { _id: conversationId, "participants.user": userId },
    { $set: update }
  );
}

async function getConversationParticipants(conversationId) {
  const conversation = await Conversation.findById(conversationId).select("participants.user");
  if (!conversation) throw new HttpError(404, "Conversation not found");
  return conversation.participants.map((item) => String(item.user));
}

async function getConversationMessages(conversationId, userId, { limit = 30, before } = {}) {
  await ensureParticipant(conversationId, userId);

  const query = { conversation: conversationId };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 30, 1), 100))
    .populate("sender", "displayName username avatarUrl")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "displayName username avatarUrl" }
    });

  return messages.reverse();
}

module.exports = {
  buildDirectKey,
  ensureParticipant,
  ensureAdmin,
  createOrGetDirectConversation,
  createGroupConversation,
  updateLastMessage,
  touchParticipantRead,
  getConversationParticipants,
  getConversationMessages
};
