// src/components/ProfilePanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Mail, Save, ShieldCheck, Upload, UserRound, X, Trash2 } from "lucide-react";
import Avatar from "./Avatar";

export default function ProfilePanel({ open, profile, onClose, onSave, onResendVerification }) {
  const [form, setForm] = useState({
    displayName: profile?.displayName || "",
    username: profile?.username || "",
    avatarUrl: profile?.avatarUrl || "",
    bio: profile?.bio || "",
    statusMessage: profile?.statusMessage || ""
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileRef = useRef(null);

  useEffect(() => {
    setForm({
      displayName: profile?.displayName || "",
      username: profile?.username || "",
      avatarUrl: profile?.avatarUrl || "",
      bio: profile?.bio || "",
      statusMessage: profile?.statusMessage || ""
    });
    setAvatarFile(null);
  }, [profile]);

  const avatarPreviewUrl = useMemo(() => {
    if (!avatarFile) return "";
    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  if (!open || !profile) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        // If avatarFile is set, backend should treat it as the primary avatar update.
        avatarFile,
        // Optional: support explicit remove
        avatarRemoved: !avatarFile && !form.avatarUrl && Boolean(profile.avatarUrl)
      };

      await onSave(payload);
      setSuccess("Profile updated.");
      setAvatarFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerification() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await onResendVerification();
      setSuccess("Verification email sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function onPickAvatarFile() {
    fileRef.current?.click();
  }

  function onRemoveAvatar() {
    setAvatarFile(null);
    setForm((prev) => ({ ...prev, avatarUrl: "" }));
  }

  const avatarSrc = avatarPreviewUrl || form.avatarUrl || profile.avatarUrl || "";

  return (
    <div className="modal-backdrop align-right" role="dialog" aria-modal="true" aria-label="Profile">
      <aside className="profile-panel glass-card">
        <div className="modal-head">
          <div>
            <h3>Your profile</h3>
            <p>Control the identity everyone sees in ShadowChat.</p>
          </div>
          <button type="button" className="icon-button soft" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="profile-hero">
          <Avatar name={form.displayName} src={avatarSrc} size="xl" online={profile.isOnline} />
          <div>
            <strong>{profile.displayName || "Your name"}</strong>
            <p style={{ margin: "6px 0 0 0", color: "var(--muted)" }}>@{profile.username || "username"}</p>
            <small style={{ display: "block", marginTop: 4, color: "var(--muted-2)" }}>
              {profile.email || "No email"}
            </small>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button type="button" className="secondary-button" onClick={onPickAvatarFile} disabled={busy}>
                <Upload size={16} />
                Change photo
              </button>
              <button type="button" className="secondary-button danger" onClick={onRemoveAvatar} disabled={busy}>
                <Trash2 size={16} />
                Remove
              </button>
              <input
                ref={fileRef}
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const next = e.target.files?.[0] || null;
                  setAvatarFile(next);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>

        <div className="verification-card">
          <ShieldCheck size={18} />
          <div>
            <strong>{profile.emailVerified ? "Email verified" : "Email not verified"}</strong>
            <p style={{ margin: "6px 0 0 0", color: "var(--muted)" }}>{profile.email || "Add an email in Firebase Auth"}</p>
          </div>
          {!profile.emailVerified ? (
            <button className="secondary-button slim" type="button" onClick={handleVerification} disabled={busy}>
              Send link
            </button>
          ) : null}
        </div>

        <form className="profile-form custom-scroll" onSubmit={handleSubmit}>
          <label className="input-wrap">
            <span>Display name</span>
            <div className="input-with-icon">
              <UserRound size={18} />
              <input
                value={form.displayName}
                onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
              />
            </div>
          </label>

          <label className="input-wrap">
            <span>Username</span>
            <input
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            />
          </label>

          <label className="input-wrap">
            <span>Avatar URL (optional)</span>
            <input
              value={form.avatarUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
              placeholder="https://..."
            />
          </label>

          <label className="input-wrap">
            <span>Email</span>
            <div className="input-with-icon">
              <Mail size={18} />
              <input value={profile.email || ""} disabled />
            </div>
          </label>

          <label className="input-wrap">
            <span>Status message</span>
            <input
              value={form.statusMessage}
              onChange={(e) => setForm((prev) => ({ ...prev, statusMessage: e.target.value }))}
            />
          </label>

          <label className="input-wrap">
            <span>Bio</span>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              rows={4}
            />
          </label>

          {error ? <div className="error-banner">{error}</div> : null}
          {success ? <div className="success-banner">{success}</div> : null}

          <button className="primary-button" type="submit" disabled={busy}>
            <Save size={16} />
            {busy ? "Saving…" : "Save profile"}
          </button>
        </form>
      </aside>
    </div>
  );
}
