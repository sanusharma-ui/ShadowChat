import { MessageCircleMore, ShieldCheck, Sparkles } from "lucide-react";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="page-shell auth-page-shell">
      <div className="auth-grid">
        <section className="brand-panel glass-card">
          <div className="brand-badge">ShadowChat</div>
          <h1>Private conversations, dreamy design, real-time speed.</h1>
          <p>
            Sign in with email, Google, and Firebase-powered security while your chats stay synced with
            MongoDB and Socket.IO in real time.
          </p>

          <div className="feature-stack">
            <div className="feature-pill">
              <MessageCircleMore size={18} />
              Direct chats, groups, reactions, uploads, voice notes
            </div>
            <div className="feature-pill">
              <ShieldCheck size={18} />
              Firebase sign-in, Google auth, reset flows, protected backend
            </div>
            <div className="feature-pill">
              <Sparkles size={18} />
              Clean WhatsApp-style layout with profile, search, calls, and presence
            </div>
          </div>
        </section>

        <section className="auth-card glass-card">
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
