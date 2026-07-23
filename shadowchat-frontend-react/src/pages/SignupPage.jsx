import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Chrome } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../contexts/AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, authBusy } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
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
      subtitle="Set up your profile, unlock Google sign-in, and jump into real-time messaging."
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
            <User size={18} />
            <input
              type="text"
              placeholder="Sanu Sharma"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
        </label>

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

        <div className="dual-input-grid">
          <label className="input-wrap">
            <span>Password</span>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                placeholder="At least 6 chars"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
          </label>

          <label className="input-wrap">
            <span>Confirm password</span>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>
          </label>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <button className="primary-button" type="submit" disabled={authBusy}>
          {authBusy ? "Creating account..." : "Create account"}
        </button>

        <button className="secondary-button" type="button" onClick={handleGoogle} disabled={authBusy}>
          <Chrome size={18} />
          Sign up with Google
        </button>
      </form>
    </AuthShell>
  );
}
