import { Info, Menu, Phone, Video } from "lucide-react";
import Avatar from "./Avatar";
import { getConversationAvatar, getConversationSubtitle, getConversationTitle } from "../utils/chat";

export default function ChatHeader({
  conversation,
  currentUserId,
  onOpenProfile,
  onStartCall,
  onToggleSidebar,
}) {
  if (!conversation) {
    return (
      <header className="chat-header glass-panel">
        <div className="chat-header-main">
          <button
            className="icon-button mobile-menu-button"
            type="button"
            title="Chats"
            onClick={onToggleSidebar}
          >
            <Menu size={18} />
          </button>
          <div>
            <strong>Select a conversation</strong>
            <p>Pick a chat from the sidebar or start a new one.</p>
          </div>
        </div>
      </header>
    );
  }

  const title = getConversationTitle(conversation, currentUserId);
  const subtitle = getConversationSubtitle(conversation, currentUserId);
  const avatar = getConversationAvatar(conversation, currentUserId);
  const isOnline = conversation.type === "direct" && subtitle === "Online";

  return (
    <header className="chat-header glass-panel">
      <div className="chat-header-main">
        <button
          className="icon-button mobile-menu-button"
          type="button"
          title="Chats"
          onClick={onToggleSidebar}
        >
          <Menu size={18} />
        </button>

        <Avatar name={title} src={avatar} online={isOnline} size="md" />

        <div>
          <strong>{title}</strong>
          <p style={{ color: isOnline ? "var(--success)" : undefined }}>{subtitle}</p>
        </div>
      </div>

      <div className="chat-header-actions">
        <button
          className="icon-button"
          type="button"
          title="Voice call"
          onClick={() => onStartCall("audio")}
          disabled={conversation.type !== "direct"}
        >
          <Phone size={17} />
        </button>
        <button
          className="icon-button"
          type="button"
          title="Video call"
          onClick={() => onStartCall("video")}
          disabled={conversation.type !== "direct"}
        >
          <Video size={17} />
        </button>
        <button
          className="icon-button"
          type="button"
          title="Conversation info"
          onClick={onOpenProfile}
        >
          <Info size={17} />
        </button>
      </div>
    </header>
  );
}