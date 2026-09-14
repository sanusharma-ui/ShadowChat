const express = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./users.routes");
const conversationRoutes = require("./conversations.routes");
const messageRoutes = require("./messages.routes");
const uploadRoutes = require("./uploads.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/conversations", conversationRoutes);
router.use("/messages", messageRoutes);
router.use("/uploads", uploadRoutes);

module.exports = router;
