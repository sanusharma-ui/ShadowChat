import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, User } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../contexts/AuthContext";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, authBusy } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await signup(form);
      navigate("/app");
    } catch (err) {
      setError(err.message);
    }
  }

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
    <AuthShell
      title="Create your account"
      subtitle="Join ShadowChat — fast, private, beautifully designed."
      footer={
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="input-wrap">
          <span>Display name</span>
          <div className="input-with-icon">
            <User size={17} />
            <input
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
        </label>

        <label className="input-wrap">
          <span>Email</span>
          <div className="input-with-icon">
            <Mail size={17} />
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
        </label>

        <div className="dual-input-grid">
          <label className="input-wrap">
            <span>Password</span>
            <div className="input-with-icon">
              <Lock size={17} />
              <input
                type="password"
                placeholder="Min 6 chars"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
          </label>

          <label className="input-wrap">
            <span>Confirm password</span>
            <div className="input-with-icon">
              <Lock size={17} />
              <input
                type="password"
                placeholder="Repeat"
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>
          </label>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <button className="primary-button" type="submit" disabled={authBusy}>
          {authBusy ? "Creating account…" : "Create account"}
        </button>

        <div className="auth-divider">or</div>

        <button className="google-btn" type="button" onClick={handleGoogle} disabled={authBusy}>
          <GoogleIcon />
          Sign up with Google
        </button>
      </form>
    </AuthShell>
  );
}
