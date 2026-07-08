const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const HttpError = require("../utils/httpError");
const {
  ensureParticipant,
  updateLastMessage,
  touchParticipantRead
} = require("./conversation.service");

function idEquals(a, b) {
  return String(a) === String(b);
}

async function populateMessage(messageId) {
  return Message.findById(messageId)
    .populate("sender", "displayName username avatarUrl")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "displayName username avatarUrl" }
    })
    .lean();
}

async function createMessage({
  conversationId,
  senderId,
  type = "text",
  text = "",
  attachments = [],
  replyToId = null,
  meta = {}
}) {
  const conversation = await ensureParticipant(conversationId, senderId);

  const cleanText = String(text || "").trim();
  if (!cleanText && !attachments.length && type === "text") {
    throw new HttpError(400, "Message text cannot be empty");
  }

  if (replyToId) {
    const replyMessage = await Message.findById(replyToId).select("_id conversation");
    if (!replyMessage) throw new HttpError(404, "Reply target message not found");
    if (!idEquals(replyMessage.conversation, conversationId)) {
      throw new HttpError(400, "Reply target must belong to the same conversation");
    }
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    type,
    text: cleanText,
    attachments,
    replyTo: replyToId,
    seenBy: [{ user: senderId, seenAt: new Date() }],
    meta
  });

  await updateLastMessage(conversationId, message);
  await touchParticipantRead(conversationId, senderId, message._id);

  return populateMessage(message._id);
}

async function editMessage({ messageId, userId, text }) {
  const message = await Message.findById(messageId);
  if (!message) throw new HttpError(404, "Message not found");
  if (!idEquals(message.sender, userId)) throw new HttpError(403, "Only sender can edit this message");
  if (message.deletedForEveryone) throw new HttpError(400, "Deleted message cannot be edited");

  const cleanText = String(text || "").trim();
  if (!cleanText) throw new HttpError(400, "Edited text cannot be empty");

  message.text = cleanText;
  message.editedAt = new Date();
  await message.save();

  await updateLastMessage(message.conversation, message);
  return populateMessage(message._id);
}

async function deleteMessage({ messageId, userId }) {
  const message = await Message.findById(messageId);
  if (!message) throw new HttpError(404, "Message not found");
  if (!idEquals(message.sender, userId)) throw new HttpError(403, "Only sender can delete this message");

  message.text = "";
  message.attachments = [];
  message.deletedForEveryone = true;
  message.deletedAt = new Date();
  await message.save();

  await updateLastMessage(message.conversation, message);
  return populateMessage(message._id);
}

async function toggleReaction({ messageId, userId, emoji }) {
  if (!emoji || typeof emoji !== "string") {
    throw new HttpError(400, "Emoji is required");
  }

  const message = await Message.findById(messageId);
  if (!message) throw new HttpError(404, "Message not found");

  await ensureParticipant(message.conversation, userId);

  message.reactions = (message.reactions || []).map((reaction) => ({
    emoji: reaction.emoji,
    users: (reaction.users || []).filter((existingUserId) => !idEquals(existingUserId, userId))
  })).filter((reaction) => reaction.users.length > 0);

  const existing = message.reactions.find((reaction) => reaction.emoji === emoji);
  if (existing) {
    existing.users.push(userId);
  } else {
    message.reactions.push({ emoji, users: [userId] });
  }

  await message.save();
  return populateMessage(message._id);
}

async function markConversationSeen({ conversationId, userId, messageId = null }) {
  await ensureParticipant(conversationId, userId);

  const targetQuery = { conversation: conversationId };
  if (messageId) {
    const pivot = await Message.findById(messageId).select("createdAt conversation");
    if (!pivot) throw new HttpError(404, "Target message not found");
    if (!idEquals(pivot.conversation, conversationId)) {
      throw new HttpError(400, "Target message is not from the requested conversation");
    }
    targetQuery.createdAt = { $lte: pivot.createdAt };
  }

  targetQuery["seenBy.user"] = { $ne: userId };

  const updateResult = await Message.updateMany(targetQuery, {
    $push: {
      seenBy: { user: userId, seenAt: new Date() }
    }
  });

  await touchParticipantRead(conversationId, userId, messageId);
  return {
    modifiedCount: updateResult.modifiedCount || 0
  };
}

async function searchMessages({ conversationId, userId, query, limit = 20 }) {
  if (!query || !query.trim()) throw new HttpError(400, "Search query is required");
  await ensureParticipant(conversationId, userId);

  return Message.find({
    conversation: conversationId,
    deletedForEveryone: false,
    $text: { $search: query.trim() }
  })
    .sort({ score: { $meta: "textScore" }, createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 20, 1), 50))
    .populate("sender", "displayName username avatarUrl")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "displayName username avatarUrl" }
    });
}

module.exports = {
  createMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  markConversationSeen,
  searchMessages
};
