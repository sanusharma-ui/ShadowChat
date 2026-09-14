import { CheckCheck, CornerUpLeft, FileText, Pencil, SmilePlus, Trash2 } from "lucide-react";
import Avatar from "./Avatar";
import { formatTime } from "../utils/chat";

function AttachmentPreview({ attachment, messageType }) {
  if (!attachment) return null;

  if (messageType === "image") {
    return (
      <img
        className="message-image"
        src={attachment.url}
        alt={attachment.fileName || "attachment"}
        loading="lazy"
      />
    );
  }
  if (messageType === "video") {
    return <video className="message-video" src={attachment.url} controls preload="metadata" />;
  }
  if (messageType === "voice" || messageType === "audio") {
    return <audio className="message-audio" src={attachment.url} controls preload="metadata" />;
  }

  return (
    <a className="file-chip" href={attachment.url} target="_blank" rel="noreferrer">
      <FileText size={15} />
      <span>{attachment.fileName || "File"}</span>
    </a>
  );
}

function ReactionStrip({ reactions = [], onReact }) {
  if (!reactions.length) return null;
  return (
    <div className="reaction-strip">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          className="reaction-pill"
          onClick={() => onReact(reaction.emoji)}
        >
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
  onReact,
}) {
  const attachment = message.attachments?.[0];
  const deleted = message.deletedForEveryone;

  return (
    <div className={`message-row ${isMine ? "mine" : ""}`}>
      {/* Avatar / spacer on the left for others' messages */}
      {!isMine ? (
        showAvatar ? (
          <Avatar name={senderName} src={message.sender?.avatarUrl} size="sm" />
        ) : (
          <div className="avatar-spacer" />
        )
      ) : null}

      {/* Bubble */}
      <div className={`message-bubble ${isMine ? "mine" : ""} ${deleted ? "deleted" : ""}`}>
        {/* Author name in group chats */}
        {!isMine && showAvatar ? (
          <strong className="message-author">{senderName}</strong>
        ) : null}

        {/* Reply preview */}
        {message.replyTo ? (
          <div className="reply-chip">
            <CornerUpLeft size={13} />
            <div>
              <strong>{message.replyTo?.sender?.displayName || "Reply"}</strong>
              <span>{message.replyTo?.text || `[${message.replyTo?.type || "message"}]`}</span>
            </div>
          </div>
        ) : null}

        {/* Attachment */}
        {attachment ? (
          <AttachmentPreview attachment={attachment} messageType={message.type} />
        ) : null}

        {/* Text */}
        {message.text ? <p className="message-text">{message.text}</p> : null}
        {!message.text && deleted ? (
          <p className="message-text muted-italic">This message was deleted.</p>
        ) : null}

        {/* Reactions */}
        <ReactionStrip reactions={message.reactions} onReact={onReact} />

        {/* Meta: time + edited + read tick */}
        <div className="message-meta">
          <span>{formatTime(message.createdAt)}</span>
          {message.editedAt ? <span className="edited-chip">edited</span> : null}
          {isMine ? <CheckCheck size={13} /> : null}
        </div>

        {/* Hover action toolbar */}
        {!deleted ? (
          <div className="message-tools">
            <button
              type="button"
              className="icon-button soft small"
              title="Reply"
              onClick={onStartReply}
            >
              <CornerUpLeft size={13} />
            </button>
            {isMine ? (
              <>
                <button
                  type="button"
                  className="icon-button soft small"
                  title="Edit"
                  onClick={onStartEdit}
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className="icon-button soft small danger"
                  title="Delete"
                  onClick={onDelete}
                >
                  <Trash2 size={13} />
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="icon-button soft small"
              title="React"
              onClick={() => onReact("❤️")}
            >
              <SmilePlus size={13} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
