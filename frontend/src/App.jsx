import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AuthActionPage from "./pages/AuthActionPage";
import ChatPage from "./pages/ChatPage";

function LoaderScreen() {
  return (
    <div className="page-shell centered-page">
      <div className="glass-card loading-card">
        <div className="loader-ring" />
        <h2 style={{ margin: "0 0 6px", fontSize: "1.15rem", fontWeight: 700 }}>
          ShadowChat
        </h2>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
          Syncing your secure session…
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { initializing, firebaseUser } = useAuth();
  if (initializing) return <LoaderScreen />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { initializing, firebaseUser } = useAuth();
  if (initializing) return <LoaderScreen />;
  if (firebaseUser) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />

      <Route path="/auth/action" element={<AuthActionPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
