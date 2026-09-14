import {
  BellOff,
  LogOut,
  Moon,
  PencilLine,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react";
import Avatar from "./Avatar";
import { useTheme } from "../contexts/ThemeContext";
import { formatTime, getConversationAvatar, getConversationTitle } from "../utils/chat";

function getConversationState(conversation, currentUserId) {
  const me = conversation.participants?.find(
    (participant) => String(participant.user?._id || participant.user) === String(currentUserId)
  );
  const lastMessageAt = conversation.lastMessage?.createdAt
    ? new Date(conversation.lastMessage.createdAt).getTime()
    : 0;
  const lastReadAt = me?.lastReadAt ? new Date(me.lastReadAt).getTime() : 0;
  const fromSomeoneElse =
    conversation.lastMessage?.sender &&
    String(conversation.lastMessage.sender?._id || conversation.lastMessage.sender) !==
      String(currentUserId);

  return {
    unread: Boolean(fromSomeoneElse && lastMessageAt > lastReadAt),
    muted: Boolean(me?.mutedUntil && new Date(me.mutedUntil).getTime() > Date.now()),
  };
}

function ConversationItem({
  conversation,
  currentUserId,
  active,
  onSelect,
  typingUsers = [],
}) {
  const title = getConversationTitle(conversation, currentUserId);
  const avatar = getConversationAvatar(conversation, currentUserId);
  const { unread, muted } = getConversationState(conversation, currentUserId);
  const isTyping = typingUsers.length > 0;
  const preview = isTyping
    ? `${typingUsers.map((user) => user.displayName || user.username || "Someone").join(", ")} typing…`
    : conversation.lastMessage?.text ||
      (conversation.lastMessage?.type ? `[${conversation.lastMessage.type}]` : "No messages yet");
  const isOnline =
    conversation.type === "direct" &&
    conversation.participants?.some(
      (participant) =>
        String(participant.user?._id || participant.user) !== String(currentUserId) &&
        participant.user?.isOnline
    );

  return (
    <button
      className={`conversation-item ${active ? "active" : ""} ${unread ? "unread" : ""}`}
      onClick={() => onSelect(conversation)}
      type="button"
      aria-current={active ? "page" : undefined}
    >
      <Avatar name={title} src={avatar} online={isOnline} size="lg" />
      <span className="conversation-item-main">
        <span className="conversation-item-row">
          <strong>{title}</strong>
          <span className="conversation-time">
            {conversation.lastMessage?.createdAt
              ? formatTime(conversation.lastMessage.createdAt)
              : ""}
          </span>
        </span>
        <span className="conversation-preview-row">
          <span className={isTyping ? "conversation-preview typing" : "conversation-preview"}>
            {preview || "No messages yet"}
          </span>
          {muted ? <BellOff className="muted-icon" size={13} aria-label="Muted" /> : null}
          {unread ? <span className="unread-dot" aria-label="Unread messages" /> : null}
        </span>
      </span>
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
  typingByConversation = {},
  socketConnected = false,
  mobileOpen = false,
  onCloseMobile,
}) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      {mobileOpen ? (
        <button
          className="sidebar-scrim show"
          onClick={onCloseMobile}
          type="button"
          aria-label="Close conversation list"
        />
      ) : null}

      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`} aria-label="Conversations">
        <div className="sidebar-top">
          <button className="profile-row" type="button" onClick={onOpenProfile}>
            <Avatar name={profile?.displayName} src={profile?.avatarUrl} size="lg" online={socketConnected} />
            <span className="profile-copy">
              <strong>{profile?.displayName || "Your profile"}</strong>
              <span>@{profile?.username || "newuser"}</span>
            </span>
          </button>

          <div className="sidebar-profile-actions">
            <button type="button" className="icon-button quiet" onClick={onOpenProfile} title="Profile settings" aria-label="Profile settings">
              <Settings size={17} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button quiet" onClick={toggleTheme} title={isDark ? "Use light theme" : "Use dark theme"} aria-label={isDark ? "Use light theme" : "Use dark theme"}>
              {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
            </button>
            <button type="button" className="icon-button quiet" onClick={onLogout} title="Sign out" aria-label="Sign out">
              <LogOut size={17} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button quiet mobile-close" onClick={onCloseMobile} title="Close conversations" aria-label="Close conversations">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="sidebar-heading">
          <div>
            <span className="eyebrow">Messages</span>
            <h1>Conversations</h1>
          </div>
          <button type="button" className="icon-button new-conversation-button" onClick={onOpenSearch} title="New conversation" aria-label="New conversation">
            <PencilLine size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="sidebar-search-row">
          <div className="sidebar-searchbar" role="search">
            <Search size={16} aria-hidden="true" />
            <input type="search" aria-label="Search conversations" placeholder="Search conversations" value={conversationFilter} onChange={(event) => setConversationFilter(event.target.value)} />
            {conversationFilter ? (
              <button type="button" className="search-clear" onClick={() => setConversationFilter("")} title="Clear search" aria-label="Clear conversation search">
                <X size={15} aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <button type="button" className="icon-button quiet group-button" onClick={onOpenGroup} title="Create group" aria-label="Create group">
            <Users size={18} aria-hidden="true" />
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
                typingUsers={typingByConversation[conversation._id] || []}
              />
            ))
          ) : (
            <div className="empty-state compact">
              <div className="empty-state-icon"><Search size={19} aria-hidden="true" /></div>
              <h4>{conversationFilter ? "No conversations found" : "No conversations yet"}</h4>
              <p>{conversationFilter ? "Try a different name or clear your search." : "Start a private chat or create a group."}</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
