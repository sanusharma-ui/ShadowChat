import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../contexts/AuthContext";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ error: "", success: "", busy: false });

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ error: "", success: "", busy: true });
    try {
      await requestPasswordReset(email);
      setState({ error: "", success: "Reset link sent! Check your inbox.", busy: false });
    } catch (error) {
      setState({ error: error.message, success: "", busy: false });
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll send a secure reset link to your inbox."
      footer={
        <p>
          Remembered it? <Link to="/login">Back to sign in</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="input-wrap">
          <span>Email address</span>
          <div className="input-with-icon">
            <Mail size={17} />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </label>

        {state.error ? <div className="error-banner">{state.error}</div> : null}
        {state.success ? <div className="success-banner">{state.success}</div> : null}

        <button className="primary-button" type="submit" disabled={state.busy}>
          {state.busy ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
