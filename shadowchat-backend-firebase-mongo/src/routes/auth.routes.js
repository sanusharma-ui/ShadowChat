const express = require("express");
const { protect } = require("../middlewares/auth");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/session", protect, authController.createSession);
router.get("/me", protect, authController.me);
router.post("/logout", protect, authController.logout);
router.post("/send-verification-email", protect, authController.sendVerificationEmail);
router.post("/forgot-password", authController.forgotPassword);

module.exports = router;
