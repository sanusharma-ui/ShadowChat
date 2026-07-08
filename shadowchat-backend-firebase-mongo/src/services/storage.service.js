const fs = require("fs");
const path = require("path");
const env = require("../config/env");

function ensureUploadsDir() {
  if (!fs.existsSync(env.absoluteUploadsDir)) {
    fs.mkdirSync(env.absoluteUploadsDir, { recursive: true });
  }
}

function buildPublicUrl(req, relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  const base = env.appBaseUrl.replace(/\/$/, "");
  return `${base}/${normalized.replace(/^\//, "")}`;
}

function detectMessageType(file) {
  if (!file || !file.mimetype) return "file";
  if (file.mimetype.startsWith("image/")) return "image";
  if (file.mimetype.startsWith("video/")) return "video";
  if (file.mimetype.startsWith("audio/")) return "audio";
  return "file";
}

function toAttachment(req, file) {
  const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, "/");
  const extension = path.extname(file.originalname || "").replace(".", "").toLowerCase();

  return {
    url: buildPublicUrl(req, relativePath),
    storagePath: relativePath,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    extension
  };
}

module.exports = {
  ensureUploadsDir,
  buildPublicUrl,
  detectMessageType,
  toAttachment
};
