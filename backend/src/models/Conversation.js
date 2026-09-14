const { Schema, model, Types } = require("mongoose");

const participantSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member"
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadMessage: {
      type: Types.ObjectId,
      ref: "Message",
      default: null
    },
    lastReadAt: {
      type: Date,
      default: null
    },
    mutedUntil: {
      type: Date,
      default: null
    },
    archivedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true
    },
    directKey: {
      type: String,
      sparse: true,
      unique: true
    },
    title: {
      type: String,
      trim: true,
      default: ""
    },
    description: {
      type: String,
      default: ""
    },
    avatarUrl: {
      type: String,
      default: ""
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    },
    participants: {
      type: [participantSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 2;
        },
        message: "A conversation must have at least 2 participants."
      }
    },
    lastMessage: {
      message: { type: Types.ObjectId, ref: "Message", default: null },
      sender: { type: Types.ObjectId, ref: "User", default: null },
      type: { type: String, default: "" },
      text: { type: String, default: "" },
      createdAt: { type: Date, default: null }
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ "participants.user": 1, updatedAt: -1 });
conversationSchema.index({ type: 1, directKey: 1 });

module.exports = model("Conversation", conversationSchema);
