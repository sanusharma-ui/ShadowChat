import { LogOut, Moon, PencilLine, Search, Sun, Users, X } from "lucide-react";
import Avatar from "./Avatar";
import { useTheme } from "../contexts/ThemeContext";
import { formatTime, getConversationAvatar, getConversationTitle } from "../utils/chat";

function ConversationItem({ conversation, currentUserId, active, onSelect, index }) {
  const title = getConversationTitle(conversation, currentUserId);
  const avatar = getConversationAvatar(conversation, currentUserId);
  const preview =
    conversation.lastMessage?.text ||
    (conversation.lastMessage?.type ? `[${conversation.lastMessage.type}]` : "No messages yet");
  const isOnline =
    conversation.type === "direct" &&
    conversation.participants?.some(
      (p) =>
        String(p.user?._id || p.user) !== String(currentUserId) && p.user?.isOnline
    );

  return (
    <button
      className={`conversation-item ${active ? "active" : ""}`}
      onClick={() => onSelect(conversation)}
      type="button"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <Avatar name={title} src={avatar} online={isOnline} />
      <div className="conversation-item-main">
        <div className="conversation-item-row">
          <strong>{title}</strong>
          <span>
            {conversation.lastMessage?.createdAt
              ? formatTime(conversation.lastMessage.createdAt)
              : ""}
          </span>
        </div>
        <p>{preview || "No messages yet"}</p>
      </div>
    </button>
  );
}

export default function Sidebar({
  profile,
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenSearch,
  onOpenGroup,
  onOpenProfile,
  onLogout,
  conversationFilter,
  setConversationFilter,
  mobileOpen = false,
  onCloseMobile,
}) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-scrim show" onClick={onCloseMobile} />
      )}

      <aside className={`sidebar glass-panel ${mobileOpen ? "mobile-open" : ""}`}>
        {/* ── Profile Row ── */}
        <div className="sidebar-top">
          <button className="profile-row" type="button" onClick={onOpenProfile}>
            <Avatar name={profile?.displayName} src={profile?.avatarUrl} size="lg" online />
            <div>
              <strong>{profile?.displayName || "Your profile"}</strong>
              <span>@{profile?.username || "newuser"}</span>
            </div>
          </button>

          <button
            type="button"
            className="icon-button mobile-close"
            onClick={onCloseMobile}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Actions Bar ── */}
        <div className="sidebar-actions">
          <button type="button" className="icon-button" onClick={onOpenSearch} title="Search users">
            <Search size={17} />
          </button>
          <button type="button" className="icon-button" onClick={onOpenGroup} title="New group">
            <Users size={17} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={toggleTheme}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button type="button" className="icon-button" onClick={onLogout} title="Sign out">
            <LogOut size={17} />
          </button>
        </div>

        {/* ── Search Bar ── */}
        <div className="sidebar-searchbar">
          <Search size={15} />
          <input
            placeholder="Search conversations…"
            value={conversationFilter}
            onChange={(e) => setConversationFilter(e.target.value)}
          />
          <button
            type="button"
            className="icon-button soft"
            onClick={onOpenSearch}
            title="New chat"
            style={{ width: 28, height: 28 }}
          >
            <PencilLine size={15} />
          </button>
        </div>

        {/* ── Conversation List ── */}
        <div className="conversation-list custom-scroll">
          {conversations.length ? (
            conversations.map((conversation, i) => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                currentUserId={profile?._id}
                active={activeConversationId === conversation._id}
                onSelect={onSelectConversation}
                index={i}
              />
            ))
          ) : (
            <div className="empty-state compact">
              <h4>No chats yet</h4>
              <p>Search for someone or create a group to begin.</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
