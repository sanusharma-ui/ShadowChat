import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode
} from "firebase/auth";
import AuthShell from "../components/AuthShell";
import { auth } from "../lib/firebase";

export default function AuthActionPage() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode") || "";

  const [state, setState] = useState({
    loading: true,
    error: "",
    success: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const title = useMemo(() => {
    if (mode === "resetPassword") return "Reset your password";
    if (mode === "verifyEmail") return "Verify your email";
    return "Account action";
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      try {
        if (!oobCode || !mode) throw new Error("Invalid action link");

        if (mode === "verifyEmail") {
          await checkActionCode(auth, oobCode);
        } else if (mode === "resetPassword") {
          const email = await verifyPasswordResetCode(auth, oobCode);
          if (!cancelled) {
            setState((prev) => ({ ...prev, email }));
          }
        }

        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      } catch (error) {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false, error: error.message }));
        }
      }
    }

    prepare();
    return () => {
      cancelled = true;
    };
  }, [mode, oobCode]);

  async function handleVerify() {
    setState((prev) => ({ ...prev, error: "", success: "", loading: true }));
    try {
      await applyActionCode(auth, oobCode);
      setState((prev) => ({ ...prev, loading: false, success: "Email verified successfully." }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setState((prev) => ({ ...prev, error: "", success: "" }));

    if (state.password.length < 6) {
      setState((prev) => ({ ...prev, error: "Password must be at least 6 characters." }));
      return;
    }
    if (state.password !== state.confirmPassword) {
      setState((prev) => ({ ...prev, error: "Passwords do not match." }));
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, state.password);
      setState((prev) => ({ ...prev, success: "Password reset complete. You can now log in." }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  }

  return (
    <AuthShell
      title={title}
      subtitle="Handle Firebase action links for verification and password resets inside ShadowChat."
      footer={
        <p>
          <Link to="/login">Go to login</Link>
        </p>
      }
    >
      <div className="auth-form">
        {state.loading ? <div className="muted-card">Preparing action…</div> : null}
        {state.error ? <div className="error-banner">{state.error}</div> : null}
        {state.success ? <div className="success-banner">{state.success}</div> : null}

        {!state.loading && mode === "verifyEmail" && !state.success ? (
          <button className="primary-button" type="button" onClick={handleVerify}>
            Verify email
          </button>
        ) : null}

        {!state.loading && mode === "resetPassword" && !state.success ? (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <label className="input-wrap">
              <span>Email</span>
              <input value={state.email} disabled />
            </label>
            <label className="input-wrap">
              <span>New password</span>
              <input
                type="password"
                value={state.password}
                onChange={(e) => setState((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </label>
            <label className="input-wrap">
              <span>Confirm password</span>
              <input
                type="password"
                value={state.confirmPassword}
                onChange={(e) => setState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </label>
            <button className="primary-button" type="submit">
              Save new password
            </button>
          </form>
        ) : null}
      </div>
    </AuthShell>
  );
}
