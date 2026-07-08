const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { protect } = require("../middlewares/auth");
const controller = require("../controllers/uploads.controller");
const env = require("../config/env");

const router = express.Router();

function ensureDir(subDir) {
  const fullPath = path.join(env.absoluteUploadsDir, subDir);
  fs.mkdirSync(fullPath, { recursive: true });
  return fullPath;
}

function createStorage(subDir) {
  return multer.diskStorage({
    destination(req, file, cb) {
      cb(null, ensureDir(subDir));
    },
    filename(req, file, cb) {
      const safeOriginal = (file.originalname || "file")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");
      cb(null, `${Date.now()}-${safeOriginal}`);
    }
  });
}

function mediaFilter(req, file, cb) {
  const allowed = [
    "image/",
    "video/",
    "audio/",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "application/zip"
  ];

  if (allowed.some((prefix) => file.mimetype.startsWith(prefix))) {
    return cb(null, true);
  }

  return cb(new Error("Unsupported file type"));
}

function voiceFilter(req, file, cb) {
  if (file.mimetype.startsWith("audio/")) return cb(null, true);
  return cb(new Error("Voice note must be an audio file"));
}

const mediaUpload = multer({
  storage: createStorage("media"),
  fileFilter: mediaFilter,
  limits: { fileSize: env.maxUploadBytes }
});

const voiceUpload = multer({
  storage: createStorage("voice_notes"),
  fileFilter: voiceFilter,
  limits: { fileSize: env.maxVoiceNoteBytes }
});

router.use(protect);

router.post("/media", mediaUpload.single("media"), controller.uploadMedia);
router.post("/voice-note", voiceUpload.single("voiceNote"), controller.uploadVoiceNote);

module.exports = router;
