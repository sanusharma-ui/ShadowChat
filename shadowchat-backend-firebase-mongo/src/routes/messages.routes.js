const express = require("express");
const { protect } = require("../middlewares/auth");
const controller = require("../controllers/messages.controller");

const router = express.Router();

router.use(protect);

router.get("/search", controller.search);
router.post("/", controller.sendMessage);
router.patch("/:messageId", controller.updateMessage);
router.delete("/:messageId", controller.removeMessage);
router.post("/:messageId/reactions", controller.reactToMessage);
router.post("/seen", controller.markSeen);

module.exports = router;
