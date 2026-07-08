const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const User = require("../models/User");
const { generateUniqueUsername } = require("../services/auth.service");

const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select(
    "displayName username avatarUrl bio statusMessage isOnline lastSeenAt emailVerified"
  );

  if (!user) throw new HttpError(404, "User not found");

  res.json({
    success: true,
    data: user
  });
});

const searchUsers = asyncHandler(async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (!query) throw new HttpError(400, "Search query is required");

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { displayName: regex },
      { username: regex },
      { email: regex }
    ]
  })
    .limit(25)
    .select("displayName username avatarUrl email isOnline lastSeenAt statusMessage");

  res.json({
    success: true,
    data: users
  });
});

const updateMe = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const updates = {};

  if (typeof payload.displayName === "string") updates.displayName = payload.displayName.trim();
  if (typeof payload.avatarUrl === "string") updates.avatarUrl = payload.avatarUrl.trim();
  if (typeof payload.bio === "string") updates.bio = payload.bio.trim();
  if (typeof payload.statusMessage === "string") updates.statusMessage = payload.statusMessage.trim();
  if (typeof payload.settings === "object" && payload.settings !== null) {
    updates.settings = {
      ...req.user.settings,
      ...payload.settings
    };
  }

  if (typeof payload.username === "string" && payload.username.trim()) {
    const normalized = payload.username.trim().toLowerCase();
    const taken = await User.findOne({
      username: normalized,
      _id: { $ne: req.user._id }
    }).select("_id");

    if (taken) {
      updates.username = await generateUniqueUsername(normalized);
    } else {
      updates.username = normalized;
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true
  });

  res.json({
    success: true,
    message: "Profile updated",
    data: user
  });
});

module.exports = {
  getMe,
  getUserById,
  searchUsers,
  updateMe
};
