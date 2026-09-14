const path = require("path");
require("dotenv").config();

function csv(value = "") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return String(value).toLowerCase() === "true";
}

function toInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toInt(process.env.PORT, 3000),
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  clientOrigins: csv(process.env.CLIENT_ORIGINS || "http://localhost:5173,http://localhost:3000"),
  mongoUri: process.env.MONGODB_URI || "",
  uploadsDir: process.env.UPLOADS_DIR || "uploads",
  maxUploadBytes: toInt(process.env.MAX_UPLOAD_MB, 25) * 1024 * 1024,
  maxVoiceNoteBytes: toInt(process.env.MAX_VOICE_NOTE_MB, 15) * 1024 * 1024,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  firebasePrivateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  checkRevokedTokens: toBool(process.env.FIREBASE_CHECK_REVOKED, false),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: toInt(process.env.SMTP_PORT, 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "ShadowChat <no-reply@example.com>"
  }
};

env.absoluteUploadsDir = path.resolve(process.cwd(), env.uploadsDir);

module.exports = env;
