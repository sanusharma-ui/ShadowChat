import { ArrowLeft, Info, Phone, Video } from "lucide-react";
import Avatar from "./Avatar";
import { getConversationAvatar, getConversationSubtitle, getConversationTitle } from "../utils/chat";

export default function ChatHeader({
  conversation,
  currentUserId,
  typingUsers = [],
  socketConnected,
  onOpenProfile,
  onStartCall,
  onToggleSidebar,
}) {
  if (!conversation) {
    return (
      <header className="chat-header">
        <div className="chat-header-main">
          <button className="icon-button quiet mobile-menu-button" type="button" title="Show conversations" aria-label="Show conversations" onClick={onToggleSidebar}>
            <ArrowLeft size={19} aria-hidden="true" />
          </button>
          <div className="chat-heading-copy">
            <strong>ShadowChat</strong>
            <p>Private messaging, connected in real time</p>
          </div>
        </div>
      </header>
    );
  }

  const title = getConversationTitle(conversation, currentUserId);
  const defaultSubtitle = getConversationSubtitle(conversation, currentUserId);
  const avatar = getConversationAvatar(conversation, currentUserId);
  const isOnline = conversation.type === "direct" && defaultSubtitle === "Online";
  const isTyping = typingUsers.length > 0;
  const subtitle = isTyping
    ? `${typingUsers.map((user) => user.displayName || user.username || "Someone").join(", ")} typing…`
    : defaultSubtitle;

  return (
    <header className="chat-header">
      <div className="chat-header-main">
        <button className="icon-button quiet mobile-menu-button" type="button" title="Back to conversations" aria-label="Back to conversations" onClick={onToggleSidebar}>
          <ArrowLeft size={19} aria-hidden="true" />
        </button>
        <Avatar name={title} src={avatar} online={isOnline} size="md" />
        <div className="chat-heading-copy">
          <strong>{title}</strong>
          <p className={isTyping ? "presence-text typing" : isOnline ? "presence-text online" : "presence-text"}>
            {subtitle}
          </p>
        </div>
      </div>

      <div className="chat-header-actions">
        {!socketConnected ? <span className="header-connection-dot" title="Reconnecting" aria-label="Reconnecting" /> : null}
        <button className="icon-button quiet" type="button" title="Audio call" aria-label={`Start audio call with ${title}`} onClick={() => onStartCall("audio")} disabled={conversation.type !== "direct"}>
          <Phone size={18} aria-hidden="true" />
        </button>
        <button className="icon-button quiet" type="button" title="Video call" aria-label={`Start video call with ${title}`} onClick={() => onStartCall("video")} disabled={conversation.type !== "direct"}>
          <Video size={18} aria-hidden="true" />
        </button>
        <button className="icon-button quiet" type="button" title="Conversation information" aria-label="Conversation information" onClick={onOpenProfile}>
          <Info size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
