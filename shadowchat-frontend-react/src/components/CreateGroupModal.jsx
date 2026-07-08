import { useEffect, useMemo, useState } from "react";
import { Search, Users, X } from "lucide-react";
import api from "../lib/api";
import Avatar from "./Avatar";

export default function CreateGroupModal({ open, onClose, onCreated }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await api.get(`/users/search?q=${encodeURIComponent(query.trim())}`);
        setResults(response.data?.data || []);
      } catch (err) {
        setError(err.message);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [open, query]);

  const selectedIds = useMemo(() => new Set(selected.map((user) => user._id)), [selected]);

  function toggleUser(user) {
    setSelected((prev) =>
      prev.some((item) => item._id === user._id) ? prev.filter((item) => item._id !== user._id) : [...prev, user]
    );
  }

  async function handleCreate(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await api.post("/conversations/group", {
        title: form.title,
        description: form.description,
        participantIds: selected.map((user) => user._id)
      });
      onCreated(response.data?.data);
      setForm({ title: "", description: "" });
      setQuery("");
      setResults([]);
      setSelected([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card glass-card medium">
        <div className="modal-head">
          <div>
            <h3>Create a group</h3>
            <p>Add at least two people besides yourself.</p>
          </div>
          <button type="button" className="icon-button soft" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="group-form" onSubmit={handleCreate}>
          <label className="input-wrap">
            <span>Group title</span>
            <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required />
          </label>
          <label className="input-wrap">
            <span>Description</span>
            <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} />
          </label>

          <div className="sidebar-searchbar large">
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people to add" />
          </div>

          {selected.length ? (
            <div className="selected-users">
              {selected.map((user) => (
                <button key={user._id} className="selected-chip" type="button" onClick={() => toggleUser(user)}>
                  <Avatar name={user.displayName} src={user.avatarUrl} size="xs" />
                  <span>{user.displayName || user.username}</span>
                  <X size={12} />
                </button>
              ))}
            </div>
          ) : null}

          <div className="result-list custom-scroll short">
            {results.map((user) => (
              <button key={user._id} className="search-user-row" type="button" onClick={() => toggleUser(user)}>
                <Avatar name={user.displayName} src={user.avatarUrl} online={user.isOnline} />
                <div>
                  <strong>{user.displayName || user.username}</strong>
                  <p>@{user.username || "user"}</p>
                </div>
                <div className={`select-toggle ${selectedIds.has(user._id) ? "selected" : ""}`}>
                  <Users size={14} />
                </div>
              </button>
            ))}
          </div>

          {error ? <div className="error-banner">{error}</div> : null}

          <button className="primary-button" type="submit" disabled={busy || selected.length < 2}>
            {busy ? "Creating group…" : "Create group"}
          </button>
        </form>
      </div>
    </div>
  );
}
