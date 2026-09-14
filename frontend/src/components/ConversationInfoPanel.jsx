import { MessageSquare, Users, X } from "lucide-react";
import Avatar from "./Avatar";
import { getConversationAvatar, getConversationSubtitle, getConversationTitle } from "../utils/chat";

export default function ConversationInfoPanel({ open, conversation, currentUserId, onClose }) {
  if (!open || !conversation) return null;

  const title = getConversationTitle(conversation, currentUserId);
  const subtitle = getConversationSubtitle(conversation, currentUserId);
  const avatar = getConversationAvatar(conversation, currentUserId);

  return (
    <div className="modal-backdrop align-right">
      <aside className="profile-panel glass-card">
        <div className="modal-head">
          <div>
            <h3>Conversation info</h3>
            <p>See participants and metadata for this chat.</p>
          </div>
          <button type="button" className="icon-button soft" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="profile-hero vertical">
          <Avatar name={title} src={avatar} size="xl" />
          <div>
            <strong>{title}</strong>
            <p>{subtitle}</p>
          </div>
        </div>

        <div className="info-stack custom-scroll">
          <div className="info-card">
            <MessageSquare size={18} />
            <div>
              <strong>{conversation.type === "group" ? "Group chat" : "Direct chat"}</strong>
              <p>{conversation.description || "No description yet."}</p>
            </div>
          </div>
          <div className="info-card">
            <Users size={18} />
            <div>
              <strong>{conversation.participants?.length || 0} participants</strong>
              <p>Created {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(conversation.createdAt))}</p>
            </div>
          </div>

          <div className="participant-list">
            {(conversation.participants || []).map((participant) => (
              <div key={participant.user?._id || participant.user} className="participant-row">
                <Avatar name={participant.user?.displayName} src={participant.user?.avatarUrl} online={participant.user?.isOnline} />
                <div>
                  <strong>{participant.user?.displayName || participant.user?.username}</strong>
                  <p>@{participant.user?.username || "user"}</p>
                </div>
                <span className="role-pill">{participant.role}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
