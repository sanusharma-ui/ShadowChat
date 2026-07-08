const express = require("express");
const { protect } = require("../middlewares/auth");
const usersController = require("../controllers/users.controller");

const router = express.Router();

router.use(protect);
router.get("/me", usersController.getMe);
router.patch("/me", usersController.updateMe);
router.get("/search", usersController.searchUsers);
router.get("/:userId", usersController.getUserById);

module.exports = router;
