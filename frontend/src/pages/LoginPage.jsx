/**
 * LoginPage — Premium redesign
 *
 * Auth logic completely preserved:
 *   - login({ email, password }) from AuthContext (Firebase email/password)
 *   - loginWithGoogle()          from AuthContext (Firebase popup)
 *   - authBusy                   from AuthContext
 *   - navigate("/app")           on success
 *
 * No new dependencies. No Firebase config touched.
 * CSS scoped to login.css (.lp-* prefix), no index.css collision.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/login.css";

/* ─── SVG Icons (decorative / logo) ─────────────────────────── */

/** ShadowChat logo mark — stylised chat bubble with S */
function LogoMark() {
  return (
    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M10 1C5.03 1 1 4.58 1 9c0 2.28 1.02 4.34 2.68 5.82L3 18.5l4.36-1.8A10.1 10.1 0 0 0 10 17c4.97 0 9-3.58 9-8S14.97 1 10 1Zm0 13a7.9 7.9 0 0 1-3.06-.6l-.22-.09-2.28.94.5-2.22-.16-.18A6.34 6.34 0 0 1 3 9c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7Z"
      />
    </svg>
  );
}

/** Official Google multicolor "G" */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/** Small lock icon for encryption badge */
function LockTinyIcon() {
  return (
    <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M9 5H8V3.5a2 2 0 1 0-4 0V5H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1ZM5 3.5a1 1 0 1 1 2 0V5H5V3.5ZM6 9a.75.75 0 1 1 0-1.5A.75.75 0 0 1 6 9Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Alert circle for error */
function AlertIcon() {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 10.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM7.25 5h1.5v5h-1.5V5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ─── Decorative Chat Visualization ────────────────────────────
   aria-hidden on the entire section — purely decorative.
   Messages are made up example content only.
─────────────────────────────────────────────────────────────── */
function ChatPreview() {
  return (
    <div className="lp-chat-preview" aria-hidden="true">
      {/* Online indicator */}
      <div className="lp-online-badge">
        <div className="lp-online-dot" />
        <span>Alex is online</span>
      </div>

      {/* Received bubble */}
      <div className="lp-bubble lp-bubble--theirs lp-bubble-float-1">
        <div className="lp-bubble-avatar lp-bubble-avatar--a" aria-hidden="true">A</div>
        <div>
          <div className="lp-bubble-body">
            Hey — did you get a chance to review the draft?
          </div>
          <div className="lp-bubble-time">2:14 PM</div>
        </div>
      </div>

      {/* Sent bubble */}
      <div className="lp-bubble lp-bubble--mine lp-bubble-float-2">
        <div>
          <div className="lp-bubble-body">
            Just finished reading it ✓ Looks good to me!
          </div>
          <div className="lp-bubble-time" style={{ textAlign: "right" }}>2:16 PM ✓✓</div>
        </div>
      </div>

      {/* Received bubble */}
      <div className="lp-bubble lp-bubble--theirs lp-bubble-float-3">
        <div className="lp-bubble-avatar lp-bubble-avatar--a" aria-hidden="true">A</div>
        <div>
          <div className="lp-bubble-body">
            Perfect. I&apos;ll send it over now 🎉
          </div>
          <div className="lp-bubble-time">2:17 PM</div>
        </div>
      </div>

      {/* Typing indicator */}
      <div className="lp-typing">
        <div className="lp-bubble-avatar lp-bubble-avatar--b" aria-hidden="true">M</div>
        <div className="lp-typing-body">
          <div className="lp-typing-dot" />
          <div className="lp-typing-dot" />
          <div className="lp-typing-dot" />
        </div>
      </div>

      {/* Encryption note */}
      <div className="lp-enc-badge">
        <LockTinyIcon />
        Messages are end-to-end encrypted
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */

export default function LoginPage() {
  const navigate = useNavigate();
  // ── Auth logic: unchanged from original ──────────────────────
  const { login, loginWithGoogle, authBusy } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  // ── UI-only state (no auth impact) ───────────────────────────
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Preserved exactly — same logic, same navigate target
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(form);
      navigate("/app");
    } catch (err) {
      setError(err.message);
    }
  }

  // Preserved exactly — same logic, same navigate target
  async function handleGoogle() {
    setError("");
    try {
      await loginWithGoogle();
      navigate("/app");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="lp-root">
      {/* ── Ambient background (decorative, hidden from AT) ── */}
      <div className="lp-bg-glows" aria-hidden="true">
        <div className="lp-glow lp-glow--indigo" />
        <div className="lp-glow lp-glow--violet" />
        <div className="lp-glow lp-glow--cyan" />
      </div>

      {/* ── Two-column layout ── */}
      <div className="lp-layout">

        {/* ── LEFT: visual / brand ── */}
        <section className="lp-visual" aria-label="ShadowChat introduction">
          {/* Logo */}
          <div className="lp-logo">
            <div className="lp-logo-mark" aria-hidden="true">
              <LogoMark />
            </div>
            <span className="lp-logo-wordmark">ShadowChat</span>
          </div>

          {/* Headline */}
          <div className="lp-headline">
            <h1>Conversations that stay yours.</h1>
            <p>
              Private messaging, calls and shared moments—protected
              from the moment you send them.
            </p>
          </div>

          {/* Decorative chat visualization */}
          <ChatPreview />

          {/* Trust line */}
          <div className="lp-trust">
            <Shield size={13} aria-hidden="true" style={{ opacity: 0.35 }} />
            <span>End-to-end encrypted</span>
            <div className="lp-trust-dot" aria-hidden="true" />
            <span>Built for private conversations</span>
          </div>
        </section>

        {/* ── RIGHT: auth card ── */}
        <div className="lp-auth-wrap">
          <div className="lp-card">
            <h1 className="lp-heading">Welcome back</h1>
            <p className="lp-subheading">Sign in to continue to ShadowChat</p>

            <form
              className="lp-form"
              onSubmit={handleSubmit}
              noValidate
            >
              {/* Email field */}
              <div className="lp-field">
                <label htmlFor="lp-email" className="lp-label">
                  Email address
                </label>
                <div className="lp-input-wrap">
                  <span className="lp-input-icon" aria-hidden="true">
                    <Mail size={16} />
                  </span>
                  <input
                    id="lp-email"
                    type="email"
                    className="lp-input"
                    placeholder="you@example.com"
                    value={form.email}
                    autoComplete="email"
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                    aria-required="true"
                    aria-describedby={error ? "lp-error-msg" : undefined}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="lp-field">
                <label htmlFor="lp-password" className="lp-label">
                  Password
                </label>
                <div className="lp-input-wrap">
                  <span className="lp-input-icon" aria-hidden="true">
                    <Lock size={16} />
                  </span>
                  <input
                    id="lp-password"
                    type={showPassword ? "text" : "password"}
                    className="lp-input lp-input--pw"
                    placeholder="Your password"
                    value={form.password}
                    autoComplete="current-password"
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    required
                    aria-required="true"
                    aria-describedby={error ? "lp-error-msg" : undefined}
                  />
                  <button
                    type="button"
                    className="lp-pw-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div className="lp-row-meta">
                <label className="lp-remember">
                  <input
                    type="checkbox"
                    className="lp-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    aria-label="Remember me"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="lp-forgot">
                  Forgot password?
                </Link>
              </div>

              {/* Error message — accessible live region */}
              {error ? (
                <div
                  id="lp-error-msg"
                  role="alert"
                  aria-live="assertive"
                  className="lp-error"
                >
                  <AlertIcon />
                  <span>{error}</span>
                </div>
              ) : null}

              {/* Sign-in button */}
              <button
                className="lp-btn-primary"
                type="submit"
                disabled={authBusy}
                aria-busy={authBusy}
              >
                {authBusy ? (
                  <>
                    <span className="lp-spinner" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>

              {/* Divider */}
              <div className="lp-divider" aria-hidden="true">
                or continue with
              </div>

              {/* Google sign-in */}
              <button
                type="button"
                className="lp-btn-google"
                onClick={handleGoogle}
                disabled={authBusy}
                aria-label="Sign in with Google"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </form>

            {/* Footer */}
            <p className="lp-footer">
              New to ShadowChat?{" "}
              <Link to="/signup">Create an account</Link>
            </p>

            {/* Terms acknowledgment */}
            <p className="lp-terms">
              By signing in you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
