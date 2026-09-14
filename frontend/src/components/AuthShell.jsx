import { MessageCircleMore, ShieldCheck, Sparkles } from "lucide-react";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="page-shell auth-page-shell">
      <div className="auth-grid">

        {/* ── Left: Brand Panel ── */}
        <section className="brand-panel">
          <div>
            <div className="brand-badge">✦ ShadowChat</div>
            <h1>Where privacy meets real-time speed.</h1>
            <p>
              End-to-end secured messaging, voice &amp; video calls, reactions,
              file sharing — all in one beautifully crafted experience.
            </p>

            <div className="feature-stack">
              <div className="feature-pill">
                <MessageCircleMore size={17} />
                DMs, groups, reactions, voice notes &amp; file uploads
              </div>
              <div className="feature-pill">
                <ShieldCheck size={17} />
                Firebase auth, Google sign-in &amp; protected sessions
              </div>
              <div className="feature-pill">
                <Sparkles size={17} />
                Live presence, typing indicators &amp; real-time calls
              </div>
            </div>
          </div>

          {/* Subtle bottom credit */}
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: 24 }}>
            Powered by React · Node.js · MongoDB · Socket.IO
          </p>
        </section>

        {/* ── Right: Auth Card ── */}
        <section className="auth-card">
          <div className="auth-copy">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          {children}

          {footer ? <div className="auth-footer">{footer}</div> : null}
        </section>

      </div>
    </div>
  );
}
