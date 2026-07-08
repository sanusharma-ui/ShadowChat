const { Schema, model, Types } = require("mongoose");

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    storagePath: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, default: 0 },
    extension: { type: String, default: "" },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    duration: { type: Number, default: null }
  },
  { _id: false }
);

const reactionSchema = new Schema(
  {
    emoji: { type: String, required: true },
    users: [{ type: Types.ObjectId, ref: "User" }]
  },
  { _id: false }
);

const seenSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    seenAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    conversation: {
      type: Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "voice", "file", "system", "call"],
      default: "text"
    },
    text: {
      type: String,
      default: ""
    },
    attachments: {
      type: [attachmentSchema],
      default: []
    },
    replyTo: {
      type: Types.ObjectId,
      ref: "Message",
      default: null
    },
    reactions: {
      type: [reactionSchema],
      default: []
    },
    mentions: [{ type: Types.ObjectId, ref: "User" }],
    seenBy: {
      type: [seenSchema],
      default: []
    },
    editedAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedForEveryone: {
      type: Boolean,
      default: false
    },
    meta: {
      callType: { type: String, default: "" },
      callStatus: { type: String, default: "" },
      durationSeconds: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ text: "text" });

module.exports = model("Message", messageSchema);
