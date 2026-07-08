import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Chrome } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, authBusy } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

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
      title="Welcome back"
      subtitle="Login with email or Google and continue your conversations instantly."
      footer={
        <p>
          Don&apos;t have an account? <Link to="/signup">Create one</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="input-wrap">
          <span>Email</span>
          <div className="input-with-icon">
            <Mail size={18} />
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
        </label>

        <label className="input-wrap">
          <span>Password</span>
          <div className="input-with-icon">
            <Lock size={18} />
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
        </label>

        {error ? <div className="error-banner">{error}</div> : null}

        <button className="primary-button" type="submit" disabled={authBusy}>
          {authBusy ? "Signing in…" : "Sign in"}
        </button>

        <button className="secondary-button" type="button" onClick={handleGoogle} disabled={authBusy}>
          <Chrome size={18} />
          Continue with Google
        </button>
      </form>

      <div className="auth-links-row">
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
    </AuthShell>
  );
}
