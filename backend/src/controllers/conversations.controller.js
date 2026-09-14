const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const Conversation = require("../models/Conversation");
const {
  createOrGetDirectConversation,
  createGroupConversation,
  ensureParticipant,
  ensureAdmin,
  getConversationMessages
} = require("../services/conversation.service");

const listConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    "participants.user": req.user._id
  })
    .sort({ updatedAt: -1 })
    .populate("participants.user", "displayName username avatarUrl email isOnline lastSeenAt statusMessage")
    .populate("createdBy", "displayName username avatarUrl");

  res.json({
    success: true,
    data: conversations
  });
});

const createDirectConversation = asyncHandler(async (req, res) => {
  const targetUserId = req.body?.targetUserId;
  if (!targetUserId) throw new HttpError(400, "targetUserId is required");

  const conversation = await createOrGetDirectConversation(req.user._id, targetUserId);

  res.status(201).json({
    success: true,
    data: conversation
  });
});

const createGroup = asyncHandler(async (req, res) => {
  const { title, participantIds = [], description = "" } = req.body || {};
  const conversation = await createGroupConversation(req.user._id, title, participantIds, description);

  res.status(201).json({
    success: true,
    data: conversation
  });
});

const getConversation = asyncHandler(async (req, res) => {
  const conversation = await ensureParticipant(req.params.conversationId, req.user._id);

  const populated = await Conversation.findById(conversation._id)
    .populate("participants.user", "displayName username avatarUrl email isOnline lastSeenAt statusMessage")
    .populate("createdBy", "displayName username avatarUrl");

  res.json({
    success: true,
    data: populated
  });
});

const updateConversation = asyncHandler(async (req, res) => {
  const conversation = await ensureAdmin(req.params.conversationId, req.user._id);

  if (conversation.type !== "group") {
    throw new HttpError(400, "Only group conversations can be updated");
  }

  const payload = req.body || {};
  if (typeof payload.title === "string") conversation.title = payload.title.trim();
  if (typeof payload.description === "string") conversation.description = payload.description.trim();
  if (typeof payload.avatarUrl === "string") conversation.avatarUrl = payload.avatarUrl.trim();

  await conversation.save();
  await conversation.populate("participants.user", "displayName username avatarUrl email isOnline lastSeenAt statusMessage");

  res.json({
    success: true,
    message: "Conversation updated",
    data: conversation
  });
});

const addParticipants = asyncHandler(async (req, res) => {
  const conversation = await ensureAdmin(req.params.conversationId, req.user._id);
  if (conversation.type !== "group") throw new HttpError(400, "Only group conversations support adding participants");

  const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds.map(String) : [];
  if (!userIds.length) throw new HttpError(400, "userIds are required");

  const existingIds = new Set(conversation.participants.map((item) => String(item.user)));
  userIds.forEach((userId) => {
    if (!existingIds.has(userId)) {
      conversation.participants.push({ user: userId, role: "member" });
    }
  });

  await conversation.save();
  await conversation.populate("participants.user", "displayName username avatarUrl email isOnline lastSeenAt statusMessage");

  res.json({
    success: true,
    data: conversation
  });
});

const removeParticipant = asyncHandler(async (req, res) => {
  const conversation = await ensureAdmin(req.params.conversationId, req.user._id);
  if (conversation.type !== "group") throw new HttpError(400, "Only group conversations support removing participants");

  const userId = req.params.userId;
  conversation.participants = conversation.participants.filter((item) => String(item.user) !== String(userId));

  if (conversation.participants.length < 2) {
    throw new HttpError(400, "Conversation must keep at least 2 participants");
  }

  await conversation.save();
  await conversation.populate("participants.user", "displayName username avatarUrl email isOnline lastSeenAt statusMessage");

  res.json({
    success: true,
    data: conversation
  });
});

const setAdminRole = asyncHandler(async (req, res) => {
  const conversation = await ensureAdmin(req.params.conversationId, req.user._id);
  if (conversation.type !== "group") throw new HttpError(400, "Only group conversations support admin roles");

  const { userId, makeAdmin } = req.body || {};
  if (!userId) throw new HttpError(400, "userId is required");

  const participant = conversation.participants.find((item) => String(item.user) === String(userId));
  if (!participant) throw new HttpError(404, "Participant not found");

  participant.role = makeAdmin ? "admin" : "member";
  await conversation.save();
  await conversation.populate("participants.user", "displayName username avatarUrl email isOnline lastSeenAt statusMessage");

  res.json({
    success: true,
    data: conversation
  });
});

const getMessages = asyncHandler(async (req, res) => {
  const messages = await getConversationMessages(req.params.conversationId, req.user._id, {
    limit: req.query.limit,
    before: req.query.before
  });

  res.json({
    success: true,
    data: messages
  });
});

module.exports = {
  listConversations,
  createDirectConversation,
  createGroup,
  getConversation,
  updateConversation,
  addParticipants,
  removeParticipant,
  setAdminRole,
  getMessages
};
