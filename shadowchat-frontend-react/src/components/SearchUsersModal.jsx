import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import api from "../lib/api";
import Avatar from "./Avatar";

export default function SearchUsersModal({ open, onClose, onStartConversation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBusy(true);
      setError("");
      try {
        const response = await api.get(`/users/search?q=${encodeURIComponent(query.trim())}`);
        setResults(response.data?.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, query]);

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card glass-card medium">
        <div className="modal-head">
          <div>
            <h3>Start a new chat</h3>
            <p>Search by name, username, or email.</p>
          </div>
          <button type="button" className="icon-button soft" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-searchbar large">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find people" autoFocus />
        </div>

        {busy ? <div className="muted-card">Searching…</div> : null}
        {error ? <div className="error-banner">{error}</div> : null}

        <div className="result-list custom-scroll">
          {results.map((user) => (
            <button key={user._id} className="search-user-row" type="button" onClick={() => onStartConversation(user)}>
              <Avatar name={user.displayName} src={user.avatarUrl} online={user.isOnline} />
              <div>
                <strong>{user.displayName || user.username}</strong>
                <p>@{user.username || "user"}</p>
              </div>
            </button>
          ))}
          {!busy && !results.length && query.trim() ? (
            <div className="empty-state compact">
              <h4>No users found</h4>
              <p>Try another search term.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
