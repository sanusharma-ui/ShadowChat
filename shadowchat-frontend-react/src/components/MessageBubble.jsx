import { CheckCheck, CornerUpLeft, FileText, Pencil, Play, SmilePlus, Trash2 } from "lucide-react";
import Avatar from "./Avatar";
import { formatTime } from "../utils/chat";

function AttachmentPreview({ attachment, messageType }) {
  if (!attachment) return null;
  if (messageType === "image") {
    return <img className="message-image" src={attachment.url} alt={attachment.fileName || "attachment"} />;
  }
  if (messageType === "video") {
    return <video className="message-video" src={attachment.url} controls preload="metadata" />;
  }
  if (messageType === "voice" || messageType === "audio") {
    return <audio className="message-audio" src={attachment.url} controls preload="metadata" />;
  }

  return (
    <a className="file-chip" href={attachment.url} target="_blank" rel="noreferrer">
      <FileText size={16} />
      <span>{attachment.fileName || "File"}</span>
    </a>
  );
}

function ReactionStrip({ reactions = [], onReact }) {
  if (!reactions.length) return null;
  return (
    <div className="reaction-strip">
      {reactions.map((reaction) => (
        <button key={reaction.emoji} type="button" className="reaction-pill" onClick={() => onReact(reaction.emoji)}>
          <span>{reaction.emoji}</span>
          <small>{reaction.users?.length || 0}</small>
        </button>
      ))}
    </div>
  );
}

export default function MessageBubble({
  message,
  isMine,
  showAvatar,
  senderName,
  onDelete,
  onStartReply,
  onStartEdit,
  onReact
}) {
  const attachment = message.attachments?.[0];
  const deleted = message.deletedForEveryone;

  return (
    <div className={`message-row ${isMine ? "mine" : ""}`}>
      {!isMine ? (
        showAvatar ? <Avatar name={senderName} src={message.sender?.avatarUrl} size="sm" /> : <div className="avatar-spacer" />
      ) : null}

      <div className={`message-bubble ${isMine ? "mine" : ""} ${deleted ? "deleted" : ""}`}>
        {!isMine && showAvatar ? <strong className="message-author">{senderName}</strong> : null}

        {message.replyTo ? (
          <div className="reply-chip">
            <CornerUpLeft size={14} />
            <div>
              <strong>{message.replyTo?.sender?.displayName || "Reply"}</strong>
              <span>{message.replyTo?.text || `[${message.replyTo?.type || "message"}]`}</span>
            </div>
          </div>
        ) : null}

        {attachment ? <AttachmentPreview attachment={attachment} messageType={message.type} /> : null}
        {message.text ? <p className="message-text">{message.text}</p> : null}
        {!message.text && deleted ? <p className="message-text muted-italic">This message was deleted.</p> : null}

        <ReactionStrip reactions={message.reactions} onReact={onReact} />

        <div className="message-meta">
          <span>{formatTime(message.createdAt)}</span>
          {message.editedAt ? <span className="edited-chip">edited</span> : null}
          {isMine ? <CheckCheck size={14} /> : null}
        </div>

        {!deleted ? (
          <div className="message-tools">
            <button type="button" className="icon-button soft small" title="Reply" onClick={onStartReply}>
              <CornerUpLeft size={14} />
            </button>
            {isMine ? (
              <>
                <button type="button" className="icon-button soft small" title="Edit" onClick={onStartEdit}>
                  <Pencil size={14} />
                </button>
                <button type="button" className="icon-button soft small danger" title="Delete" onClick={onDelete}>
                  <Trash2 size={14} />
                </button>
              </>
            ) : null}
            <button type="button" className="icon-button soft small" title="React" onClick={() => onReact("❤️")}>
              <SmilePlus size={14} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
