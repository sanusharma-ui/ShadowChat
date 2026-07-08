const path = require("path");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const { createMessage } = require("../services/message.service");
const { toAttachment, detectMessageType } = require("../services/storage.service");

const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, "No file uploaded");

  const conversationId = req.body?.conversationId;
  const caption = req.body?.caption || "";
  const replyToId = req.body?.replyToId || null;

  if (!conversationId) throw new HttpError(400, "conversationId is required");

  const attachment = toAttachment(req, req.file);
  const type = detectMessageType(req.file);

  const message = await createMessage({
    conversationId,
    senderId: req.user._id,
    type,
    text: caption,
    attachments: [attachment],
    replyToId
  });

  res.status(201).json({
    success: true,
    data: {
      message
    }
  });
});

const uploadVoiceNote = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, "No voice note uploaded");

  const conversationId = req.body?.conversationId;
  const replyToId = req.body?.replyToId || null;
  if (!conversationId) throw new HttpError(400, "conversationId is required");

  const attachment = toAttachment(req, req.file);

  const message = await createMessage({
    conversationId,
    senderId: req.user._id,
    type: "voice",
    text: "",
    attachments: [attachment],
    replyToId
  });

  res.status(201).json({
    success: true,
    data: {
      message
    }
  });
});

module.exports = {
  uploadMedia,
  uploadVoiceNote
};
