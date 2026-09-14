const express = require("express");
const { protect } = require("../middlewares/auth");
const controller = require("../controllers/conversations.controller");

const router = express.Router();

router.use(protect);

router.get("/", controller.listConversations);
router.post("/direct", controller.createDirectConversation);
router.post("/group", controller.createGroup);
router.get("/:conversationId", controller.getConversation);
router.patch("/:conversationId", controller.updateConversation);
router.get("/:conversationId/messages", controller.getMessages);
router.post("/:conversationId/participants", controller.addParticipants);
router.delete("/:conversationId/participants/:userId", controller.removeParticipant);
router.post("/:conversationId/admins", controller.setAdminRole);

module.exports = router;
