import { LogOut, Moon, PencilLine, Search, Sun, Users, X } from "lucide-react";
import Avatar from "./Avatar";
import { useTheme } from "../contexts/ThemeContext";
import { formatTime, getConversationAvatar, getConversationTitle } from "../utils/chat";

function ConversationItem({ conversation, currentUserId, active, onSelect }) {
  const title = getConversationTitle(conversation, currentUserId);
  const avatar = getConversationAvatar(conversation, currentUserId);
  const preview = conversation.lastMessage?.text || (conversation.lastMessage?.type ? `[${conversation.lastMessage.type}]` : "No messages yet");

  return (
    <button
      className={`conversation-item ${active ? "active" : ""}`}
      onClick={() => onSelect(conversation)}
      type="button"
    >
      <Avatar
        name={title}
        src={avatar}
        online={conversation.type === "direct" && conversation.participants?.some((participant) => String(participant.user?._id || participant.user) !== String(currentUserId) && participant.user?.isOnline)}
      />
      <div className="conversation-item-main">
        <div className="conversation-item-row">
          <strong>{title}</strong>
          <span>{conversation.lastMessage?.createdAt ? formatTime(conversation.lastMessage.createdAt) : ""}</span>
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
  onCloseMobile
}) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <aside className={`sidebar glass-panel ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-top">
        <button className="profile-row" type="button" onClick={onOpenProfile}>
          <Avatar name={profile?.displayName} src={profile?.avatarUrl} size="lg" online />
          <div>
            <strong>{profile?.displayName || "Your profile"}</strong>
            <span>@{profile?.username || "newuser"}</span>
          </div>
        </button>
        <button type="button" className="icon-button mobile-close" onClick={onCloseMobile} title="Close chats">
          <X size={18} />
        </button>
        <div className="sidebar-actions">
          <button type="button" className="icon-button" onClick={onOpenSearch} title="Search users">
            <Search size={18} />
          </button>
          <button type="button" className="icon-button" onClick={onOpenGroup} title="Create group">
            <Users size={18} />
          </button>
          <button type="button" className="icon-button" onClick={toggleTheme} title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button type="button" className="icon-button" onClick={onLogout} title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="sidebar-searchbar">
        <Search size={16} />
        <input
          placeholder="Search conversations"
          value={conversationFilter}
          onChange={(e) => setConversationFilter(e.target.value)}
        />
        <button type="button" className="icon-button soft" onClick={onOpenSearch} title="Start new chat">
          <PencilLine size={16} />
        </button>
      </div>

      <div className="conversation-list custom-scroll">
        {conversations.length ? (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation._id}
              conversation={conversation}
              currentUserId={profile?._id}
              active={activeConversationId === conversation._id}
              onSelect={onSelectConversation}
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
  );
}
