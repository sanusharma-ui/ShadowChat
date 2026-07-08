const nodemailer = require("nodemailer");
const User = require("../models/User");
const env = require("../config/env");
const { getAuth } = require("../config/firebase");

function sanitizeUsername(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

async function generateUniqueUsername(seed) {
  let base = sanitizeUsername(seed);
  if (!base) base = `user_${Date.now().toString().slice(-6)}`;

  let candidate = base;
  let suffix = 0;

  while (true) {
    const exists = await User.exists({ username: candidate });
    if (!exists) return candidate;
    suffix += 1;
    candidate = `${base}_${suffix}`.slice(0, 24);
  }
}

function extractProviders(decodedToken) {
  const provider = decodedToken.firebase?.sign_in_provider || "custom";
  const providers = new Set([provider]);
  if (Array.isArray(decodedToken.firebase?.identities?.["google.com"])) providers.add("google.com");
  if (Array.isArray(decodedToken.firebase?.identities?.email)) providers.add("password");
  if (decodedToken.phone_number) providers.add("phone");
  return Array.from(providers);
}

async function syncUserFromFirebase(decodedToken) {
  const providers = extractProviders(decodedToken);
  const email = decodedToken.email ? String(decodedToken.email).toLowerCase() : undefined;
  const provider = decodedToken.firebase?.sign_in_provider || "custom";

  let user = await User.findOne({ firebaseUid: decodedToken.uid });

  if (!user && email) {
    user = await User.findOne({ email });
  }

  if (!user) {
    const seed = decodedToken.name || email?.split("@")[0] || decodedToken.phone_number || decodedToken.uid.slice(0, 8);
    const username = await generateUniqueUsername(seed);

    user = await User.create({
      firebaseUid: decodedToken.uid,
      email,
      phoneNumber: decodedToken.phone_number || "",
      username,
      displayName: decodedToken.name || username,
      avatarUrl: decodedToken.picture || "",
      providers,
      emailVerified: Boolean(decodedToken.email_verified),
      metadata: {
        lastLoginAt: new Date(),
        lastProvider: provider
      },
      profileCompleted: true
    });

    return user;
  }

  user.firebaseUid = decodedToken.uid;
  if (email) user.email = email;
  if (decodedToken.phone_number) user.phoneNumber = decodedToken.phone_number;
  if (decodedToken.name && (!user.displayName || user.displayName.startsWith("user_"))) {
    user.displayName = decodedToken.name;
  }
  if (decodedToken.picture) user.avatarUrl = decodedToken.picture;
  user.emailVerified = Boolean(decodedToken.email_verified);
  user.providers = Array.from(new Set([...(user.providers || []), ...providers]));
  user.metadata = {
    ...(user.metadata || {}),
    lastLoginAt: new Date(),
    lastProvider: provider
  };
  if (!user.username) {
    const seed = decodedToken.name || email?.split("@")[0] || decodedToken.uid.slice(0, 8);
    user.username = await generateUniqueUsername(seed);
  }
  user.profileCompleted = Boolean(user.username && user.displayName);
  await user.save();
  return user;
}

function getTransporter() {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) return null;
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass
    }
  });
}

async function sendMail({ to, subject, html, text }) {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      sent: false,
      transport: "disabled"
    };
  }

  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    text,
    html
  });

  return {
    sent: true,
    transport: "smtp",
    messageId: info.messageId
  };
}

function buildActionSettings(continueUrl) {
  return {
    url: continueUrl || `${env.frontendUrl.replace(/\/$/, "")}/auth/action`,
    handleCodeInApp: false
  };
}

async function generateEmailVerificationLink(email, continueUrl) {
  return getAuth().generateEmailVerificationLink(email, buildActionSettings(continueUrl));
}

async function generatePasswordResetLink(email, continueUrl) {
  return getAuth().generatePasswordResetLink(email, buildActionSettings(continueUrl));
}

module.exports = {
  syncUserFromFirebase,
  generateUniqueUsername,
  sendMail,
  generateEmailVerificationLink,
  generatePasswordResetLink
};
