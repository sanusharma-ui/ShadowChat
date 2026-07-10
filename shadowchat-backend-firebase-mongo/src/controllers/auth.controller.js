const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const { getAuth } = require("../config/firebase");
const {
  sendMail,
  generateEmailVerificationLink,
  generatePasswordResetLink
} = require("../services/auth.service");

const createSession = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: "Firebase token verified",
    data: {
      firebase: {
        uid: req.firebaseUser.uid,
        email: req.firebaseUser.email || "",
        emailVerified: Boolean(req.firebaseUser.email_verified),
        provider: req.firebaseUser.firebase?.sign_in_provider || "custom"
      },
      user: req.user
    }
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

const logout = asyncHandler(async (req, res) => {
  await getAuth().revokeRefreshTokens(req.firebaseUser.uid);

  res.json({
    success: true,
    message: "All refresh tokens revoked. Client should sign out and refresh token state."
  });
});

const sendVerificationEmail = asyncHandler(async (req, res) => {
  if (!req.user.email) throw new HttpError(400, "Current user has no email");
  if (req.user.emailVerified) {
    return res.json({
      success: true,
      message: "Email is already verified"
    });
  }

  const continueUrl = req.body?.continueUrl;
  const link = await generateEmailVerificationLink(req.user.email, continueUrl);

  const result = await sendMail({
    to: req.user.email,
    subject: "Your ShadowChat account was created",
    text: `Your ShadowChat account has been created. Verify your email: ${link}`,
    html: `<p>Your ShadowChat account has been created.</p><p>Verify your email by clicking the link below:</p><p><a href="${link}">${link}</a></p>`
  });

  res.json({
    success: true,
    message: result.sent ? "Verification email sent" : "Verification link generated",
    data: result.sent ? { transport: result.transport } : { verificationLink: link }
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) throw new HttpError(400, "Email is required");

  const continueUrl = req.body?.continueUrl;
  const link = await generatePasswordResetLink(email, continueUrl);

  const result = await sendMail({
    to: email,
    subject: "Reset your ShadowChat password",
    text: `Reset your password: ${link}`,
    html: `<p>Reset your ShadowChat password using the link below:</p><p><a href="${link}">${link}</a></p>`
  });

  res.json({
    success: true,
    message: result.sent ? "Password reset email sent" : "Password reset link generated",
    data: result.sent
      ? { mailSent: true, transport: result.transport }
      : { mailSent: false, transport: result.transport, resetLink: link }
  });
});

module.exports = {
  createSession,
  me,
  logout,
  sendVerificationEmail,
  forgotPassword
};


