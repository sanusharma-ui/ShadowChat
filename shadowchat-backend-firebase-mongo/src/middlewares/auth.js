const { getAuth } = require("../config/firebase");
const HttpError = require("../utils/httpError");
const { syncUserFromFirebase } = require("../services/auth.service");
const env = require("../config/env");

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7).trim();
  if (req.headers["x-firebase-token"]) return String(req.headers["x-firebase-token"]).trim();
  if (req.body && typeof req.body.idToken === "string") return req.body.idToken.trim();
  return "";
}

async function protect(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) return next(new HttpError(401, "Authentication token is missing"));

  try {
    const decoded = await getAuth().verifyIdToken(token, env.checkRevokedTokens);
    const user = await syncUserFromFirebase(decoded);

    req.idToken = token;
    req.firebaseUser = decoded;
    req.user = user;
    return next();
  } catch (error) {
    return next(new HttpError(401, "Invalid or expired Firebase token", error.message));
  }
}

module.exports = {
  protect,
  extractBearerToken
};
