const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true
    },
    phoneNumber: {
      type: String,
      trim: true,
      sparse: true
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true
    },
    displayName: {
      type: String,
      trim: true,
      default: ""
    },
    avatarUrl: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      default: ""
    },
    statusMessage: {
      type: String,
      default: "Hey there! I am using ShadowChat."
    },
    providers: {
      type: [String],
      default: []
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    profileCompleted: {
      type: Boolean,
      default: false
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeenAt: {
      type: Date,
      default: null
    },
    settings: {
      readReceipts: { type: Boolean, default: true },
      typingIndicators: { type: Boolean, default: true },
      discoverable: { type: Boolean, default: true }
    },
    metadata: {
      lastLoginAt: { type: Date, default: null },
      lastProvider: { type: String, default: "" }
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ displayName: "text", username: "text", email: "text" });

module.exports = model("User", userSchema);
