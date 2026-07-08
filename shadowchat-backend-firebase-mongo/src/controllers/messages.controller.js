const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const {
  createMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  markConversationSeen,
  searchMessages
} = require("../services/message.service");

const sendMessage = asyncHandler(async (req, res) => {
  const payload = req.body || {};

  const message = await createMessage({
    conversationId: payload.conversationId,
    senderId: req.user._id,
    type: payload.type || "text",
    text: payload.text || "",
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    replyToId: payload.replyToId || null,
    meta: payload.meta || {}
  });

  res.status(201).json({
    success: true,
    data: message
  });
});

const updateMessage = asyncHandler(async (req, res) => {
  const text = req.body?.text;
  if (typeof text !== "string") throw new HttpError(400, "text is required");

  const message = await editMessage({
    messageId: req.params.messageId,
    userId: req.user._id,
    text
  });

  res.json({
    success: true,
    data: message
  });
});

const removeMessage = asyncHandler(async (req, res) => {
  const message = await deleteMessage({
    messageId: req.params.messageId,
    userId: req.user._id
  });

  res.json({
    success: true,
    data: message
  });
});

const reactToMessage = asyncHandler(async (req, res) => {
  const emoji = String(req.body?.emoji || "").trim();
  if (!emoji) throw new HttpError(400, "emoji is required");

  const message = await toggleReaction({
    messageId: req.params.messageId,
    userId: req.user._id,
    emoji
  });

  res.json({
    success: true,
    data: message
  });
});

const markSeen = asyncHandler(async (req, res) => {
  const { conversationId, messageId } = req.body || {};
  if (!conversationId) throw new HttpError(400, "conversationId is required");

  const result = await markConversationSeen({
    conversationId,
    userId: req.user._id,
    messageId: messageId || null
  });

  res.json({
    success: true,
    data: result
  });
});

const search = asyncHandler(async (req, res) => {
  const conversationId = req.query.conversationId;
  const q = req.query.q;
  if (!conversationId) throw new HttpError(400, "conversationId is required");
  const messages = await searchMessages({
    conversationId,
    userId: req.user._id,
    query: q,
    limit: req.query.limit
  });

  res.json({
    success: true,
    data: messages
  });
});

module.exports = {
  sendMessage,
  updateMessage,
  removeMessage,
  reactToMessage,
  markSeen,
  search
};
